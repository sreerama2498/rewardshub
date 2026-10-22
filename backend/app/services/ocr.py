import io
import re
import base64
import json
from datetime import date, timedelta

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

def _clean_date(y, m, d):
    try:
        y, m, d = int(y), int(m), int(d)
        if y < 100:
            y += 2000
        return date(y, m, d).strftime("%Y-%m-%d")
    except Exception:
        return None


def _parse_expiry(text: str) -> str | None:
    """
    Robust, comprehensive date parser for coupon vouchers.
    Extracts dates in US, Indian, UK, ISO, relative, and delimiter formats.
    """
    if not text:
        return None

    today = date.today()
    current_year = today.year

    # 1. Relative validity: 'expires in 5 days', 'valid for 30 days', 'valid for 3 months'
    rel = re.search(r"(?i)(?:expires?|valid(?:ity)?)\s*(?:in|for)\s*(\d{1,3})\s*(days?|months?|weeks?)", text)
    if rel:
        qty, unit = int(rel.group(1)), rel.group(2).lower()
        if "day" in unit:
            return (today + timedelta(days=qty)).strftime("%Y-%m-%d")
        elif "week" in unit:
            return (today + timedelta(days=qty * 7)).strftime("%Y-%m-%d")
        elif "month" in unit:
            return (today + timedelta(days=qty * 30)).strftime("%Y-%m-%d")

    # 2. ISO format: 2026-12-31, 2026/12/31, 2026.12.31
    m_iso = re.search(r"\b(202[4-9]|203\d)[/\-\.](0?[1-9]|1[0-2])[/\-\.](0?[1-9]|[12]\d|3[01])\b", text)
    if m_iso:
        res = _clean_date(m_iso.group(1), m_iso.group(2), m_iso.group(3))
        if res:
            return res

    # 3. Day Month Year: '31 Dec 2026', '31st December 2026', '31-Oct-2026', '31.12.2026'
    m_dmy = re.search(r"\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[\s\-_]+([a-zA-Z]{3,9})[\s\-_,]+(202[4-9]|203\d|\d{2})\b", text)
    if m_dmy:
        mon_str = m_dmy.group(2).lower()[:3]
        mon = _MONTHS.get(mon_str) or _MONTHS.get(m_dmy.group(2).lower())
        if mon:
            res = _clean_date(m_dmy.group(3), mon, m_dmy.group(1))
            if res:
                return res

    # 4. Month Day Year: 'Dec 31, 2026', 'December 31st 2026', 'Oct 15, 2026'
    m_mdy = re.search(r"\b([a-zA-Z]{3,9})\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(202[4-9]|203\d|\d{2})\b", text)
    if m_mdy:
        mon_str = m_mdy.group(1).lower()[:3]
        mon = _MONTHS.get(mon_str) or _MONTHS.get(m_mdy.group(1).lower())
        if mon:
            res = _clean_date(m_mdy.group(3), mon, m_mdy.group(2))
            if res:
                return res

    # 5. Delimited numeric date: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    m_delim = re.search(r"\b(0?[1-9]|[12]\d|3[01])[/\-\.](0?[1-9]|1[0-2])[/\-\.](202[4-9]|203\d|\d{2})\b", text)
    if m_delim:
        d, mo, y = int(m_delim.group(1)), int(m_delim.group(2)), int(m_delim.group(3))
        res = _clean_date(y, mo, d)
        if res:
            return res

    # 6. Keyword-bound Day Month (no year): 'Expires 31 Dec', 'Valid till 31st Oct'
    m_dm = re.search(r"(?i)(?:expires?|expiry|exp|valid|till|through|until|upto|ends?|by|before)[\s\w:–\-,]*?\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[\s\-_]+([a-zA-Z]{3,9})\b", text)
    if m_dm:
        mon_str = m_dm.group(2).lower()[:3]
        mon = _MONTHS.get(mon_str)
        if mon:
            res = _clean_date(current_year, mon, m_dm.group(1))
            if res:
                d_obj = date.fromisoformat(res)
                if d_obj < today - timedelta(days=7):
                    res = _clean_date(current_year + 1, mon, m_dm.group(1))
                return res

    # 7. Keyword-bound Month Day (no year): 'Expires Dec 31', 'Valid till Oct 31st'
    m_md = re.search(r"(?i)(?:expires?|expiry|exp|valid|till|through|until|upto|ends?|by|before)[\s\w:–\-,]*?\b([a-zA-Z]{3,9})\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\b", text)
    if m_md:
        mon_str = m_md.group(1).lower()[:3]
        mon = _MONTHS.get(mon_str)
        if mon:
            res = _clean_date(current_year, mon, m_md.group(2))
            if res:
                d_obj = date.fromisoformat(res)
                if d_obj < today - timedelta(days=7):
                    res = _clean_date(current_year + 1, mon, m_md.group(2))
                return res

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

    # ---- 2. Security PIN & Gift Card Detection ----------------------------
    pin_match = re.search(r"(?i)(?:pin|secret\s*pin|cvv|card\s*pin|voucher\s*pin)[:\s]*([0-9]{4,8})", raw_text)
    if pin_match:
        fields["security_pin"] = pin_match.group(1).strip()
        fields["distribution_channel"] = "GIFT_CARD"
        fields["discount_type"] = "GIFT_CARD"

    # ---- 3. Discount mechanism -------------------------------------------
    pct_match = re.search(r"(\d{1,2})\s*%\s*(?:off|discount|cashback)?", raw_text, re.IGNORECASE)
    bogo_match = re.search(r"(?i)buy\s*[12]\s*get\s*[12]|bogo", raw_text)
    ship_match = re.search(r"(?i)free\s*(delivery|shipping)", raw_text)
    gift_match = re.search(r"(?i)free\s*(gift|trial|sample|item|product)", raw_text)
    flat_match = re.search(r"(?i)(?:flat|get|save|earn)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:off|cashback)?", raw_text)
    cashback_match = re.search(r"(?i)(?:cashback|cash\s*back|wallet\s*credit)\s*(?:of|up\s*to)?\s*(?:₹|rs\.?|inr)?\s*(\d+)", raw_text)
    sub_match = re.search(r"(?i)(\d+)\s*(?:months?|years?|days?)\s*(?:free|trial|subscription|premium)", raw_text)
    bill_match = re.search(r"(?i)(?:recharge|electricity|bill|fastag|dth|broadband|utility)", raw_text)

    if not fields.get("discount_type"):
        if bogo_match:
            fields["discount_type"] = "BOGO"
            fields["bogo_details"] = bogo_match.group(0).strip()
        elif ship_match:
            fields["discount_type"] = "FREE_SHIPPING"
        elif gift_match:
            fields["discount_type"] = "FREE_GIFT"
            fields["free_gift_details"] = gift_match.group(0).strip()
        elif sub_match:
            fields["discount_type"] = "SUBSCRIPTION_PASS"
            fields["subscription_period"] = sub_match.group(0).strip()
            fields["coupon_value"] = 299
        elif bill_match and (pct_match or flat_match):
            fields["discount_type"] = "RECHARGE_BILL"
            if flat_match:
                fields["coupon_value"] = int(flat_match.group(1))
        elif cashback_match:
            fields["discount_type"] = "CASHBACK"
            fields["cashback_amount"] = int(cashback_match.group(1))
            fields["coupon_value"] = int(cashback_match.group(1))
        elif pct_match:
            fields["discount_type"] = "PERCENTAGE"
            fields["discount_percent"] = int(pct_match.group(1))
        elif flat_match:
            fields["discount_type"] = "FLAT_AMOUNT"
            fields["coupon_value"] = int(flat_match.group(1))

    # ---- 4. Max discount cap / face value --------------------------------
    cap_match = re.search(
        r"(?i)(?:up\s*to|max(?:\s*discount)?|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+)",
        raw_text,
    )
    if cap_match:
        fields["max_discount_cap"] = int(cap_match.group(1))
        if not fields.get("coupon_value"):
            fields["coupon_value"] = int(cap_match.group(1))

    # ---- 5. Min order / spend -------------------------------------------
    min_match = re.search(
        r"(?i)(?:min(?:imum)?\s*(?:order|spend|purchase|cart)|orders?\s*(?:above|of|over|worth))\s*(?:₹|rs\.?|inr)?\s*(\d+)",
        raw_text,
    )
    if min_match:
        fields["min_order_value"] = int(min_match.group(1))

    # ---- 6. Expiry date ---------------------------------------------------
    expiry = _parse_expiry(raw_text)
    if expiry:
        fields["expiry_date"] = expiry

    # ---- 7. Brand / source app ------------------------------------------
    if detected_brand:
        fields["source_app"] = detected_brand

    # ---- 8. Category inference -------------------------------------------
    fields["category"] = _infer_category(raw_text, detected_brand)

    # ---- 9. Auto-compose title ------------------------------------------
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
    elif fields.get("discount_type") == "GIFT_CARD":
        title_parts.append(f"Gift Card ₹{fields.get('coupon_value', 500)}")
    elif fields.get("discount_type") == "CASHBACK":
        title_parts.append(f"₹{fields.get('cashback_amount', fields.get('coupon_value', 100))} Cashback")
    elif fields.get("discount_type") == "SUBSCRIPTION_PASS":
        title_parts.append(f"{fields.get('subscription_period', 'Premium')} Pass")
    elif fields.get("discount_type") == "RECHARGE_BILL":
        title_parts.append(f"Recharge Rebate ₹{fields.get('coupon_value', 50)}")

    if fields.get("min_order_value"):
        title_parts.append(f"on ₹{fields['min_order_value']}+ orders")

    if title_parts:
        fields["title"] = " ".join(title_parts)

    return fields


def to_base64_preview(image_bytes: bytes) -> str:
    """Generate lightweight web-ready base64 thumbnail for lightbox & proof storage."""
    if not image_bytes or Image is None:
        return ""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail((900, 900))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75, optimize=True)
        encoded = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"
    except Exception as e:
        print(f"[OCR] Error generating base64 preview: {e}")
        return ""


# ---------------------------------------------------------------------------
# Main public function – multi-screenshot verify + auto-parse
# ---------------------------------------------------------------------------

def verify_multiple_coupon_screenshots(
    images_bytes_list: list[bytes],
    claimed_brand: str = None,
    claimed_code: str = None,
) -> dict:
    if not images_bytes_list:
        return {
            "is_verified": False,
            "is_valid": False,
            "brand_matched": False,
            "code_matched": False,
            "detected_brand": claimed_brand,
            "detected_brands": [],
            "detected_codes": [],
            "confidence": 0.0,
            "snippet": "",
            "autofill": {},
            "raw_text": "",
            "image_previews": [],
            "ocr_proof_url": None
        }

    extracted_texts = []
    previews = []

    for b in images_bytes_list:
        txt = extract_text_from_image(b)
        extracted_texts.append(txt)
        preview_url = to_base64_preview(b)
        if preview_url:
            previews.append(preview_url)

    combined_text = "\n\n--- SCREENSHOT SPLIT ---\n\n".join(extracted_texts)
    cleaned_ocr_text = clean_string(combined_text)

    detected_brand = None
    brand_matched = False
    code_matched = False

    # Detect known brand across any of the screenshots
    for b in KNOWN_BRANDS:
        if re.search(r"\b" + re.escape(b) + r"\b", combined_text, re.IGNORECASE) or clean_string(b) in cleaned_ocr_text:
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

    candidate_codes = extract_candidate_codes(combined_text)

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
    if len(combined_text) > 20:
        confidence += 5.0

    is_verified = brand_matched and code_matched
    snippet = " ".join(combined_text.split()[:40])
    detected_brands = [detected_brand] if detected_brand else ([claimed_brand] if claimed_brand else [])

    # Structured autofill fields parsed across all uploaded screenshots
    autofill = parse_coupon_fields(combined_text, detected_brand or claimed_brand)

    # If expiry_date was missed in combined_text, check each screenshot individually
    if not autofill.get("expiry_date"):
        for t in extracted_texts:
            exp = _parse_expiry(t)
            if exp:
                autofill["expiry_date"] = exp
                break

    # Serialize previews: if 1 image, store data URL directly. If multiple, store as JSON array.
    serialized_proof = json.dumps(previews) if len(previews) > 1 else (previews[0] if previews else None)

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
        "autofill": autofill,
        "raw_text": combined_text[:1000],
        "image_previews": previews,
        "ocr_proof_url": serialized_proof
    }


def verify_coupon_screenshot(
    image_bytes: bytes,
    claimed_brand: str = None,
    claimed_code: str = None,
) -> dict:
    """Backward-compatible single screenshot verifier."""
    return verify_multiple_coupon_screenshots(
        images_bytes_list=[image_bytes],
        claimed_brand=claimed_brand,
        claimed_code=claimed_code
    )
