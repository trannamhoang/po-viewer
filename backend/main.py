from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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