from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from app.database.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    coupon_id = Column(
        Integer,
        ForeignKey("coupons.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    buyer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    total_amount = Column(
        Float,
        default=0.0
    )

    owner_payout = Column(
        Float,
        default=0.0
    )

    platform_fee = Column(
        Float,
        default=0.0
    )

    owner_upi = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="COMPLETED",
        index=True
    )

    description = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
