from pydantic import BaseModel


class ShareCouponRequest(BaseModel):
    coupon_id: int
    receiver_email: str
