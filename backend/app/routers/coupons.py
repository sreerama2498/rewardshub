import asyncio
from datetime import date, timedelta, timezone, datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.coupon import Coupon
from app.models.share import CouponShare
from app.models.transaction import Transaction
from app.models.platform_account import PlatformAccount
from app.schemas.coupon import CouponCreate, DisputeRequest
from app.schemas.share import ShareCouponRequest
from app.services.ocr import verify_coupon_screenshot
from app.services.helpers import create_audit_log, create_notification

router = APIRouter(tags=["Coupons & Sharing"])


@router.post("/coupons/verify-ocr")
async def verify_ocr(
    file: UploadFile = File(...),
    brand: str = Form(None),
    coupon_code: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")

    # Offload CPU-bound Tesseract OCR to threadpool so event loop is never blocked
    result = await asyncio.to_thread(
        verify_coupon_screenshot,
        image_bytes=contents,
        claimed_brand=brand,
        claimed_code=coupon_code
    )
    return result


@router.post("/coupons")
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
        redemption_url=coupon.redemption_url,
        category=(coupon.category or "OTHER").upper(),
        security_pin=coupon.security_pin,
        terms_note=coupon.terms_note,
        discount_type=(coupon.discount_type or "FLAT_AMOUNT").upper(),
        discount_percent=coupon.discount_percent or 0,
        max_discount_cap=coupon.max_discount_cap or 0,
        min_order_value=coupon.min_order_value or 0,
        bogo_details=coupon.bogo_details,
        free_gift_details=coupon.free_gift_details,
        distribution_channel=(coupon.distribution_channel or "DIGITAL").upper(),
        target_audience=(coupon.target_audience or "ALL_USERS").upper(),
        usage_structure=(coupon.usage_structure or "SINGLE_USE").upper(),
        coupon_value=coupon.coupon_value,
        status="AVAILABLE",
        is_ocr_verified=bool(coupon.is_ocr_verified),
        escrow_status="NONE",
        expiry_date=coupon.expiry_date,
        owner_id=current_user.id
    )

    db.add(new_coupon)
    db.flush()

    action_name = "CREATE_OCR_VERIFIED_COUPON" if coupon.is_ocr_verified else "CREATE_COUPON"
    create_audit_log(
        db,
        current_user.id,
        action_name,
        f"{coupon.title} (Value: ₹{coupon.coupon_value}, OCR Verified: {coupon.is_ocr_verified})"
    )
    db.commit()
    db.refresh(new_coupon)

    return {
        "message": "Coupon created successfully" + (" with verified OCR proof!" if coupon.is_ocr_verified else ""),
        "coupon_id": new_coupon.id,
        "is_ocr_verified": new_coupon.is_ocr_verified
    }


@router.get("/my-coupons")
def my_coupons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupons = (
        db.query(Coupon)
        .filter(Coupon.owner_id == current_user.id)
        .order_by(Coupon.created_at.desc())
        .all()
    )
    return coupons


@router.post("/coupons/{coupon_id}/confirm-redeem")
def confirm_redeem(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .with_for_update()
        .first()
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if coupon.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the coupon buyer can confirm redemption")

    if coupon.escrow_status != "IN_ESCROW":
        raise HTTPException(status_code=400, detail="This coupon is not currently held in escrow")

    txn = (
        db.query(Transaction)
        .filter(
            Transaction.coupon_id == coupon.id,
            Transaction.buyer_id == current_user.id,
            Transaction.status == "ESCROW_HOLD"
        )
        .with_for_update()
        .order_by(Transaction.id.desc())
        .first()
    )

    if not txn:
        raise HTTPException(status_code=400, detail="No active escrow transaction found for this coupon")

    seller = (
        db.query(User)
        .filter(User.id == txn.owner_id)
        .with_for_update()
        .first()
    )
    if not seller:
        raise HTTPException(status_code=404, detail="Coupon seller not found")

    # Release 20% payout from escrow to seller's account
    seller.wallet_balance = round((seller.wallet_balance or 0.0) + txn.owner_payout, 2)
    seller.total_earned = round((seller.total_earned or 0.0) + txn.owner_payout, 2)

    # Update statuses
    txn.status = "COMPLETED"
    txn.description = (txn.description or "").replace(
        "[HELD IN ESCROW - BUYER PROTECTED]",
        "[Verified & Released from Escrow by Buyer]"
    )
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


@router.post("/coupons/{coupon_id}/dispute-refund")
def dispute_refund(
    coupon_id: int,
    req: DisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .with_for_update()
        .first()
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if coupon.buyer_id != current_user.id:
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
        .with_for_update()
        .order_by(Transaction.id.desc())
        .first()
    )

    if not txn:
        raise HTTPException(status_code=400, detail="No active escrow transaction found")

    seller = db.query(User).filter(User.id == txn.owner_id).first()

    buyer = (
        db.query(User)
        .filter(User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer account not found")

    buyer.wallet_balance = round((buyer.wallet_balance or 0.0) + txn.total_amount, 2)

    platform_acc = (
        db.query(PlatformAccount)
        .filter(PlatformAccount.id == 1)
        .with_for_update()
        .first()
    )
    if platform_acc:
        platform_acc.balance = round(max(0.0, (platform_acc.balance or 0.0) - txn.platform_fee), 2)
        platform_acc.total_volume = round(max(0.0, (platform_acc.total_volume or 0.0) - txn.total_amount), 2)

    txn.status = "REFUNDED"
    txn.description = (txn.description or "").replace(
        "[HELD IN ESCROW - BUYER PROTECTED]",
        f"[DISPUTED & REFUNDED: {req.reason}]"
    )

    coupon.escrow_status = "REFUNDED"
    coupon.status = "DISPUTED_INVALID"

    refund_txn = Transaction(
        transaction_id=f"REFUND-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        coupon_id=coupon.id,
        buyer_id=buyer.id,
        owner_id=buyer.id,
        total_amount=txn.total_amount,
        owner_payout=txn.total_amount,
        platform_fee=0.0,
        status="COMPLETED",
        description=f"100% Buyer Protection Refund for '{coupon.title}' (Reason: {req.reason})"
    )
    db.add(refund_txn)

    create_notification(
        db,
        buyer.id,
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
        buyer.id,
        "BUYER_DISPUTE_REFUND",
        f"Refunded ₹{txn.total_amount} for '{coupon.title}'. Reason: {req.reason}"
    )

    db.commit()

    return {
        "message": f"Dispute approved under Buyer Protection Guarantee! ₹{txn.total_amount:.2f} refunded to your wallet.",
        "refund_amount": txn.total_amount,
        "wallet_balance": buyer.wallet_balance,
        "escrow_status": "REFUNDED",
        "status": "DISPUTED_INVALID"
    }


@router.post("/share-coupon")
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
        raise HTTPException(
            status_code=404,
            detail="Coupon not found"
        )

    if coupon.status != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail=f"Only available coupons can be shared (current status: {coupon.status})"
        )

    clean_receiver_email = request.receiver_email.strip().lower()
    receiver = (
        db.query(User)
        .filter(func.lower(User.email) == clean_receiver_email)
        .first()
    )

    if not receiver:
        raise HTTPException(
            status_code=404,
            detail="Receiver not found with that email address"
        )

    if receiver.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot share a coupon with yourself"
        )

    existing_share = (
        db.query(CouponShare)
        .filter(
            CouponShare.coupon_id == coupon.id,
            CouponShare.sender_id == current_user.id,
            CouponShare.receiver_id == receiver.id,
            CouponShare.status == "PENDING"
        )
        .first()
    )

    if existing_share:
        raise HTTPException(
            status_code=400,
            detail="Coupon is already pending acceptance with this user"
        )

    share = CouponShare(
        coupon_id=coupon.id,
        sender_id=current_user.id,
        receiver_id=receiver.id,
        status="PENDING"
    )

    db.add(share)
    db.flush()

    create_audit_log(
        db,
        current_user.id,
        "SHARE_COUPON",
        f"Shared coupon '{coupon.title}' (ID {coupon.id}) with {receiver.email}"
    )

    create_notification(
        db,
        receiver.id,
        "🎁 Coupon Shared With You!",
        f"{current_user.name} sent you a coupon: '{coupon.title}'. Go to Received Shares to claim it!"
    )

    db.commit()
    db.refresh(share)

    return {
        "message": f"Coupon '{coupon.title}' shared successfully with {receiver.email}",
        "share_id": share.id
    }


@router.get("/shared-with-me")
def shared_with_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = (
        db.query(CouponShare)
        .filter(CouponShare.receiver_id == current_user.id)
        .order_by(CouponShare.created_at.desc())
        .all()
    )

    if not shares:
        return []

    coupon_ids = {share.coupon_id for share in shares if share.coupon_id}
    sender_ids = {share.sender_id for share in shares if share.sender_id}

    coupons_by_id = {
        c.id: c for c in db.query(Coupon).filter(Coupon.id.in_(coupon_ids)).all()
    } if coupon_ids else {}

    senders_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(sender_ids)).all()
    } if sender_ids else {}

    results = []
    for share in shares:
        coupon = coupons_by_id.get(share.coupon_id)
        sender = senders_by_id.get(share.sender_id)

        results.append({
            "id": share.id,
            "coupon_id": share.coupon_id,
            "coupon_title": coupon.title if coupon else "Unknown Coupon",
            "coupon_description": coupon.description if coupon else "",
            "source_app": coupon.source_app if coupon else "Other",
            "coupon_value": coupon.coupon_value if coupon else 0,
            "expiry_date": coupon.expiry_date if coupon else None,
            "category": coupon.category if coupon else "OTHER",
            "sender_name": sender.name if sender else "A Friend",
            "sender_email": sender.email if sender else "Unknown",
            "status": share.status,
            "created_at": share.created_at,
            "updated_at": share.updated_at
        })

    return results


@router.post("/accept-share/{share_id}")
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
        .with_for_update()
        .first()
    )

    if not share:
        raise HTTPException(
            status_code=404,
            detail="Share request not found"
        )

    if share.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Share request has already been {share.status.lower()}"
        )

    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == share.coupon_id)
        .with_for_update()
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Shared coupon no longer exists"
        )

    # Transfer ownership of coupon to the recipient
    coupon.owner_id = current_user.id
    coupon.status = "AVAILABLE"
    coupon.is_shared = False
    share.status = "ACCEPTED"

    create_notification(
        db,
        share.sender_id,
        "🎉 Coupon Accepted!",
        f"{current_user.name} accepted your gift '{coupon.title}'. The coupon was transferred to them."
    )

    create_notification(
        db,
        current_user.id,
        "🎟️ Coupon Claimed!",
        f"You accepted '{coupon.title}'. It is now ready to use under 'My Coupons'!"
    )

    create_audit_log(
        db,
        current_user.id,
        "ACCEPT_SHARE",
        f"Accepted and received coupon '{coupon.title}' (ID {coupon.id}) from user ID {share.sender_id}"
    )

    db.commit()

    return {
        "message": f"Coupon '{coupon.title}' accepted! It has been added to your My Coupons collection.",
        "coupon_id": coupon.id
    }


@router.post("/reject-share/{share_id}")
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
        raise HTTPException(
            status_code=404,
            detail="Share not found"
        )

    share.status = "REJECTED"

    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == share.coupon_id)
        .first()
    )

    if coupon:
        coupon.is_shared = False

    create_notification(
        db,
        share.sender_id,
        "Coupon Rejected",
        "Your coupon was rejected"
    )

    db.commit()

    return {
        "message": "Share rejected"
    }


@router.get("/sent-shares")
def get_sent_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = (
        db.query(CouponShare)
        .filter(CouponShare.sender_id == current_user.id)
        .order_by(CouponShare.created_at.desc())
        .all()
    )

    if not shares:
        return []

    coupon_ids = {share.coupon_id for share in shares if share.coupon_id}
    receiver_ids = {share.receiver_id for share in shares if share.receiver_id}

    coupons_by_id = {
        c.id: c for c in db.query(Coupon).filter(Coupon.id.in_(coupon_ids)).all()
    } if coupon_ids else {}

    receivers_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(receiver_ids)).all()
    } if receiver_ids else {}

    results = []
    for share in shares:
        coupon = coupons_by_id.get(share.coupon_id)
        receiver = receivers_by_id.get(share.receiver_id)

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


@router.get("/expiry-dashboard")
def expiry_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    next_7_days = today + timedelta(days=7)

    coupons = (
        db.query(Coupon)
        .filter(Coupon.owner_id == current_user.id)
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


@router.get("/activity")
def get_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coupons = (
        db.query(Coupon)
        .order_by(Coupon.created_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "type": "Coupon Created",
            "title": coupon.title,
            "created_at": coupon.created_at
        }
        for coupon in coupons
    ]


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_coupons = db.query(Coupon).count()
    total_shares = db.query(CouponShare).count()
    accepted_shares = (
        db.query(CouponShare)
        .filter(CouponShare.status == "ACCEPTED")
        .count()
    )

    return {
        "total_users": total_users,
        "total_coupons": total_coupons,
        "total_shares": total_shares,
        "accepted_shares": accepted_shares
    }

