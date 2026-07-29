from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="PO Viewer API")

# Cho phép React gọi đến Python API.
# Đây là cấu hình đơn giản dành cho giai đoạn học.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PurchaseOrderItem(BaseModel):
    product: str
    quantity: int
    unit_price: float


class PurchaseOrderCreate(BaseModel):
    po_number: str
    supplier: str
    order_date: str
    status: str
    items: List[PurchaseOrderItem]

purchase_orders = [
    {
        "id": 1,
        "po_number": "PO-2026-001",
        "supplier": "ABC Trading",
        "order_date": "2026-07-20",
        "status": "Open",
        "total_amount": 1500,
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
        "id": 2,
        "po_number": "PO-2026-002",
        "supplier": "Global Office Supplies",
        "order_date": "2026-07-22",
        "status": "Approved",
        "total_amount": 750,
        "items": [
            {
                "product": "Office Chair",
                "quantity": 5,
                "unit_price": 150,
            }
        ],
    },
    {
        "id": 3,
        "po_number": "PO-2026-003",
        "supplier": "Tech Solutions",
        "order_date": "2026-07-25",
        "status": "Completed",
        "total_amount": 1200,
        "items": [
            {
                "product": "Keyboard",
                "quantity": 10,
                "unit_price": 40,
            },
            {
                "product": "Mouse",
                "quantity": 10,
                "unit_price": 30,
            },
            {
                "product": "Webcam",
                "quantity": 5,
                "unit_price": 100,
            },
        ],
    },
]


@app.get("/")
def home():
    return {"message": "PO Viewer API is running"}


@app.get("/purchase-orders")
def get_purchase_orders():
    return purchase_orders


@app.get("/purchase-orders/{po_id}")
def get_purchase_order(po_id: int):
    for purchase_order in purchase_orders:
        if purchase_order["id"] == po_id:
            return purchase_order

    raise HTTPException(
        status_code=404,
        detail="Purchase order not found",
    )

@app.post("/purchase-orders", status_code=201)
def create_purchase_order(new_po: PurchaseOrderCreate):
    if any(
        po["po_number"].lower() == new_po.po_number.lower()
        for po in purchase_orders
    ):
        raise HTTPException(
            status_code=400,
            detail="PO number already exists",
        )

    new_id = max(
        [po["id"] for po in purchase_orders],
        default=0,
    ) + 1

    items = [item.model_dump() for item in new_po.items]

    total_amount = sum(
        item["quantity"] * item["unit_price"]
        for item in items
    )

    created_po = {
        "id": new_id,
        "po_number": new_po.po_number,
        "supplier": new_po.supplier,
        "order_date": new_po.order_date,
        "status": new_po.status,
        "total_amount": total_amount,
        "items": items,
    }

    purchase_orders.append(created_po)

    return created_po