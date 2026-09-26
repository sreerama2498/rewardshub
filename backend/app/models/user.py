from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float
from sqlalchemy import DateTime
from sqlalchemy import Boolean
from datetime import datetime, timezone
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="USER"
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    upi_id = Column(
        String,
        nullable=True
    )

    bank_account_number = Column(
        String,
        nullable=True
    )

    bank_ifsc = Column(
        String,
        nullable=True
    )

    bank_name = Column(
        String,
        nullable=True
    )

    wallet_balance = Column(
        Float,
        default=1000.0,
        nullable=False
    )

    total_earned = Column(
        Float,
        default=0.0,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
