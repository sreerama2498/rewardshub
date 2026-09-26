from pydantic import BaseModel, Field
from datetime import date


class CouponCreate(BaseModel):
    title: str
    description: str | None = None
    source_app: str
    coupon_code: str
    coupon_value: int = Field(gt=0)
    expiry_date: date | None = None
    is_ocr_verified: bool = False


class DisputeRequest(BaseModel):
    reason: str
    details: str | None = None


