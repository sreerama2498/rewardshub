from pydantic import BaseModel
from datetime import date


class CouponCreate(BaseModel):
    title: str
    description: str | None = None
    source_app: str
    coupon_code: str
    coupon_value: int
    expiry_date: date | None = None
