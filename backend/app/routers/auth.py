from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import SessionLocal
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.schemas.profile import ProfileUpdate, PaymentDetailsUpdate, PasswordChange
from app.core.security import hash_password, verify_password, create_access_token
from app.services.helpers import create_audit_log

router = APIRouter(tags=["Authentication & Profile"])


@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    clean_email = user.email.strip().lower()
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == clean_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already exists"
        )

    new_user = User(
        name=user.name.strip(),
        email=clean_email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "id": new_user.id
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    clean_email = user.email.strip().lower()
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == clean_email)
        .first()
    )

    if not existing_user:
        print(f"[AUTH] Login failed: user '{clean_email}' not found in database.")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account disabled"
        )

    valid = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not valid:
        print(f"[AUTH] Login failed: incorrect password for user '{clean_email}'.")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "role": existing_user.role
        }
    )

    create_audit_log(
        db,
        existing_user.id,
        "LOGIN",
        f"{existing_user.email} logged in"
    )
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "upi_id": current_user.upi_id,
        "bank_account_number": current_user.bank_account_number,
        "bank_ifsc": current_user.bank_ifsc,
        "bank_name": current_user.bank_name,
        "wallet_balance": round(current_user.wallet_balance or 0.0, 2),
        "total_earned": round(current_user.total_earned or 0.0, 2)
    }


@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "upi_id": current_user.upi_id,
        "bank_account_number": current_user.bank_account_number,
        "bank_ifsc": current_user.bank_ifsc,
        "bank_name": current_user.bank_name,
        "wallet_balance": round(current_user.wallet_balance or 0.0, 2),
        "total_earned": round(current_user.total_earned or 0.0, 2),
        "created_at": current_user.created_at
    }


@router.put("/profile")
def update_profile(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_email = profile.email.strip().lower()
    existing_email = (
        db.query(User)
        .filter(
            func.lower(User.email) == clean_email,
            User.id != current_user.id
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already exists"
        )

    current_user.name = profile.name.strip()
    current_user.email = clean_email
    if profile.upi_id is not None:
        current_user.upi_id = profile.upi_id
    if profile.bank_account_number is not None:
        current_user.bank_account_number = profile.bank_account_number
    if profile.bank_ifsc is not None:
        current_user.bank_ifsc = profile.bank_ifsc
    if profile.bank_name is not None:
        current_user.bank_name = profile.bank_name

    create_audit_log(
        db,
        current_user.id,
        "UPDATE_PROFILE",
        current_user.email
    )
    db.commit()

    return {
        "message": "Profile updated successfully"
    }


@router.put("/payment-details")
def update_payment_details(
    details: PaymentDetailsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.upi_id = details.upi_id
    current_user.bank_account_number = details.bank_account_number
    current_user.bank_ifsc = details.bank_ifsc
    current_user.bank_name = details.bank_name

    create_audit_log(
        db,
        current_user.id,
        "UPDATE_PAYMENT_DETAILS",
        f"UPI: {details.upi_id or 'None'}, Bank: {details.bank_name or 'None'}"
    )
    db.commit()

    return {
        "message": "Payment and banking details updated successfully"
    }


@router.put("/change-password")
def change_password(
    request: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid = verify_password(
        request.current_password,
        current_user.password_hash
    )

    if not valid:
        raise HTTPException(
            status_code=400,
            detail="Current password incorrect"
        )

    current_user.password_hash = hash_password(
        request.new_password
    )

    create_audit_log(
        db,
        current_user.id,
        "CHANGE_PASSWORD",
        "Password Updated"
    )
    db.commit()

    return {
        "message": "Password changed successfully"
    }
