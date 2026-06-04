from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from datetime import datetime

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
        ForeignKey("coupons.id")
    )

    buyer_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    status = Column(
        String,
        default="PENDING"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
