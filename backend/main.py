from typing import List

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

import models
from database import Base, engine, get_database


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


# =========================================================
# Helper functions
# =========================================================

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
    database: Session = Depends(get_database),
):
    purchase_orders = (
        database.query(models.PurchaseOrder)
        .order_by(models.PurchaseOrder.id.desc())
        .all()
    )

    return [
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

    database.delete(purchase_order)
    database.commit()

    return Response(status_code=204)