from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ProfileUpdate(BaseModel):
    name: str
    email: str
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None


class PaymentDetailsUpdate(BaseModel):
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class TopupRequest(BaseModel):
    # Minimum ₹1, maximum ₹50,000 per top-up to prevent abuse
    amount: float = Field(gt=0, le=50000)

    @field_validator("amount")
    @classmethod
    def round_to_paise(cls, v: float) -> float:
        """Prevent floating-point drift by capping precision at 2 decimal places."""
        return round(v, 2)

