import pytest
from pydantic import ValidationError
from app.schemas.profile import TopupRequest
from app.schemas.coupon import CouponCreate
from app.schemas.user import UserCreate

def test_topup_request_validation():
    req = TopupRequest(amount=100.555)
    assert req.amount == 100.56

    with pytest.raises(ValidationError):
        TopupRequest(amount=0)

    with pytest.raises(ValidationError):
        TopupRequest(amount=-50)

    with pytest.raises(ValidationError):
        TopupRequest(amount=100000)

def test_user_create_validation():
    user = UserCreate(name="John Doe", email="john@example.com", password="password123")
    assert user.email == "john@example.com"

    with pytest.raises(ValidationError):
        UserCreate(name="John Doe", email="not-an-email", password="password123")

    with pytest.raises(ValidationError):
        UserCreate(name="John Doe", email="john@example.com", password="short")

def test_coupon_create_validation():
    coupon = CouponCreate(
        title="Swiggy 50% Off",
        source_app="Swiggy",
        coupon_code="SWIGGY50",
        coupon_value=200
    )
    assert coupon.coupon_value == 200

    # Test direct link without coupon code (Google Pay style)
    direct_coupon = CouponCreate(
        title="Google Pay Direct Offer",
        source_app="GooglePay",
        redemption_url="https://merchant.com/redeem?token=123",
        coupon_value=150
    )
    assert direct_coupon.coupon_code == "REDEEM_VIA_LINK"
    assert direct_coupon.redemption_url == "https://merchant.com/redeem?token=123"

    with pytest.raises(ValidationError):
        CouponCreate(
            title="Swiggy",
            source_app="Swiggy",
            coupon_code="SWIGGY50",
            coupon_value=-10
        )

    # Missing both code and url should fail
    with pytest.raises(ValidationError):
        CouponCreate(
            title="Empty Offer",
            source_app="GooglePay",
            coupon_value=100
        )

    # Test BOGO and percentage discount mechanisms
    bogo = CouponCreate(
        title="Dominos BOGO",
        source_app="Dominos",
        coupon_code="BOGOMANIA",
        coupon_value=350,
        discount_type="BOGO",
        bogo_details="Buy 1 Medium Pizza, Get 1 Free",
        distribution_channel="DIGITAL",
        target_audience="NEW_USERS",
        usage_structure="SINGLE_USE"
    )
    assert bogo.discount_type == "BOGO"
    assert bogo.bogo_details == "Buy 1 Medium Pizza, Get 1 Free"
    assert bogo.target_audience == "NEW_USERS"
