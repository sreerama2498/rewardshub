from pydantic import BaseModel, Field, model_validator
from datetime import date


class CouponCreate(BaseModel):
    title: str
    description: str | None = None
    source_app: str
    coupon_code: str | None = None
    redemption_url: str | None = None
    coupon_value: int = Field(gt=0)
    category: str | None = "OTHER"
    security_pin: str | None = None
    terms_note: str | None = None
    discount_type: str | None = "FLAT_AMOUNT"
    discount_percent: int | None = 0
    max_discount_cap: int | None = 0
    min_order_value: int | None = 0
    bogo_details: str | None = None
    free_gift_details: str | None = None
    distribution_channel: str | None = "DIGITAL"
    target_audience: str | None = "ALL_USERS"
    usage_structure: str | None = "SINGLE_USE"
    expiry_date: date | None = None
    is_ocr_verified: bool = False

    @model_validator(mode="after")
    def validate_code_or_url(self):
        code = (self.coupon_code or "").strip()
        url = (self.redemption_url or "").strip()
        if not code and not url:
            raise ValueError("Either a coupon code or a direct redemption link must be provided.")
        if not code and url:
            self.coupon_code = "REDEEM_VIA_LINK"
        return self


class DisputeRequest(BaseModel):
    reason: str
    details: str | None = None


