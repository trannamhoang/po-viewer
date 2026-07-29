from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    po_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    supplier: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    order_date: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    total_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    items: Mapped[list["PurchaseOrderItem"]] = relationship(
        back_populates="purchase_order",
        cascade="all, delete-orphan",
    )


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    purchase_order_id: Mapped[int] = mapped_column(
        ForeignKey(
            "purchase_orders.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    product: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    purchase_order: Mapped["PurchaseOrder"] = relationship(
        back_populates="items",
    )