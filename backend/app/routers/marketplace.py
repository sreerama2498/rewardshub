from datetime import date, datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.coupon import Coupon
from app.models.coupon_request import CouponRequest
from app.models.transaction import Transaction
from app.models.platform_account import PlatformAccount
from app.schemas.profile import TopupRequest
from app.services.helpers import create_audit_log, create_notification

router = APIRouter(tags=["Marketplace & Wallet"])


@router.get("/marketplace")
def marketplace(
    category: str | None = None,
    discount_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    query = (
        db.query(Coupon)
        .filter(
            Coupon.status == "AVAILABLE",
            (Coupon.expiry_date == None) | (Coupon.expiry_date >= today)
        )
    )

    if category and category.strip().upper() != "ALL":
        query = query.filter(Coupon.category == category.strip().upper())

    if discount_type and discount_type.strip().upper() != "ALL":
        query = query.filter(Coupon.discount_type == discount_type.strip().upper())

    coupons = query.order_by(Coupon.created_at.desc()).all()

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
            "category": coupon.category or "OTHER",
            "terms_note": coupon.terms_note,
            "discount_type": coupon.discount_type or "FLAT_AMOUNT",
            "discount_percent": coupon.discount_percent or 0,
            "max_discount_cap": coupon.max_discount_cap or 0,
            "min_order_value": coupon.min_order_value or 0,
            "bogo_details": coupon.bogo_details,
            "free_gift_details": coupon.free_gift_details,
            "distribution_channel": coupon.distribution_channel or "DIGITAL",
            "target_audience": coupon.target_audience or "ALL_USERS",
            "usage_structure": coupon.usage_structure or "SINGLE_USE",
            "has_security_pin": bool(coupon.security_pin),
            "security_pin_preview": ("••••" if coupon.security_pin else None),
            "coupon_value": val,
            "total_price": total_price,
            "owner_payout": owner_payout,
            "platform_fee": platform_fee,
            "owner_id": coupon.owner_id,
            "is_owner": coupon.owner_id == current_user.id,
            "redemption_url": coupon.redemption_url,
            "has_redemption_url": bool(coupon.redemption_url),
            "is_ocr_verified": bool(coupon.is_ocr_verified),
            "status": coupon.status,
            "expiry_date": coupon.expiry_date
        })

    return marketplace_items


@router.post("/request-coupon/{coupon_id}")
def request_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()

    # Row-lock the coupon to prevent concurrent purchase race conditions
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .with_for_update()
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

    if coupon.expiry_date and coupon.expiry_date < today:
        raise HTTPException(
            status_code=400,
            detail="This coupon has expired and cannot be purchased"
        )

    val = coupon.coupon_value or 0
    total_price = round(val * 0.25, 2)
    owner_payout = round(val * 0.20, 2)
    platform_fee = round(val * 0.05, 2)

    # Row-lock buyer user to prevent double-spending race condition
    buyer = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer account not found")

    if buyer.wallet_balance is None:
        buyer.wallet_balance = 1000.0

    if buyer.wallet_balance < total_price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance (₹{buyer.wallet_balance:.2f}). You need ₹{total_price:.2f}. Please add funds to your wallet."
        )

    owner = db.query(User).filter(User.id == coupon.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=404,
            detail="Coupon owner not found"
        )

    # 1. Deduct 25% from buyer's account atomically
    buyer.wallet_balance = round(buyer.wallet_balance - total_price, 2)

    # 2. Credit platform fee 5% to platform treasury
    platform_acc = (
        db.query(PlatformAccount)
        .filter(PlatformAccount.id == 1)
        .with_for_update()
        .first()
    )
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
        buyer_id=buyer.id,
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
        buyer_id=buyer.id,
        owner_id=coupon.owner_id,
        total_price=total_price,
        owner_payout=owner_payout,
        platform_fee=platform_fee,
        status="ESCROW_HOLD"
    )
    db.add(request)

    # 5. Transfer coupon to buyer with IN_ESCROW status
    coupon.seller_id = coupon.owner_id
    coupon.buyer_id = buyer.id
    coupon.owner_id = buyer.id
    coupon.escrow_status = "IN_ESCROW"
    coupon.status = "ACQUIRED_IN_ESCROW"

    # 6. Notifications (atomic, no premature commit)
    create_notification(
        db,
        owner.id,
        "🔒 Payout Secured in Escrow",
        f"Buyer {buyer.name} paid ₹{total_price:.2f} for '{coupon.title}'. Your ₹{owner_payout:.2f} payout is held safely in RewardsHub Escrow and will be released upon buyer confirmation."
    )

    create_notification(
        db,
        buyer.id,
        "🛡️ Buyer Protection Active (In Escrow)",
        f"Paid ₹{total_price:.2f}. Coupon '{coupon.title}' is now in My Coupons! Code: {coupon.coupon_code}. Funds are held in Escrow: test the code and click 'Verify & Redeem' or 'Report Issue' for a 100% refund."
    )

    # 7. Audit log
    create_audit_log(
        db,
        buyer.id,
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
        "wallet_balance": buyer.wallet_balance,
        "escrow_status": "IN_ESCROW"
    }


@router.get("/wallet")
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


@router.post("/wallet/topup")
def topup_wallet(
    req: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Top-up amount must be greater than 0")
    if req.amount > 50000:
        raise HTTPException(status_code=400, detail="Maximum top-up amount is ₹50,000 per transaction")

    user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.wallet_balance is None:
        user.wallet_balance = 0.0

    user.wallet_balance = round(user.wallet_balance + req.amount, 2)

    txn_ref = f"TOPUP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    transaction = Transaction(
        transaction_id=txn_ref,
        buyer_id=user.id,
        owner_id=user.id,
        total_amount=req.amount,
        owner_payout=req.amount,
        platform_fee=0.0,
        status="COMPLETED",
        description=f"Wallet top-up of ₹{req.amount:.2f} via UPI/Card"
    )
    db.add(transaction)

    create_notification(
        db,
        user.id,
        "💳 Wallet Top-up Successful",
        f"₹{req.amount:.2f} has been added to your RewardsHub wallet. New balance: ₹{user.wallet_balance:.2f}."
    )

    create_audit_log(
        db,
        user.id,
        "WALLET_TOPUP",
        f"{txn_ref}: Added ₹{req.amount:.2f}. Balance: ₹{user.wallet_balance:.2f}"
    )

    db.commit()

    return {
        "message": f"Successfully added ₹{req.amount:.2f} to wallet",
        "wallet_balance": user.wallet_balance,
        "transaction_id": txn_ref
    }
