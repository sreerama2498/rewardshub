from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    name: str
    email: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
