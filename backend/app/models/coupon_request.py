from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from datetime import datetime, timezone

from app.database.base import Base


class CouponRequest(Base):

    __tablename__ = "coupon_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    coupon_id = Column(
        Integer,
        ForeignKey("coupons.id", ondelete="CASCADE")
    )

    buyer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    status = Column(
        String,
        default="PENDING"
    )

    total_price = Column(
        Integer,
        default=0
    )

    owner_payout = Column(
        Integer,
        default=0
    )

    platform_fee = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
