from pydantic import BaseModel
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
