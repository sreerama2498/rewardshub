import io
import re
from PIL import Image
try:
    import pytesseract
except ImportError:
    pytesseract = None

KNOWN_BRANDS = [
    "PhonePe", "Google Pay", "GPay", "Paytm", "Amazon", "Flipkart",
    "Swiggy", "Zomato", "RedBus", "MakeMyTrip", "Uber", "Ola",
    "Myntra", "Ajio", "Nykaa", "BookMyShow", "Dominos", "KFC",
    "McDonalds", "Starbucks", "Croma", "Reliance Digital", "Tata Cliq"
]

def clean_string(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', s or '').upper()

def extract_text_from_image(image_bytes: bytes) -> str:
    if pytesseract is None:
        return ""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert RGBA / P to RGB
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def verify_coupon_screenshot(
    image_bytes: bytes,
    claimed_brand: str = None,
    claimed_code: str = None
) -> dict:
    raw_text = extract_text_from_image(image_bytes)
    cleaned_ocr_text = clean_string(raw_text)

    detected_brand = None
    brand_matched = False
    code_matched = False

    # Check for known brands in raw text
    for b in KNOWN_BRANDS:
        if re.search(r'\b' + re.escape(b) + r'\b', raw_text, re.IGNORECASE) or clean_string(b) in cleaned_ocr_text:
            detected_brand = b
            break

    if claimed_brand:
        cleaned_claimed_brand = clean_string(claimed_brand)
        if cleaned_claimed_brand in cleaned_ocr_text or (detected_brand and clean_string(detected_brand) == cleaned_claimed_brand):
            brand_matched = True
            if not detected_brand:
                detected_brand = claimed_brand

    # Check if coupon code is in the extracted text
    if claimed_code:
        cleaned_claimed_code = clean_string(claimed_code)
        if len(cleaned_claimed_code) >= 3 and cleaned_claimed_code in cleaned_ocr_text:
            code_matched = True

    # Calculate confidence score
    confidence = 0.0
    if brand_matched:
        confidence += 45.0
    if code_matched:
        confidence += 50.0
    if len(raw_text) > 20:
        confidence += 5.0

    # Both brand and code must be present in the screenshot for verification to pass.
    # Brand-only is insufficient — a user could upload any brand page without a real code.
    is_verified = brand_matched and code_matched

    # Preview snippet of extracted text (clean up whitespace)
    snippet = " ".join(raw_text.split()[:40])

    return {
        "is_verified": is_verified,
        "brand_matched": brand_matched,
        "code_matched": code_matched,
        "detected_brand": detected_brand or claimed_brand,
        "confidence": min(confidence, 100.0),
        "snippet": snippet
    }
