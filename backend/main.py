from typing import List, Literal

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import case, func, or_
import models
from database import Base, engine, get_database

import math


app = FastAPI(title="PO Viewer API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Tự động tạo bảng nếu chưa tồn tại.
Base.metadata.create_all(bind=engine)


# =========================================================
# Request models
# =========================================================

class PurchaseOrderItemRequest(BaseModel):
    product: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class PurchaseOrderCreate(BaseModel):
    po_number: str = Field(min_length=1)
    supplier: str = Field(min_length=1)
    order_date: str
    status: str
    items: List[PurchaseOrderItemRequest]


class PurchaseOrderUpdate(BaseModel):
    po_number: str = Field(min_length=1)
    supplier: str = Field(min_length=1)
    order_date: str
    status: str
    items: List[PurchaseOrderItemRequest]


class PurchaseOrderSummaryResponse(BaseModel):
    total: int
    open: int
    approved: int
    completed: int
    total_value: float
    average_value: float

VALID_STATUSES = {
    "Open",
    "Approved",
    "Completed",
}

ALLOWED_STATUS_TRANSITIONS = {
    "Open": {"Open", "Approved"},
    "Approved": {"Approved", "Completed"},
    "Completed": {"Completed"},
}
# =========================================================
# Helper functions
# =========================================================
def has_purchase_order_content_changed(
    purchase_order: models.PurchaseOrder,
    updated_po: PurchaseOrderUpdate,
):
    current_items = [
        {
            "product": item.product,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in purchase_order.items
    ]

    updated_items = [
        {
            "product": item.product.strip(),
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in updated_po.items
    ]

    return any(
        [
            purchase_order.po_number
            != updated_po.po_number.strip(),

            purchase_order.supplier
            != updated_po.supplier.strip(),

            purchase_order.order_date
            != updated_po.order_date,

            current_items != updated_items,
        ]
    )

def validate_status(status: str):
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Allowed values: Open, Approved, Completed"
            ),
        )

def validate_status_transition(
    current_status: str,
    new_status: str,
):
    validate_status(new_status)

    allowed_statuses = ALLOWED_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change status from "
                f"{current_status} to {new_status}"
            ),
        )

    
def calculate_total(items: List[PurchaseOrderItemRequest]):
    return sum(
        item.quantity * item.unit_price
        for item in items
    )


def purchase_order_to_response(
    purchase_order: models.PurchaseOrder,
):
    return {
        "id": purchase_order.id,
        "po_number": purchase_order.po_number,
        "supplier": purchase_order.supplier,
        "order_date": purchase_order.order_date,
        "status": purchase_order.status,
        "total_amount": purchase_order.total_amount,
        "items": [
            {
                "id": item.id,
                "product": item.product,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in purchase_order.items
        ],
    }


def get_purchase_order_or_404(
    database: Session,
    po_id: int,
):
    purchase_order = (
        database.query(models.PurchaseOrder)
        .options(
            selectinload(models.PurchaseOrder.items)
        )
        .filter(models.PurchaseOrder.id == po_id)
        .first()
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found",
        )

    return purchase_order


def seed_database(database: Session):
    current_count = (
        database.query(models.PurchaseOrder)
        .count()
    )

    if current_count > 0:
        return

    seed_data = [
        {
            "po_number": "PO-2026-001",
            "supplier": "ABC Trading",
            "order_date": "2026-07-20",
            "status": "Open",
            "items": [
                {
                    "product": "Laptop",
                    "quantity": 2,
                    "unit_price": 500,
                },
                {
                    "product": "Monitor",
                    "quantity": 2,
                    "unit_price": 250,
                },
            ],
        },
        {
            "po_number": "PO-2026-002",
            "supplier": "Global Office Supplies",
            "order_date": "2026-07-22",
            "status": "Approved",
            "items": [
                {
                    "product": "Office Chair",
                    "quantity": 5,
                    "unit_price": 150,
                },
            ],
        },
    ]

    for data in seed_data:
        total_amount = sum(
            item["quantity"] * item["unit_price"]
            for item in data["items"]
        )

        purchase_order = models.PurchaseOrder(
            po_number=data["po_number"],
            supplier=data["supplier"],
            order_date=data["order_date"],
            status=data["status"],
            total_amount=total_amount,
        )

        purchase_order.items = [
            models.PurchaseOrderItem(
                product=item["product"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
            )
            for item in data["items"]
        ]

        database.add(purchase_order)

    database.commit()


# =========================================================
# API endpoints
# =========================================================

@app.get("/")
def home():
    return {
        "message": "PO Viewer API is running",
        "database": "SQLAlchemy",
    }


@app.post("/seed")
def seed_purchase_orders(
    database: Session = Depends(get_database),
):
    seed_database(database)

    return {
        "message": "Database seed completed",
    }


@app.get("/purchase-orders")
def get_purchase_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort_by: Literal[
        "po_number",
        "supplier",
        "order_date",
        "status",
        "total_amount",
    ] = "order_date",
    sort_direction: Literal[
        "asc",
        "desc",
    ] = "desc",
    database: Session = Depends(get_database),
):
    query = database.query(models.PurchaseOrder)

    # Tìm theo PO number hoặc supplier.
    if search and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                models.PurchaseOrder.po_number.ilike(
                    search_value
                ),
                models.PurchaseOrder.supplier.ilike(
                    search_value
                ),
            )
        )

    # Lọc theo trạng thái.
    if status and status != "All":
        validate_status(status)

        query = query.filter(
            models.PurchaseOrder.status == status
        )

    # Đếm tổng số bản ghi sau khi search/filter.
    total_items = query.count()

    total_pages = (
        math.ceil(total_items / page_size)
        if total_items > 0
        else 0
    )

    offset = (page - 1) * page_size

    sort_columns = {
        "po_number": models.PurchaseOrder.po_number,
        "supplier": models.PurchaseOrder.supplier,
        "order_date": models.PurchaseOrder.order_date,
        "status": models.PurchaseOrder.status,
        "total_amount": models.PurchaseOrder.total_amount,
    }
    sort_column = sort_columns[sort_by]

    if sort_direction == "asc":
        query = query.order_by(
            sort_column.asc(),
            models.PurchaseOrder.id.asc(),
        )
    else:
        query = query.order_by(
            sort_column.desc(),
            models.PurchaseOrder.id.desc(),
        )

    purchase_orders = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": purchase_order.id,
            "po_number": purchase_order.po_number,
            "supplier": purchase_order.supplier,
            "order_date": purchase_order.order_date,
            "status": purchase_order.status,
            "total_amount": purchase_order.total_amount,
        }
        for purchase_order in purchase_orders
    ]

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
    }


@app.get(
    "/purchase-orders/summary",
    response_model=PurchaseOrderSummaryResponse,
)
def get_purchase_order_summary(
    database: Session = Depends(get_database),
):
    summary = (
        database.query(
            func.count(
                models.PurchaseOrder.id
            ).label("total"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.PurchaseOrder.status
                            == "Open",
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("open"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.PurchaseOrder.status
                            == "Approved",
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("approved"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            models.PurchaseOrder.status
                            == "Completed",
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("completed"),
            func.coalesce(
                func.sum(
                    models.PurchaseOrder.total_amount
                ),
                0,
            ).label("total_value"),
            func.coalesce(
                func.avg(
                    models.PurchaseOrder.total_amount
                ),
                0,
            ).label("average_value"),
        )
        .one()
    )

    return {
        "total": int(summary.total),
        "open": int(summary.open),
        "approved": int(summary.approved),
        "completed": int(summary.completed),
        "total_value": float(summary.total_value),
        "average_value": float(summary.average_value),
    }


@app.get("/purchase-orders/{po_id}")
def get_purchase_order(
    po_id: int,
    database: Session = Depends(get_database),
):
    purchase_order = get_purchase_order_or_404(
        database,
        po_id,
    )

    return purchase_order_to_response(purchase_order)


@app.post("/purchase-orders", status_code=201)
def create_purchase_order(
    new_po: PurchaseOrderCreate,
    database: Session = Depends(get_database),
):
    if not new_po.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase order must contain at least one item",
        )

    validate_status(new_po.status)

    if new_po.status != "Open":
        raise HTTPException(
            status_code=400,
            detail=(
                "A new purchase order must start "
                "with Open status"
            ),
        )

    purchase_order = models.PurchaseOrder(
        po_number=new_po.po_number.strip(),
        supplier=new_po.supplier.strip(),
        order_date=new_po.order_date,
        status=new_po.status,
        total_amount=calculate_total(new_po.items),
    )

    purchase_order.items = [
        models.PurchaseOrderItem(
            product=item.product.strip(),
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in new_po.items
    ]

    try:
        database.add(purchase_order)
        database.commit()
        database.refresh(purchase_order)

    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=400,
            detail="PO number already exists",
        )

    created_purchase_order = (
        database.query(models.PurchaseOrder)
        .options(
            selectinload(models.PurchaseOrder.items)
        )
        .filter(
            models.PurchaseOrder.id
            == purchase_order.id
        )
        .first()
    )

    return purchase_order_to_response(
        created_purchase_order
    )


@app.put("/purchase-orders/{po_id}")
def update_purchase_order(
    po_id: int,
    updated_po: PurchaseOrderUpdate,
    database: Session = Depends(get_database),
):
    if not updated_po.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase order must contain at least one item",
        )

    purchase_order = get_purchase_order_or_404(
        database,
        po_id,
    )

    validate_status_transition(
        purchase_order.status,
        updated_po.status,
    )

    if (
        purchase_order.status in {"Approved", "Completed"}
        and has_purchase_order_content_changed(
            purchase_order,
            updated_po,
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"A {purchase_order.status} purchase order "
                "cannot be edited"
            ),
        )

    purchase_order.po_number = (
        updated_po.po_number.strip()
    )

    purchase_order.supplier = (
        updated_po.supplier.strip()
    )

    purchase_order.order_date = (
        updated_po.order_date
    )

    purchase_order.status = updated_po.status

    purchase_order.total_amount = calculate_total(
        updated_po.items
    )

    # Cách đơn giản:
    # thay toàn bộ danh sách item cũ bằng danh sách mới.
    purchase_order.items.clear()

    purchase_order.items.extend(
        [
            models.PurchaseOrderItem(
                product=item.product.strip(),
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in updated_po.items
        ]
    )

    try:
        database.commit()

    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=400,
            detail="PO number already exists",
        )

    updated_purchase_order = (
        database.query(models.PurchaseOrder)
        .options(
            selectinload(models.PurchaseOrder.items)
        )
        .filter(models.PurchaseOrder.id == po_id)
        .first()
    )

    return purchase_order_to_response(
        updated_purchase_order
    )


@app.delete(
    "/purchase-orders/{po_id}",
    status_code=204,
)
def delete_purchase_order(
    po_id: int,
    database: Session = Depends(get_database),
):
    purchase_order = get_purchase_order_or_404(
        database,
        po_id,
    )
    if purchase_order.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="A completed purchase order cannot be deleted",
        )
    database.delete(purchase_order)
    database.commit()

    return Response(status_code=204)
