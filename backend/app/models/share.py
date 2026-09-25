from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime

from datetime import datetime, timezone

from app.database.base import Base


class CouponShare(Base):
    __tablename__ = "coupon_shares"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    coupon_id = Column(
        Integer,
        ForeignKey("coupons.id", ondelete="CASCADE")
    )

    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    receiver_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    status = Column(
        String,
        default="PENDING"
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
