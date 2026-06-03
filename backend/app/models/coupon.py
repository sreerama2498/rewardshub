from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Date
from sqlalchemy import Boolean
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from datetime import datetime
from app.database.base import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    source_app = Column(
        String,
        nullable=False
    )

    coupon_code = Column(
        String,
        nullable=False
    )

    expiry_date = Column(
        Date,
        nullable=True
    )

    is_shared = Column(
        Boolean,
        default=False
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id")
    )

created_at = Column(
    DateTime,
    default=datetime.utcnow
)

updated_at = Column(
    DateTime,
    default=datetime.utcnow,
    onupdate=datetime.utcnow
)
