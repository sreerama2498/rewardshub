from app.services.ocr import clean_string, extract_candidate_codes, verify_coupon_screenshot

def test_clean_string():
    assert clean_string("Swiggy @ 50% Off!") == "SWIGGY50OFF"
    assert clean_string(None) == ""

def test_extract_candidate_codes():
    text = "Use code SWIGGY50 to get 50% discount. Terms and conditions apply."
    codes = extract_candidate_codes(text)
    assert "SWIGGY50" in codes
    assert "TERMS" not in codes
    assert "CONDITIONS" not in codes

def test_verify_coupon_empty_or_no_ocr():
    # Calling verify with empty bytes
    result = verify_coupon_screenshot(b"", claimed_brand="Swiggy", claimed_code="SAVE50")
    assert isinstance(result, dict)
    assert "is_verified" in result
    assert "is_valid" in result
    assert result["is_verified"] is False
