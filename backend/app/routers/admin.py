from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.coupon import Coupon
from app.models.share import CouponShare
from app.models.audit_log import AuditLog
from app.models.transaction import Transaction
from app.models.platform_account import PlatformAccount
from app.services.helpers import create_audit_log

router = APIRouter(tags=["Administration"])


def verify_admin(current_user: User):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return True


def get_activity_category(action):
    auth_actions = ["LOGIN", "REGISTER", "PASSWORD_CHANGE"]
    coupon_actions = ["CREATE_COUPON", "CREATE_OCR_VERIFIED_COUPON", "UPDATE_COUPON", "DELETE_COUPON", "SHARE_COUPON"]
    admin_actions = ["DELETE_USER", "DISABLE_USER", "ENABLE_USER", "MAKE_ADMIN", "REMOVE_ADMIN"]

    if action in auth_actions:
        return "AUTH"
    if action in coupon_actions:
        return "COUPON"
    if action in admin_actions:
        return "ADMIN"
    return "OTHER"


@router.get("/admin/stats")
def admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == "ADMIN").count()
    active_users = db.query(User).filter(User.is_active == True).count()
    disabled_users = db.query(User).filter(User.is_active == False).count()
    total_coupons = db.query(Coupon).count()
    total_shares = db.query(CouponShare).count()
    accepted_shares = db.query(CouponShare).filter(CouponShare.status == "ACCEPTED").count()

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


@router.get("/admin/users")
def admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)
    users = db.query(User).order_by(User.id.asc()).all()

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


@router.get("/admin/user/{user_id}/coupons")
@router.get("/admin/user-coupons/{user_id}")
def admin_user_coupons(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)
    coupons = db.query(Coupon).filter(Coupon.owner_id == user_id).all()
    return coupons


@router.delete("/admin/user/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
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
        f"Admin deleted user {user.email} (ID: {user.id})"
    )

    # Detach audit logs rather than destroying audit trail
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({"user_id": None})
    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }


@router.get("/admin/audit-logs")
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
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
            "category": get_activity_category(log.action)
        }
        for log in logs
    ]


@router.put("/admin/user/{user_id}/disable")
def disable_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
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


@router.put("/admin/user/{user_id}/enable")
def enable_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
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


@router.get("/admin/transactions")
def admin_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_admin(current_user)

    txns = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(100).all()
    if not txns:
        return []

    user_ids = {t.buyer_id for t in txns if t.buyer_id} | {t.owner_id for t in txns if t.owner_id}
    users_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}

    res = []
    for t in txns:
        buyer = users_by_id.get(t.buyer_id)
        owner = users_by_id.get(t.owner_id)
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
