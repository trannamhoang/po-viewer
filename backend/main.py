import json
import sqlite3
from contextlib import closing
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


DATABASE_FILE = "po_viewer.db"

app = FastAPI(title="PO Viewer API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Request models
# ==========================================

class PurchaseOrderItem(BaseModel):
    product: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class PurchaseOrderCreate(BaseModel):
    po_number: str = Field(min_length=1)
    supplier: str = Field(min_length=1)
    order_date: str
    status: str
    items: List[PurchaseOrderItem]

class PurchaseOrderUpdate(BaseModel):
    po_number: str = Field(min_length=1)
    supplier: str = Field(min_length=1)
    order_date: str
    status: str
    items: List[PurchaseOrderItem]


# ==========================================
# Database functions
# ==========================================

def get_database_connection():
    connection = sqlite3.connect(DATABASE_FILE)

    # Cho phép đọc dữ liệu theo tên cột.
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    with closing(get_database_connection()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                po_number TEXT NOT NULL UNIQUE,
                supplier TEXT NOT NULL,
                order_date TEXT NOT NULL,
                status TEXT NOT NULL,
                total_amount REAL NOT NULL,
                items_json TEXT NOT NULL
            )
            """
        )

        connection.commit()


def seed_database():
    seed_purchase_orders = [
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
                }
            ],
        },
        {
            "po_number": "PO-2026-003",
            "supplier": "Tech Solutions",
            "order_date": "2026-07-25",
            "status": "Completed",
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

    with closing(get_database_connection()) as connection:
        current_count = connection.execute(
            "SELECT COUNT(*) AS total FROM purchase_orders"
        ).fetchone()["total"]

        # Chỉ tạo dữ liệu mẫu khi bảng đang trống.
        if current_count > 0:
            return

        for purchase_order in seed_purchase_orders:
            total_amount = sum(
                item["quantity"] * item["unit_price"]
                for item in purchase_order["items"]
            )

            connection.execute(
                """
                INSERT INTO purchase_orders (
                    po_number,
                    supplier,
                    order_date,
                    status,
                    total_amount,
                    items_json
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    purchase_order["po_number"],
                    purchase_order["supplier"],
                    purchase_order["order_date"],
                    purchase_order["status"],
                    total_amount,
                    json.dumps(purchase_order["items"]),
                ),
            )

        connection.commit()


def convert_row_to_purchase_order(row):
    return {
        "id": row["id"],
        "po_number": row["po_number"],
        "supplier": row["supplier"],
        "order_date": row["order_date"],
        "status": row["status"],
        "total_amount": row["total_amount"],
        "items": json.loads(row["items_json"]),
    }


initialize_database()
seed_database()


# ==========================================
# API endpoints
# ==========================================

@app.get("/")
def home():
    return {
        "message": "PO Viewer API is running",
        "database": "SQLite",
    }


@app.get("/purchase-orders")
def get_purchase_orders():
    with closing(get_database_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                po_number,
                supplier,
                order_date,
                status,
                total_amount
            FROM purchase_orders
            ORDER BY id DESC
            """
        ).fetchall()

    return [
        {
            "id": row["id"],
            "po_number": row["po_number"],
            "supplier": row["supplier"],
            "order_date": row["order_date"],
            "status": row["status"],
            "total_amount": row["total_amount"],
        }
        for row in rows
    ]


@app.get("/purchase-orders/{po_id}")
def get_purchase_order(po_id: int):
    with closing(get_database_connection()) as connection:
        row = connection.execute(
            """
            SELECT *
            FROM purchase_orders
            WHERE id = ?
            """,
            (po_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found",
        )

    return convert_row_to_purchase_order(row)


@app.post("/purchase-orders", status_code=201)
def create_purchase_order(new_po: PurchaseOrderCreate):
    items = [
        item.model_dump()
        for item in new_po.items
    ]

    total_amount = sum(
        item["quantity"] * item["unit_price"]
        for item in items
    )

    try:
        with closing(get_database_connection()) as connection:
            cursor = connection.execute(
                """
                INSERT INTO purchase_orders (
                    po_number,
                    supplier,
                    order_date,
                    status,
                    total_amount,
                    items_json
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    new_po.po_number.strip(),
                    new_po.supplier.strip(),
                    new_po.order_date,
                    new_po.status,
                    total_amount,
                    json.dumps(items),
                ),
            )

            connection.commit()
            new_id = cursor.lastrowid

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="PO number already exists",
        )

    return {
        "id": new_id,
        "po_number": new_po.po_number.strip(),
        "supplier": new_po.supplier.strip(),
        "order_date": new_po.order_date,
        "status": new_po.status,
        "total_amount": total_amount,
        "items": items,
    }

@app.put("/purchase-orders/{po_id}")
def update_purchase_order(
    po_id: int,
    updated_po: PurchaseOrderUpdate,
):
    items = [
        item.model_dump()
        for item in updated_po.items
    ]

    total_amount = sum(
        item["quantity"] * item["unit_price"]
        for item in items
    )

    try:
        with closing(get_database_connection()) as connection:
            existing_row = connection.execute(
                """
                SELECT id
                FROM purchase_orders
                WHERE id = ?
                """,
                (po_id,),
            ).fetchone()

            if existing_row is None:
                raise HTTPException(
                    status_code=404,
                    detail="Purchase order not found",
                )

            connection.execute(
                """
                UPDATE purchase_orders
                SET
                    po_number = ?,
                    supplier = ?,
                    order_date = ?,
                    status = ?,
                    total_amount = ?,
                    items_json = ?
                WHERE id = ?
                """,
                (
                    updated_po.po_number.strip(),
                    updated_po.supplier.strip(),
                    updated_po.order_date,
                    updated_po.status,
                    total_amount,
                    json.dumps(items),
                    po_id,
                ),
            )

            connection.commit()

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="PO number already exists",
        )

    return {
        "id": po_id,
        "po_number": updated_po.po_number.strip(),
        "supplier": updated_po.supplier.strip(),
        "order_date": updated_po.order_date,
        "status": updated_po.status,
        "total_amount": total_amount,
        "items": items,
    }

@app.delete("/purchase-orders/{po_id}", status_code=204)
def delete_purchase_order(po_id: int):
    with closing(get_database_connection()) as connection:
        existing_row = connection.execute(
            """
            SELECT id
            FROM purchase_orders
            WHERE id = ?
            """,
            (po_id,),
        ).fetchone()

        if existing_row is None:
            raise HTTPException(
                status_code=404,
                detail="Purchase order not found",
            )

        connection.execute(
            """
            DELETE FROM purchase_orders
            WHERE id = ?
            """,
            (po_id,),
        )

        connection.commit()