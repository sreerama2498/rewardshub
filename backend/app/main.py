from fastapi import FastAPI
from fastapi import Depends
from fastapi import UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
from datetime import datetime, timezone
from app.schemas.profile import (ProfileUpdate, PasswordChange, PaymentDetailsUpdate, TopupRequest)
from app.schemas.coupon import CouponCreate, DisputeRequest
from app.database.connection import engine
from app.database.base import Base
from app.models.audit_log import AuditLog
from app.services.ocr import verify_coupon_screenshot

from fastapi import HTTPException

from datetime import date
from datetime import timedelta

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.core.security import (hash_password,verify_password,create_access_token)

from app.models.user import User
from app.models.coupon import Coupon
from app.models.share import CouponShare
from app.models.coupon_request import CouponRequest
from app.models.transaction import Transaction
from app.models.platform_account import PlatformAccount

from app.schemas.user import UserCreate
from app.schemas.user import UserLogin
from app.schemas.share import ShareCouponRequest

import app.models.user
import app.models.coupon
import app.models.share
import app.models.transaction
import app.models.platform_account

# Notifications
from app.models.notification import Notification

Base.metadata.create_all(bind=engine)

def create_audit_log(
    db,
    user_id,
    action,
    details
):

    log = AuditLog(

        user_id=user_id,

        action=action,

        details=details

    )

    db.add(log)

    db.commit()


def create_notification(
    db,
    user_id,
    title,
    message
):

    notification = Notification(

        user_id=user_id,

        title=title,

        message=message

    )

    db.add(notification)

    db.commit()


app = FastAPI(
    title="RewardsHub API"
)
import os as _os
_cors_origins = _os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "RewardsHub API Running"
    }


# -------------------------
# REGISTER
# -------------------------

@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already exists"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(
            user.password
        )
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "id": new_user.id
    }


# -------------------------
# LOGIN
# -------------------------

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
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
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
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

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------------
# CURRENT USER
# -------------------------

@app.get("/me")
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


# -------------------------
# OCR VERIFY COUPON SCREENSHOT
# -------------------------

@app.post("/coupons/verify-ocr")
async def verify_ocr(
    file: UploadFile = File(...),
    brand: str = Form(None),
    coupon_code: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")

    result = verify_coupon_screenshot(
        image_bytes=contents,
        claimed_brand=brand,
        claimed_code=coupon_code
    )
    return result


# -------------------------
# CREATE COUPON
# -------------------------

@app.post("/coupons")
def create_coupon(
    coupon: CouponCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_coupon = Coupon(
        title=coupon.title,
        description=coupon.description,
        source_app=coupon.source_app,
        coupon_code=coupon.coupon_code,
        coupon_value=coupon.coupon_value,
        status="AVAILABLE",
        is_ocr_verified=bool(coupon.is_ocr_verified),
        escrow_status="NONE",
        expiry_date=coupon.expiry_date,
        owner_id=current_user.id
    )

    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)

    action_name = "CREATE_OCR_VERIFIED_COUPON" if coupon.is_ocr_verified else "CREATE_COUPON"
    create_audit_log(
        db,
        current_user.id,
        action_name,
        f"{coupon.title} (Value: ₹{coupon.coupon_value}, OCR Verified: {coupon.is_ocr_verified})"
    )

    return {
        "message": "Coupon created successfully" + (" with verified OCR proof!" if coupon.is_ocr_verified else ""),
        "coupon_id": new_coupon.id,
        "is_ocr_verified": new_coupon.is_ocr_verified
    }


# -------------------------
# MY COUPONS
# -------------------------

@app.get("/my-coupons")
def my_coupons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.owner_id == current_user.id
        )
        .all()
    )

    return coupons


# -------------------------
# SHARE COUPON
# -------------------------

@app.post("/share-coupon")
def share_coupon(
    request: ShareCouponRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.id == request.coupon_id,
            Coupon.owner_id == current_user.id
        )
        .first()
    )

    if not coupon:
        return {
            "message": "Coupon not found"
        }

    receiver = (
        db.query(User)
        .filter(
            User.email == request.receiver_email
        )
        .first()
    )

    if not receiver:
        return {
            "message": "Receiver not found"
        }

    existing_share = (
        db.query(CouponShare)
        .filter(
            CouponShare.coupon_id == coupon.id,
            CouponShare.sender_id == current_user.id,
            CouponShare.receiver_id == receiver.id
        )
        .first()
    )

    if existing_share:
        return {
            "message": "Coupon already shared with this user"
        }

    share = CouponShare(
        coupon_id=coupon.id,
        sender_id=current_user.id,
        receiver_id=receiver.id,
        status="PENDING"
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    create_audit_log(
        db,
        current_user.id,
        "SHARE_COUPON",
        f"Coupon {coupon.id}"
    )

    create_notification(
        db,
        receiver.id,
        "Coupon Shared",
        f"{current_user.name} shared a coupon with you"
    )

    return {
        "message": "Coupon shared successfully",
        "share_id": share.id
    }


# -------------------------
# SHARED WITH ME
# -------------------------

@app.get("/shared-with-me")
def shared_with_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = (
        db.query(CouponShare)
        .filter(
            CouponShare.receiver_id == current_user.id
        )
        .all()
    )

    return shares


@app.post("/accept-share/{share_id}")
def accept_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    share = (
        db.query(CouponShare)
        .filter(
            CouponShare.id == share_id,
            CouponShare.receiver_id == current_user.id
        )
        .first()
    )

    if not share:
        return {
            "message": "Share not found"
        }

    share.status = "ACCEPTED"

    db.commit()

    create_notification(
        db,
        share.sender_id,
        "Coupon Accepted",
        "Your coupon was accepted"
    )

    return {
        "message": "Share accepted"
    }


@app.post("/reject-share/{share_id}")
def reject_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    share = (
        db.query(CouponShare)
        .filter(
            CouponShare.id == share_id,
            CouponShare.receiver_id == current_user.id
        )
        .first()
    )

    if not share:
        return {
            "message": "Share not found"
        }

    share.status = "REJECTED"

    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.id == share.coupon_id
        )
        .first()
    )

    if coupon:
        coupon.is_shared = False

    db.commit()

    create_notification(
        db,
        share.sender_id,
        "Coupon Rejected",
        "Your coupon was rejected"
    )

    return {
        "message": "Share rejected"
    }


@app.get("/users")
def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
        for user in users
    ]


@app.get("/sent-shares")
def get_sent_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    shares = (
        db.query(CouponShare)
        .filter(
            CouponShare.sender_id == current_user.id
        )
        .all()
    )

    results = []

    for share in shares:

        coupon = (
            db.query(Coupon)
            .filter(
                Coupon.id == share.coupon_id
            )
            .first()
        )

        receiver = (
            db.query(User)
            .filter(
                User.id == share.receiver_id
            )
            .first()
        )

        results.append({
            "id": share.id,
            "coupon_id": share.coupon_id,
            "coupon_title": coupon.title if coupon else "Unknown",
            "receiver_email": receiver.email if receiver else "Unknown",
            "status": share.status,
            "created_at": share.created_at,
            "updated_at": share.updated_at
        })

    return results


@app.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    total_users = db.query(User).count()

    total_coupons = db.query(Coupon).count()

    total_shares = db.query(CouponShare).count()

    accepted_shares = (
        db.query(CouponShare)
        .filter(
            CouponShare.status == "ACCEPTED"
        )
        .count()
    )

    return {
        "total_users": total_users,
        "total_coupons": total_coupons,
        "total_shares": total_shares,
        "accepted_shares": accepted_shares
    }


@app.get("/expiry-dashboard")
def expiry_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    today = date.today()

    next_7_days = (
        today +
        timedelta(days=7)
    )

    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.owner_id == current_user.id
        )
        .all()
    )

    expiring_today = []
    expiring_soon = []
    expired = []

    for coupon in coupons:

        if not coupon.expiry_date:
            continue

        if coupon.expiry_date < today:

            expired.append({
                "id": coupon.id,
                "title": coupon.title,
                "expiry_date": coupon.expiry_date
            })

        elif coupon.expiry_date == today:

            expiring_today.append({
                "id": coupon.id,
                "title": coupon.title,
                "expiry_date": coupon.expiry_date
            })

        elif coupon.expiry_date <= next_7_days:

            expiring_soon.append({
                "id": coupon.id,
                "title": coupon.title,
                "expiry_date": coupon.expiry_date
            })

    return {
        "expiring_today": expiring_today,
        "expiring_soon": expiring_soon,
        "expired": expired
    }


@app.get("/activity")
def get_activity(
    db: Session = Depends(get_db)
):

    coupons = db.query(Coupon).all()

    activities = []

    for coupon in coupons:

        activities.append(
            {
                "type": "Coupon Created",
                "title": coupon.title,
                "created_at": coupon.created_at
            }
        )

    activities.sort(
        key=lambda x: x["created_at"],
        reverse=True
    )

    return activities[:10]


# -------------------------
# PROFILE
# -------------------------

@app.get("/profile")
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


# -------------------------
# UPDATE PROFILE
# -------------------------

@app.put("/profile")
def update_profile(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    existing_email = (
        db.query(User)
        .filter(
            User.email == profile.email,
            User.id != current_user.id
        )
        .first()
    )

    if existing_email:

        return {
            "message": "Email already exists"
        }

    current_user.name = profile.name
    current_user.email = profile.email
    if profile.upi_id is not None:
        current_user.upi_id = profile.upi_id
    if profile.bank_account_number is not None:
        current_user.bank_account_number = profile.bank_account_number
    if profile.bank_ifsc is not None:
        current_user.bank_ifsc = profile.bank_ifsc
    if profile.bank_name is not None:
        current_user.bank_name = profile.bank_name

    db.commit()

    create_audit_log(
        db,
        current_user.id,
        "UPDATE_PROFILE",
        current_user.email
    )

    return {
        "message": "Profile updated successfully"
    }


# -------------------------
# UPDATE PAYMENT DETAILS
# -------------------------

@app.put("/payment-details")
def update_payment_details(
    details: PaymentDetailsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.upi_id = details.upi_id
    current_user.bank_account_number = details.bank_account_number
    current_user.bank_ifsc = details.bank_ifsc
    current_user.bank_name = details.bank_name

    db.commit()

    create_audit_log(
        db,
        current_user.id,
        "UPDATE_PAYMENT_DETAILS",
        f"UPI: {details.upi_id or 'None'}, Bank: {details.bank_name or 'None'}"
    )

    return {
        "message": "Payment and banking details updated successfully"
    }


# -------------------------
# CHANGE PASSWORD
# -------------------------

@app.put("/change-password")
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

        return {
            "message": "Current password incorrect"
        }

    current_user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    create_audit_log(
        db,
        current_user.id,
        "CHANGE_PASSWORD",
        "Password Updated"
    )

    return {
        "message": "Password changed successfully"
    }

#--------------------------
#	Admin
#--------------------------

def verify_admin(
    current_user: User
):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return True

@app.get("/admin/stats")
def admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    total_users = db.query(User).count()

    admin_users = (
        db.query(User)
        .filter(User.role == "ADMIN")
        .count()
    )

    active_users = (
        db.query(User)
        .filter(User.is_active == True)
        .count()
    )

    disabled_users = (
        db.query(User)
        .filter(User.is_active == False)
        .count()
    )

    total_coupons = (
        db.query(Coupon)
        .count()
    )

    total_shares = (
        db.query(CouponShare)
        .count()
    )

    accepted_shares = (
        db.query(CouponShare)
        .filter(
            CouponShare.status == "ACCEPTED"
        )
        .count()
    )

    platform_acc = db.query(PlatformAccount).filter(PlatformAccount.id == 1).first()
    platform_balance = round(platform_acc.balance if platform_acc else 0.0, 2)
    total_marketplace_volume = round(platform_acc.total_volume if platform_acc else 0.0, 2)
    total_marketplace_transactions = platform_acc.total_transactions if platform_acc else 0

    return {
        "total_users": total_users,
        "admin_users": admin_users,
        "active_users": active_users,
        "disabled_users": disabled_users,
        "total_coupons": total_coupons,
        "total_shares": total_shares,
        "accepted_shares": accepted_shares,
        "platform_balance": platform_balance,
        "total_marketplace_volume": total_marketplace_volume,
        "total_marketplace_transactions": total_marketplace_transactions
    }

@app.get("/admin/users")
def admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
        for user in users
    ]


@app.get("/admin/user/{user_id}/coupons")
@app.get("/admin/user-coupons/{user_id}")
def admin_user_coupons(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.owner_id == user_id
        )
        .all()
    )

    return coupons


@app.delete("/admin/user/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="Cannot delete yourself"
        )

    if user.role == "ADMIN":

        raise HTTPException(
            status_code=400,
            detail="Cannot delete admin user"
        )

    create_audit_log(
        db,
        current_user.id,
        "DELETE_USER",
        user.email
    )

    db.execute(
        text(
            "DELETE FROM audit_logs "
            "WHERE user_id = :user_id"
        ),
        {
            "user_id": user_id
        }
    )

    db.delete(user)

    db.commit()

    return {
        "message": "User deleted successfully"
    }


def get_activity_category(action):
    auth_actions = [
        "LOGIN",
        "REGISTER",
        "PASSWORD_CHANGE"
    ]

    coupon_actions = [
        "CREATE_COUPON",
        "UPDATE_COUPON",
        "DELETE_COUPON",
        "SHARE_COUPON"
    ]

    admin_actions = [
        "DELETE_USER",
        "DISABLE_USER",
        "ENABLE_USER",
        "MAKE_ADMIN",
        "REMOVE_ADMIN"
    ]

    if action in auth_actions:
        return "AUTH"

    if action in coupon_actions:
        return "COUPON"

    if action in admin_actions:
        return "ADMIN"

    return "OTHER"


@app.get("/admin/audit-logs")
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )
    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(100)
        .all()
    )
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at,
            "category": get_activity_category(
                log.action
            )
        }
        for log in logs
    ]


# -------------------------
# NOTIFICATIONS
# -------------------------

@app.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


@app.get("/notifications/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )

    return {
        "count": count
    }


@app.put(
    "/notifications/read/{notification_id}"
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if not notification:

        return {
            "message": "Notification not found"
        }

    notification.is_read = True

    db.commit()

    return {
        "message": "Notification marked as read"
    }


# -------------------------
# DISABLE USER
# -------------------------

@app.put("/admin/user/{user_id}/disable")
def disable_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="Cannot disable yourself"
        )

    user.is_active = False

    create_audit_log(
        db,
        current_user.id,
        "DISABLE_USER",
        user.email
    )

    db.commit()

    return {
        "message": "User disabled successfully"
    }


# -------------------------
# ENABLE USER
# -------------------------

@app.put("/admin/user/{user_id}/enable")
def enable_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    verify_admin(current_user)

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = True

    create_audit_log(
        db,
        current_user.id,
        "ENABLE_USER",
        user.email
    )

    db.commit()

    return {
        "message": "User enabled successfully"
    }

@app.get("/marketplace")
def marketplace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.status == "AVAILABLE",
            Coupon.owner_id != current_user.id
        )
        .all()
    )

    marketplace_items = []
    for coupon in coupons:
        val = coupon.coupon_value or 0
        total_price = round(val * 0.25, 2)
        owner_payout = round(val * 0.20, 2)
        platform_fee = round(val * 0.05, 2)

        marketplace_items.append({
            "id": coupon.id,
            "title": coupon.title,
            "description": coupon.description,
            "source_app": coupon.source_app,
            "coupon_value": val,
            "total_price": total_price,
            "owner_payout": owner_payout,
            "platform_fee": platform_fee,
            "owner_id": coupon.owner_id,
            "is_ocr_verified": bool(coupon.is_ocr_verified),
            "status": coupon.status
        })

    return marketplace_items

@app.post("/request-coupon/{coupon_id}")
def request_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.id == coupon_id
        )
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found"
        )

    if coupon.owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot request your own coupon"
        )

    if coupon.status != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail="Coupon is no longer available"
        )

    val = coupon.coupon_value or 0
    total_price = round(val * 0.25, 2)
    owner_payout = round(val * 0.20, 2)
    platform_fee = round(val * 0.05, 2)

    # Check buyer balance
    if current_user.wallet_balance is None:
        current_user.wallet_balance = 1000.0

    if current_user.wallet_balance < total_price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance (₹{current_user.wallet_balance:.2f}). You need ₹{total_price:.2f}. Please add funds to your wallet."
        )

    owner = db.query(User).filter(User.id == coupon.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=404,
            detail="Coupon owner not found"
        )

    # 1. Deduct 25% from buyer's account
    current_user.wallet_balance = round(current_user.wallet_balance - total_price, 2)

    # 2. Credit platform fee 5% to platform treasury
    platform_acc = db.query(PlatformAccount).filter(PlatformAccount.id == 1).first()
    if not platform_acc:
        platform_acc = PlatformAccount(
            id=1,
            balance=0.0,
            total_volume=0.0,
            total_transactions=0,
            account_name="RewardsHub Platform Account"
        )
        db.add(platform_acc)
        db.flush()

    platform_acc.balance = round((platform_acc.balance or 0.0) + platform_fee, 2)
    platform_acc.total_volume = round((platform_acc.total_volume or 0.0) + total_price, 2)
    platform_acc.total_transactions = (platform_acc.total_transactions or 0) + 1

    # 3. Generate unique transaction reference with ESCROW_HOLD status
    txn_ref = f"TXN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    transaction = Transaction(
        transaction_id=txn_ref,
        coupon_id=coupon.id,
        buyer_id=current_user.id,
        owner_id=owner.id,
        total_amount=total_price,
        owner_payout=owner_payout,
        platform_fee=platform_fee,
        owner_upi=owner.upi_id,
        status="ESCROW_HOLD",
        description=f"Marketplace purchase of '{coupon.title}' (Value: ₹{val}) [HELD IN ESCROW - BUYER PROTECTED]"
    )
    db.add(transaction)

    # 4. Record request with ESCROW_HOLD status
    request = CouponRequest(
        coupon_id=coupon.id,
        buyer_id=current_user.id,
        owner_id=coupon.owner_id,
        total_price=total_price,
        owner_payout=owner_payout,
        platform_fee=platform_fee,
        status="ESCROW_HOLD"
    )
    db.add(request)

    # 5. Transfer coupon to buyer with IN_ESCROW status
    coupon.seller_id = coupon.owner_id
    coupon.buyer_id = current_user.id
    coupon.owner_id = current_user.id
    coupon.escrow_status = "IN_ESCROW"
    coupon.status = "ACQUIRED_IN_ESCROW"

    # 6. Notifications
    owner_dest = f"UPI ({owner.upi_id})" if owner.upi_id else "Registered Bank/Wallet"
    create_notification(
        db,
        owner.id,
        "🔒 Payout Secured in Escrow",
        f"Buyer {current_user.name} paid ₹{total_price:.2f} for '{coupon.title}'. Your ₹{owner_payout:.2f} payout is held safely in RewardsHub Escrow and will be released upon buyer confirmation."
    )

    create_notification(
        db,
        current_user.id,
        "🛡️ Buyer Protection Active (In Escrow)",
        f"Paid ₹{total_price:.2f}. Coupon '{coupon.title}' is now in My Coupons! Code: {coupon.coupon_code}. Funds are held in Escrow: test the code and click 'Verify & Redeem' or 'Report Issue' for a 100% refund."
    )

    # 7. Audit log
    create_audit_log(
        db,
        current_user.id,
        "MARKETPLACE_ESCROW_PURCHASE",
        f"{txn_ref}: Purchased '{coupon.title}' for ₹{total_price} [Escrow Hold: ₹{owner_payout} to {owner.email}]"
    )

    db.commit()

    return {
        "message": f"Successfully purchased! ₹{total_price} debited and held safely in Escrow. Test code: {coupon.coupon_code}. Click 'Verify & Redeem' once tested.",
        "transaction_id": txn_ref,
        "coupon_id": coupon.id,
        "coupon_code": coupon.coupon_code,
        "total_price": total_price,
        "owner_payout": owner_payout,
        "platform_fee": platform_fee,
        "wallet_balance": current_user.wallet_balance,
        "escrow_status": "IN_ESCROW"
    }


# -------------------------
# BUYER: VERIFY & REDEEM (RELEASE ESCROW)
# -------------------------

@app.post("/coupons/{coupon_id}/confirm-redeem")
def confirm_redeem(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if coupon.buyer_id != current_user.id and coupon.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the coupon buyer can confirm redemption")

    if coupon.escrow_status != "IN_ESCROW":
        raise HTTPException(status_code=400, detail="This coupon is not currently held in escrow")

    # Find the active escrow transaction
    txn = (
        db.query(Transaction)
        .filter(
            Transaction.coupon_id == coupon.id,
            Transaction.buyer_id == current_user.id,
            Transaction.status == "ESCROW_HOLD"
        )
        .order_by(Transaction.id.desc())
        .first()
    )

    if not txn:
        raise HTTPException(status_code=400, detail="No active escrow transaction found for this coupon")

    seller = db.query(User).filter(User.id == txn.owner_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Coupon seller not found")

    # Release 20% payout from escrow to seller's account
    seller.wallet_balance = round((seller.wallet_balance or 0.0) + txn.owner_payout, 2)
    seller.total_earned = round((seller.total_earned or 0.0) + txn.owner_payout, 2)

    # Update statuses
    txn.status = "COMPLETED"
    txn.description = txn.description.replace("[HELD IN ESCROW - BUYER PROTECTED]", "[Verified & Released from Escrow by Buyer]")
    coupon.escrow_status = "RELEASED"
    coupon.status = "REDEEMED"

    seller_dest = f"UPI ({seller.upi_id})" if seller.upi_id else "Registered Bank/Wallet"
    create_notification(
        db,
        seller.id,
        "🎉 Escrow Payout Released!",
        f"Buyer {current_user.name} verified that '{coupon.title}' works! ₹{txn.owner_payout:.2f} has been credited to your {seller_dest}."
    )

    create_notification(
        db,
        current_user.id,
        "✅ Verification Confirmed",
        f"You verified '{coupon.title}'. The seller payout (₹{txn.owner_payout:.2f}) has been released. Thank you for trading safely!"
    )

    create_audit_log(
        db,
        current_user.id,
        "CONFIRM_REDEEM_RELEASE_ESCROW",
        f"{txn.transaction_id}: Released ₹{txn.owner_payout} to {seller.email} for '{coupon.title}'"
    )

    db.commit()

    return {
        "message": f"Coupon verified! ₹{txn.owner_payout:.2f} payout released to seller.",
        "coupon_id": coupon.id,
        "escrow_status": "RELEASED",
        "status": "REDEEMED"
    }


# -------------------------
# BUYER: REPORT DISPUTE & 100% REFUND
# -------------------------

@app.post("/coupons/{coupon_id}/dispute-refund")
def dispute_refund(
    coupon_id: int,
    req: DisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if coupon.buyer_id != current_user.id and coupon.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the coupon buyer can dispute this purchase")

    if coupon.escrow_status != "IN_ESCROW":
        raise HTTPException(status_code=400, detail="Cannot dispute: Coupon is not held in escrow")

    txn = (
        db.query(Transaction)
        .filter(
            Transaction.coupon_id == coupon.id,
            Transaction.buyer_id == current_user.id,
            Transaction.status == "ESCROW_HOLD"
        )
        .order_by(Transaction.id.desc())
        .first()
    )

    if not txn:
        raise HTTPException(status_code=400, detail="No active escrow transaction found")

    seller = db.query(User).filter(User.id == txn.owner_id).first()

    # 100% Instant Refund back to buyer's wallet!
    current_user.wallet_balance = round((current_user.wallet_balance or 0.0) + txn.total_amount, 2)

    # Reverse platform fee
    platform_acc = db.query(PlatformAccount).filter(PlatformAccount.id == 1).first()
    if platform_acc and platform_acc.balance and platform_acc.balance >= txn.platform_fee:
        platform_acc.balance = round(platform_acc.balance - txn.platform_fee, 2)

    # Mark transaction as REFUNDED
    txn.status = "REFUNDED"
    txn.description = txn.description.replace("[HELD IN ESCROW - BUYER PROTECTED]", f"[DISPUTED & REFUNDED: {req.reason}]")

    # Mark coupon as invalid
    coupon.escrow_status = "REFUNDED"
    coupon.status = "DISPUTED_INVALID"

    refund_txn = Transaction(
        transaction_id=f"REFUND-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        coupon_id=coupon.id,
        buyer_id=current_user.id,
        owner_id=current_user.id,
        total_amount=txn.total_amount,
        owner_payout=txn.total_amount,
        platform_fee=0.0,
        status="COMPLETED",
        description=f"100% Buyer Protection Refund for '{coupon.title}' (Reason: {req.reason})"
    )
    db.add(refund_txn)

    create_notification(
        db,
        current_user.id,
        "💰 100% Refund Credited!",
        f"₹{txn.total_amount:.2f} has been refunded to your RewardsHub wallet for invalid coupon '{coupon.title}'. Reason: {req.reason}."
    )

    if seller:
        create_notification(
            db,
            seller.id,
            "⚠️ Dispute Raised - Escrow Cancelled",
            f"Buyer reported '{coupon.title}' as invalid ({req.reason}). Payout was cancelled and buyer was refunded 100%."
        )

    create_audit_log(
        db,
        current_user.id,
        "BUYER_DISPUTE_REFUND",
        f"Refunded ₹{txn.total_amount} for '{coupon.title}'. Reason: {req.reason}"
    )

    db.commit()

    return {
        "message": f"Dispute approved under Buyer Protection Guarantee! ₹{txn.total_amount:.2f} refunded to your wallet.",
        "refund_amount": txn.total_amount,
        "wallet_balance": current_user.wallet_balance,
        "escrow_status": "REFUNDED",
        "status": "DISPUTED_INVALID"
    }


# -------------------------
# WALLET & TRANSACTIONS
# -------------------------

@app.get("/wallet")
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.wallet_balance is None:
        current_user.wallet_balance = 1000.0
        db.commit()

    txns = (
        db.query(Transaction)
        .filter(
            (Transaction.buyer_id == current_user.id) |
            (Transaction.owner_id == current_user.id)
        )
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    txn_list = []
    for t in txns:
        is_buyer = (t.buyer_id == current_user.id)
        is_topup = (t.buyer_id == t.owner_id and "top-up" in (t.description or "").lower())

        if is_topup:
            txn_type = "TOPUP"
            display_amount = t.total_amount
        elif is_buyer:
            txn_type = "DEBIT"
            display_amount = t.total_amount
        else:
            txn_type = "CREDIT"
            display_amount = t.owner_payout

        txn_list.append({
            "id": t.id,
            "transaction_id": t.transaction_id,
            "type": txn_type,
            "amount": display_amount,
            "total_amount": t.total_amount,
            "owner_payout": t.owner_payout,
            "platform_fee": t.platform_fee,
            "description": t.description,
            "status": t.status,
            "created_at": t.created_at
        })

    return {
        "wallet_balance": round(current_user.wallet_balance or 0.0, 2),
        "total_earned": round(current_user.total_earned or 0.0, 2),
        "upi_id": current_user.upi_id,
        "bank_account_number": current_user.bank_account_number,
        "bank_ifsc": current_user.bank_ifsc,
        "bank_name": current_user.bank_name,
        "transactions": txn_list
    }


@app.post("/wallet/topup")
def topup_wallet(
    req: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Top-up amount must be greater than 0")

    if current_user.wallet_balance is None:
        current_user.wallet_balance = 0.0

    current_user.wallet_balance = round(current_user.wallet_balance + req.amount, 2)

    txn_ref = f"TOPUP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    transaction = Transaction(
        transaction_id=txn_ref,
        buyer_id=current_user.id,
        owner_id=current_user.id,
        total_amount=req.amount,
        owner_payout=req.amount,
        platform_fee=0.0,
        status="COMPLETED",
        description=f"Wallet top-up of ₹{req.amount:.2f} via UPI/Card"
    )
    db.add(transaction)

    create_notification(
        db,
        current_user.id,
        "💳 Wallet Top-up Successful",
        f"₹{req.amount:.2f} has been added to your RewardsHub wallet. New balance: ₹{current_user.wallet_balance:.2f}."
    )

    create_audit_log(
        db,
        current_user.id,
        "WALLET_TOPUP",
        f"{txn_ref}: Added ₹{req.amount:.2f}. Balance: ₹{current_user.wallet_balance:.2f}"
    )

    db.commit()

    return {
        "message": f"Successfully added ₹{req.amount:.2f} to wallet",
        "wallet_balance": current_user.wallet_balance,
        "transaction_id": txn_ref
    }


# -------------------------
# ADMIN TRANSACTIONS
# -------------------------

@app.get("/admin/transactions")
def admin_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    txns = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(100).all()
    res = []
    for t in txns:
        buyer = db.query(User).filter(User.id == t.buyer_id).first()
        owner = db.query(User).filter(User.id == t.owner_id).first()
        res.append({
            "id": t.id,
            "transaction_id": t.transaction_id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "buyer_email": buyer.email if buyer else "Unknown",
            "owner_name": owner.name if owner else "Unknown",
            "owner_email": owner.email if owner else "Unknown",
            "owner_upi": t.owner_upi or (owner.upi_id if owner else None),
            "total_amount": t.total_amount,
            "owner_payout": t.owner_payout,
            "platform_fee": t.platform_fee,
            "status": t.status,
            "description": t.description,
            "created_at": t.created_at
        })
    return res
    
