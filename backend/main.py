import sqlite3
from contextlib import closing
from typing import List

from fastapi import FastAPI, HTTPException, Response
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


# =========================================================
# Request models
# =========================================================

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


# =========================================================
# Database connection
# =========================================================

def get_database_connection():
    connection = sqlite3.connect(DATABASE_FILE)

    # Cho phép đọc dữ liệu bằng tên cột.
    connection.row_factory = sqlite3.Row

    # SQLite mặc định không luôn bật foreign key.
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


# =========================================================
# Database initialization
# =========================================================

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
                total_amount REAL NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_order_id INTEGER NOT NULL,
                product TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,

                FOREIGN KEY (purchase_order_id)
                    REFERENCES purchase_orders(id)
                    ON DELETE CASCADE
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
            """
            SELECT COUNT(*) AS total
            FROM purchase_orders
            """
        ).fetchone()["total"]

        if current_count > 0:
            return

        try:
            for purchase_order in seed_purchase_orders:
                total_amount = calculate_total(
                    purchase_order["items"]
                )

                cursor = connection.execute(
                    """
                    INSERT INTO purchase_orders (
                        po_number,
                        supplier,
                        order_date,
                        status,
                        total_amount
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        purchase_order["po_number"],
                        purchase_order["supplier"],
                        purchase_order["order_date"],
                        purchase_order["status"],
                        total_amount,
                    ),
                )

                purchase_order_id = cursor.lastrowid

                insert_purchase_order_items(
                    connection,
                    purchase_order_id,
                    purchase_order["items"],
                )

            connection.commit()

        except Exception:
            connection.rollback()
            raise


# =========================================================
# Helper functions
# =========================================================

def calculate_total(items):
    return sum(
        item["quantity"] * item["unit_price"]
        for item in items
    )


def convert_items_to_dict(items):
    return [
        {
            "product": item.product.strip(),
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in items
    ]


def insert_purchase_order_items(
    connection,
    purchase_order_id,
    items,
):
    for item in items:
        connection.execute(
            """
            INSERT INTO purchase_order_items (
                purchase_order_id,
                product,
                quantity,
                unit_price
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                purchase_order_id,
                item["product"],
                item["quantity"],
                item["unit_price"],
            ),
        )


def get_items_by_purchase_order_id(
    connection,
    purchase_order_id,
):
    rows = connection.execute(
        """
        SELECT
            id,
            product,
            quantity,
            unit_price
        FROM purchase_order_items
        WHERE purchase_order_id = ?
        ORDER BY id
        """,
        (purchase_order_id,),
    ).fetchall()

    return [
        {
            "id": row["id"],
            "product": row["product"],
            "quantity": row["quantity"],
            "unit_price": row["unit_price"],
        }
        for row in rows
    ]


def get_purchase_order_detail(
    connection,
    purchase_order_id,
):
    row = connection.execute(
        """
        SELECT
            id,
            po_number,
            supplier,
            order_date,
            status,
            total_amount
        FROM purchase_orders
        WHERE id = ?
        """,
        (purchase_order_id,),
    ).fetchone()

    if row is None:
        return None

    items = get_items_by_purchase_order_id(
        connection,
        purchase_order_id,
    )

    return {
        "id": row["id"],
        "po_number": row["po_number"],
        "supplier": row["supplier"],
        "order_date": row["order_date"],
        "status": row["status"],
        "total_amount": row["total_amount"],
        "items": items,
    }


initialize_database()
seed_database()


# =========================================================
# API endpoints
# =========================================================

@app.get("/")
def home():
    return {
        "message": "PO Viewer API is running",
        "database": "SQLite",
        "database_design": "two tables",
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
        purchase_order = get_purchase_order_detail(
            connection,
            po_id,
        )

    if purchase_order is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found",
        )

    return purchase_order


@app.post("/purchase-orders", status_code=201)
def create_purchase_order(new_po: PurchaseOrderCreate):
    if not new_po.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase order must contain at least one item",
        )

    items = convert_items_to_dict(new_po.items)
    total_amount = calculate_total(items)

    with closing(get_database_connection()) as connection:
        try:
            cursor = connection.execute(
                """
                INSERT INTO purchase_orders (
                    po_number,
                    supplier,
                    order_date,
                    status,
                    total_amount
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    new_po.po_number.strip(),
                    new_po.supplier.strip(),
                    new_po.order_date,
                    new_po.status,
                    total_amount,
                ),
            )

            new_id = cursor.lastrowid

            insert_purchase_order_items(
                connection,
                new_id,
                items,
            )

            connection.commit()

            created_purchase_order = (
                get_purchase_order_detail(
                    connection,
                    new_id,
                )
            )

        except sqlite3.IntegrityError:
            connection.rollback()

            raise HTTPException(
                status_code=400,
                detail="PO number already exists",
            )

        except Exception:
            connection.rollback()
            raise

    return created_purchase_order


@app.put("/purchase-orders/{po_id}")
def update_purchase_order(
    po_id: int,
    updated_po: PurchaseOrderUpdate,
):
    if not updated_po.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase order must contain at least one item",
        )

    items = convert_items_to_dict(updated_po.items)
    total_amount = calculate_total(items)

    with closing(get_database_connection()) as connection:
        try:
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
                    total_amount = ?
                WHERE id = ?
                """,
                (
                    updated_po.po_number.strip(),
                    updated_po.supplier.strip(),
                    updated_po.order_date,
                    updated_po.status,
                    total_amount,
                    po_id,
                ),
            )

            # Phiên bản đơn giản:
            # xóa toàn bộ items cũ rồi tạo lại.
            connection.execute(
                """
                DELETE FROM purchase_order_items
                WHERE purchase_order_id = ?
                """,
                (po_id,),
            )

            insert_purchase_order_items(
                connection,
                po_id,
                items,
            )

            connection.commit()

            updated_purchase_order = (
                get_purchase_order_detail(
                    connection,
                    po_id,
                )
            )

        except sqlite3.IntegrityError:
            connection.rollback()

            raise HTTPException(
                status_code=400,
                detail="PO number already exists",
            )

        except HTTPException:
            connection.rollback()
            raise

        except Exception:
            connection.rollback()
            raise

    return updated_purchase_order


@app.delete(
    "/purchase-orders/{po_id}",
    status_code=204,
)
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

    return Response(status_code=204)