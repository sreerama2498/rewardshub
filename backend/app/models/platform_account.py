from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime, timezone
from app.database.base import Base

class PlatformAccount(Base):
    __tablename__ = "platform_account"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    balance = Column(
        Float,
        default=0.0
    )

    total_volume = Column(
        Float,
        default=0.0
    )

    total_transactions = Column(
        Integer,
        default=0
    )

    account_name = Column(
        String,
        default="RewardsHub Platform Account"
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
