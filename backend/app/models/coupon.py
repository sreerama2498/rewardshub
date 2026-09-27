from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Boolean
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from datetime import datetime, timezone
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
        nullable=True
    )
    redemption_url = Column(
        String,
        nullable=True
    )
    category = Column(
        String,
        default="OTHER",
        index=True
    )
    security_pin = Column(
        String,
        nullable=True
    )
    terms_note = Column(
        String,
        nullable=True
    )
    discount_type = Column(
        String,
        default="FLAT_AMOUNT",
        index=True
    )
    discount_percent = Column(
        Integer,
        default=0
    )
    max_discount_cap = Column(
        Integer,
        default=0
    )
    min_order_value = Column(
        Integer,
        default=0
    )
    bogo_details = Column(
        String,
        nullable=True
    )
    free_gift_details = Column(
        String,
        nullable=True
    )
    distribution_channel = Column(
        String,
        default="DIGITAL",
        index=True
    )
    target_audience = Column(
        String,
        default="ALL_USERS"
    )
    usage_structure = Column(
        String,
        default="SINGLE_USE"
    )
    expiry_date = Column(
        Date,
        nullable=True,
        index=True
    )
    is_shared = Column(
        Boolean,
        default=False
    )
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    coupon_value = Column(
        Integer,
        default=0
    )
    status = Column(
        String,
        default="AVAILABLE",
        index=True
    )
    is_ocr_verified = Column(
        Boolean,
        default=False
    )
    ocr_proof_url = Column(
        String,
        nullable=True
    )
    escrow_status = Column(
        String,
        default="NONE"
    )
    buyer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    seller_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
