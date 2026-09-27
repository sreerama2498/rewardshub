import io
import re

try:
    from PIL import Image, ImageFilter, ImageEnhance
    Image.MAX_IMAGE_PIXELS = 25000000
except ImportError:
    Image = None

try:
    import pytesseract
    # Use locally installed tesseract if system one is not in PATH
    import shutil
    if not shutil.which("tesseract"):
        pytesseract.pytesseract.tesseract_cmd = "/home/sreeram-dev/.local/bin/tesseract"
except ImportError:
    pytesseract = None

# ---------------------------------------------------------------------------
# Known brand / source-app names used for auto-detection
# ---------------------------------------------------------------------------
KNOWN_BRANDS = [
    "PhonePe", "Google Pay", "GPay", "Paytm", "Amazon", "Flipkart",
    "Swiggy", "Zomato", "RedBus", "MakeMyTrip", "Uber", "Ola",
    "Myntra", "Ajio", "Nykaa", "BookMyShow", "Dominos", "KFC",
    "McDonalds", "Starbucks", "Croma", "Reliance Digital", "Tata Cliq",
    "Meesho", "Snapdeal", "BigBasket", "Blinkit", "Zepto", "Instamart",
    "Rapido", "Porter", "IRCTC", "SpiceJet", "IndiGo", "Air India",
    "Airtel", "Jio", "Vodafone", "BSNL", "Hotstar", "Netflix", "Prime",
    "SonyLiv", "Zee5", "JioCinema", "Byju", "Unacademy", "Coursera",
    "Dunzo", "Puma", "Nike", "Adidas", "Levi", "Pantaloons", "Lifestyle",
    "Decathlon", "FirstCry", "Boat", "OnePlus", "Realme", "Samsung",
    "Apple", "Lenovo", "HP", "Dell"
]

COMMON_STOPWORDS = {
    "TERMS", "CONDITIONS", "APPLY", "EXPIRES", "EXPIRE", "VALID", "VALIDITY",
    "OFFER", "CODE", "COUPON", "DISCOUNT", "VOUCHER", "CASHBACK", "REDEEM",
    "DETAILS", "SHOW", "TAP", "COPY", "COPIED", "SUCCESS", "PAYMENT", "ORDER",
    "ORDERS", "MINIMUM", "MAXIMUM", "AMOUNT", "TOTAL", "SAVE", "SAVING",
    "CLICK", "HERE", "MORE", "INFO", "HELP", "CART", "CHECKOUT", "LOGIN",
    "OPEN", "DOWNLOAD", "SHARE", "BRAND", "FREE", "SHOP"
}

# Month name → zero-padded month number
_MONTHS = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
    "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    "january": "01", "february": "02", "march": "03", "april": "04", "june": "06",
    "july": "07", "august": "08", "september": "09", "october": "10",
    "november": "11", "december": "12",
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def clean_string(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", s or "").upper()


def _preprocess_image(image_bytes: bytes):
    """Return a sharpened, contrast-boosted grayscale PIL image for better OCR."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    # Upscale small screenshots (< 800 px wide) for better accuracy
    if img.width < 800:
        scale = max(2, int(800 / img.width))
        img = img.resize((img.width * scale, img.height * scale), Image.LANCZOS)
    # Convert to greyscale, sharpen, boost contrast
    img = img.convert("L")
    img = img.filter(ImageFilter.SHARPEN)
    img = ImageEnhance.Contrast(img).enhance(2.0)
    return img


def extract_text_from_image(image_bytes: bytes) -> str:
    if pytesseract is None or Image is None:
        return ""
    try:
        img = _preprocess_image(image_bytes)
        # Use LSTM engine, oem 1, psm 6 (uniform block of text)
        cfg = "--oem 1 --psm 6"
        text = pytesseract.image_to_string(img, config=cfg)
        return text.strip()
    except Exception as exc:
        print(f"[OCR] Extraction error: {exc}")
        return ""


def extract_candidate_codes(raw_text: str) -> list[str]:
    """Return ordered list of probable coupon/promo codes from raw OCR text."""
    # Priority-1: token right after label keywords
    labeled = re.findall(
        r"(?i)(?:use\s+code|promo\s+code|coupon\s+code|code|voucher|redeem)[:\s]+([A-Z0-9_\-]{4,20})",
        raw_text,
    )
    # Priority-2: any UPPER alphanumeric token 4–20 chars
    all_caps = re.findall(r"\b[A-Z0-9_\-]{4,20}\b", raw_text)
    seen = set()
    result = []
    for tok in labeled + all_caps:
        clean = tok.replace("-", "").replace("_", "").upper()
        if (
            len(clean) >= 4
            and not clean.isdigit()
            and clean not in COMMON_STOPWORDS
            and clean not in seen
        ):
            seen.add(clean)
            result.append(tok.upper())
    return result[:5]  # return top-5 candidates


# ---------------------------------------------------------------------------
# Structured field parser – new in this version
# ---------------------------------------------------------------------------

def _parse_expiry(text: str):
    """Try several date patterns and return YYYY-MM-DD or None."""
    # DD/MM/YYYY or DD-MM-YYYY
    m = re.search(
        r"(?i)(?:expires?|valid\s*(?:till|through|until|upto)|validity)[\s\w:–-]*?(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})",
        text,
    )
    if m:
        d, mo, y = m.group(1).zfill(2), m.group(2).zfill(2), m.group(3)
        if len(y) == 2:
            y = "20" + y
        return f"{y}-{mo}-{d}"

    # 15 Nov 2026 / 15th November 2026
    m2 = re.search(
        r"(?i)(?:expires?|valid\s*(?:till|through|until|upto)|validity)[\s\w:–-]*?(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]{3,9})\s+(\d{4})",
        text,
    )
    if m2:
        d = m2.group(1).zfill(2)
        mon = _MONTHS.get(m2.group(2).lower()[:3])
        if mon:
            return f"{m2.group(3)}-{mon}-{d}"
    return None


def _infer_category(text: str, brand: str) -> str:
    """Rough category mapping from keywords found in text."""
    mapping = [
        (["food", "pizza", "burger", "swiggy", "zomato", "restaurant", "dine", "eat", "meal", "domino", "kfc"], "FOOD"),
        (["fashion", "clothing", "apparel", "shirt", "myntra", "ajio", "dress", "shoe", "sneaker", "puma", "nike", "adidas", "levi", "pantaloon"], "FASHION"),
        (["travel", "flight", "hotel", "train", "bus", "cab", "uber", "ola", "irctc", "makemytrip", "redbus", "rapido", "spicejet", "indigo"], "TRAVEL"),
        (["movie", "ott", "streaming", "netflix", "prime", "hotstar", "disney", "zee5", "sonyliv", "bookmyshow", "jiocinema"], "ENTERTAINMENT"),
        (["health", "medicine", "pharmacy", "wellness", "gym", "yoga", "doctor", "1mg", "medplus"], "HEALTH"),
        (["edtech", "course", "learning", "byju", "unacademy", "coursera", "skill", "study"], "EDTECH"),
        (["game", "gaming", "steam", "xbox", "playstation"], "GAMING"),
    ]
    combined = (text + " " + (brand or "")).lower()
    for keywords, cat in mapping:
        if any(kw in combined for kw in keywords):
            return cat
    return "OTHER"


def parse_coupon_fields(raw_text: str, detected_brand: str = None) -> dict:
    """
    Parse structured coupon fields from OCR-extracted text.
    Returns a dict of auto-fill suggestions for the form.
    """
    fields = {}

    # ---- 1. Coupon code ---------------------------------------------------
    # Priority: labelled first, then candidate tokens
    labeled_codes = re.findall(
        r"(?i)(?:use\s+code|coupon\s+code|promo\s+code|code|voucher)[:\s]+([A-Z0-9_\-]{4,20})",
        raw_text,
    )
    all_candidates = extract_candidate_codes(raw_text)
    if labeled_codes:
        fields["coupon_code"] = labeled_codes[0].upper()
    elif all_candidates:
        fields["coupon_code"] = all_candidates[0].upper()

    # ---- 2. Discount mechanism -------------------------------------------
    pct_match = re.search(r"(\d{1,2})\s*%\s*(?:off|discount|cashback)?", raw_text, re.IGNORECASE)
    bogo_match = re.search(r"(?i)buy\s*[12]\s*get\s*[12]|bogo", raw_text)
    ship_match = re.search(r"(?i)free\s*(delivery|shipping)", raw_text)
    gift_match = re.search(r"(?i)free\s*(gift|trial|sample|item|product)", raw_text)
    flat_match = re.search(r"(?i)(?:flat|get|save|earn)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:off|cashback)?", raw_text)

    if bogo_match:
        fields["discount_type"] = "BOGO"
        fields["bogo_details"] = bogo_match.group(0).strip()
    elif ship_match:
        fields["discount_type"] = "FREE_SHIPPING"
    elif gift_match:
        fields["discount_type"] = "FREE_GIFT"
        fields["free_gift_details"] = gift_match.group(0).strip()
    elif pct_match:
        fields["discount_type"] = "PERCENTAGE"
        fields["discount_percent"] = int(pct_match.group(1))
    elif flat_match:
        fields["discount_type"] = "FLAT_AMOUNT"
        fields["coupon_value"] = int(flat_match.group(1))

    # ---- 3. Max discount cap / face value --------------------------------
    cap_match = re.search(
        r"(?i)(?:up\s*to|max(?:\s*discount)?|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+)",
        raw_text,
    )
    if cap_match:
        fields["max_discount_cap"] = int(cap_match.group(1))
        if not fields.get("coupon_value"):
            fields["coupon_value"] = int(cap_match.group(1))

    # ---- 4. Min order / spend -------------------------------------------
    min_match = re.search(
        r"(?i)(?:min(?:imum)?\s*(?:order|spend|purchase|cart)|orders?\s*(?:above|of|over|worth))\s*(?:₹|rs\.?|inr)?\s*(\d+)",
        raw_text,
    )
    if min_match:
        fields["min_order_value"] = int(min_match.group(1))

    # ---- 5. Expiry date ---------------------------------------------------
    expiry = _parse_expiry(raw_text)
    if expiry:
        fields["expiry_date"] = expiry

    # ---- 6. Brand / source app ------------------------------------------
    if detected_brand:
        fields["source_app"] = detected_brand

    # ---- 7. Category inference -------------------------------------------
    fields["category"] = _infer_category(raw_text, detected_brand)

    # ---- 8. Auto-compose title ------------------------------------------
    title_parts = []
    if detected_brand:
        title_parts.append(detected_brand)
    if fields.get("discount_type") == "PERCENTAGE":
        title_parts.append(f"{fields.get('discount_percent', '')}% Off")
        if fields.get("max_discount_cap"):
            title_parts.append(f"up to ₹{fields['max_discount_cap']}")
    elif fields.get("discount_type") == "FLAT_AMOUNT" and fields.get("coupon_value"):
        title_parts.append(f"₹{fields['coupon_value']} Off")
    elif fields.get("discount_type") == "FREE_SHIPPING":
        title_parts.append("Free Delivery")
    elif fields.get("discount_type") == "BOGO":
        title_parts.append("Buy 1 Get 1 Free")
    elif fields.get("discount_type") == "FREE_GIFT":
        title_parts.append("Free Gift/Trial")

    if fields.get("min_order_value"):
        title_parts.append(f"on ₹{fields['min_order_value']}+ orders")

    if title_parts:
        fields["title"] = " ".join(title_parts)

    return fields


# ---------------------------------------------------------------------------
# Main public function – verify + auto-parse
# ---------------------------------------------------------------------------

def verify_coupon_screenshot(
    image_bytes: bytes,
    claimed_brand: str = None,
    claimed_code: str = None,
) -> dict:
    raw_text = extract_text_from_image(image_bytes)
    cleaned_ocr_text = clean_string(raw_text)

    detected_brand = None
    brand_matched = False
    code_matched = False

    # Detect known brand in OCR text
    for b in KNOWN_BRANDS:
        if re.search(r"\b" + re.escape(b) + r"\b", raw_text, re.IGNORECASE) or clean_string(b) in cleaned_ocr_text:
            detected_brand = b
            break

    if claimed_brand:
        cleaned_claimed = clean_string(claimed_brand)
        if cleaned_claimed in cleaned_ocr_text or (detected_brand and clean_string(detected_brand) == cleaned_claimed):
            brand_matched = True
            if not detected_brand:
                detected_brand = claimed_brand
    elif detected_brand:
        brand_matched = True

    candidate_codes = extract_candidate_codes(raw_text)

    if claimed_code:
        if len(clean_string(claimed_code)) >= 3 and clean_string(claimed_code) in cleaned_ocr_text:
            code_matched = True
    elif candidate_codes:
        code_matched = True

    confidence = 0.0
    if brand_matched:
        confidence += 45.0
    if code_matched:
        confidence += 50.0
    if len(raw_text) > 20:
        confidence += 5.0

    is_verified = brand_matched and code_matched

    snippet = " ".join(raw_text.split()[:40])
    detected_brands = [detected_brand] if detected_brand else ([claimed_brand] if claimed_brand else [])

    # Structured autofill fields
    autofill = parse_coupon_fields(raw_text, detected_brand or claimed_brand)

    return {
        "is_verified": is_verified,
        "is_valid": is_verified,
        "brand_matched": brand_matched,
        "code_matched": code_matched,
        "detected_brand": detected_brand or claimed_brand,
        "detected_brands": detected_brands,
        "detected_codes": candidate_codes,
        "confidence": min(confidence, 100.0),
        "snippet": snippet,
        "autofill": autofill,           # ← NEW: structured field suggestions
        "raw_text": raw_text[:500],     # ← NEW: first 500 chars for debug panel
    }
