import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";

import { toast } from "react-toastify";

const MY_CATEGORIES = [
  { id: "FOOD", label: "Food & Dining", icon: "🍔" },
  { id: "FASHION", label: "Fashion & Shopping", icon: "🛍️" },
  { id: "TRAVEL", label: "Travel & Commute", icon: "✈️" },
  { id: "ENTERTAINMENT", label: "OTT & Entertainment", icon: "🎬" },
  { id: "HEALTH", label: "Health & Wellness", icon: "💊" },
  { id: "EDTECH", label: "EdTech & Courses", icon: "🎓" },
  { id: "GAMING", label: "Gaming & Digital", icon: "🎮" },
  { id: "OTHER", label: "Other Offers", icon: "🏷️" }
];

const DISCOUNT_TYPES = [
  { id: "FLAT_AMOUNT", label: "Fixed Amount-Off", icon: "💵", example: "e.g. ₹100 Off on ₹500 spend" },
  { id: "PERCENTAGE", label: "Percentage-Off", icon: "🏷️", example: "e.g. 20% Off up to ₹150" },
  { id: "BOGO", label: "Buy-One-Get-One (BOGO)", icon: "🎁", example: "e.g. Buy 1 Get 1 Free on Pizzas" },
  { id: "FREE_SHIPPING", label: "Free Shipping", icon: "🚚", example: "e.g. Free Delivery on orders ₹199+" },
  { id: "FREE_GIFT", label: "Free Gift / Trial", icon: "✨", example: "e.g. 3-Month OTT Trial / Bonus item" },
  { id: "TIERED", label: "Tiered / Threshold", icon: "📊", example: "e.g. ₹50 off ₹250, ₹150 off ₹750" }
];

const CHANNELS = [
  { id: "DIGITAL", label: "Online Promo Code", icon: "💻", tip: "Alphanumeric code entered at checkout" },
  { id: "DIRECT_LINK", label: "Google Pay / Direct Link", icon: "🔗", tip: "App redirect / affiliate URL with offer applied" },
  { id: "IN_STORE", label: "In-Store Barcode / QR", icon: "📱", tip: "Scanned by cashier counter at checkout" },
  { id: "GIFT_CARD", label: "Gift Card + Secret PIN", icon: "🔐", tip: "Requires both voucher number and secret PIN" }
];

const TARGET_AUDIENCES = [
  { id: "ALL_USERS", label: "All Customers" },
  { id: "NEW_USERS", label: "First-Time Buyers Only" },
  { id: "LOYALTY", label: "Loyalty / VIP Members" },
  { id: "SEASONAL", label: "Seasonal / Festive Sale" },
  { id: "REFERRAL", label: "Referral Bonus Code" }
];

const USAGE_STRUCTURES = [
  { id: "SINGLE_USE", label: "Single-Use (Unique Code)" },
  { id: "MULTI_USE", label: "Multi-Use (Reusable)" },
  { id: "STACKABLE", label: "Stackable with other offers" }
];

export default function MyCoupons() {

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceApp, setSourceApp] = useState("");
  const [category, setCategory] = useState("OTHER");

  // Dynamic Discount Mechanism Fields
  const [discountType, setDiscountType] = useState("FLAT_AMOUNT");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [bogoDetails, setBogoDetails] = useState("");
  const [freeGiftDetails, setFreeGiftDetails] = useState("");

  // Dynamic Distribution Channel Fields
  const [distributionChannel, setDistributionChannel] = useState("DIGITAL");
  const [couponCode, setCouponCode] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [redemptionUrl, setRedemptionUrl] = useState("");

  // Targeting & Structure
  const [targetAudience, setTargetAudience] = useState("ALL_USERS");
  const [usageStructure, setUsageStructure] = useState("SINGLE_USE");
  const [termsNote, setTermsNote] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [receiverEmails, setReceiverEmails] = useState({});
  const [isOcrVerified, setIsOcrVerified] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFeedback, setOcrFeedback] = useState(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState(null);   // image preview URL
  const [ocrAutofill, setOcrAutofill] = useState(null);       // parsed autofill fields
  const [disputeModalCoupon, setDisputeModalCoupon] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showPin, setShowPin] = useState({});
  const [qrModalCoupon, setQrModalCoupon] = useState(null);

  const togglePin = (couponId) => {
    setShowPin(prev => ({ ...prev, [couponId]: !prev[couponId] }));
  };

  const loadCoupons = async () => {

    try {

      const response = await api.get("/my-coupons");
      setCoupons(response.data);

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Coupons"
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadCoupons();

  }, []);

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview immediately
    const previewUrl = URL.createObjectURL(file);
    setOcrPreviewUrl(previewUrl);

    const formData = new FormData();
    formData.append("file", file);
    if (sourceApp) formData.append("brand", sourceApp);
    if (couponCode) formData.append("coupon_code", couponCode);

    setOcrLoading(true);
    setOcrFeedback(null);
    setOcrAutofill(null);

    try {
      const response = await api.post("/coupons/verify-ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = response.data;
      setOcrFeedback(data);

      const af = data.autofill || {};
      const isVerified = Boolean(data.is_verified || data.is_valid);

      // Always store autofill suggestions so user can review them
      if (Object.keys(af).length > 0) {
        setOcrAutofill(af);
      }

      if (isVerified) {
        setIsOcrVerified(true);
        toast.success("✅ Screenshot verified! Review auto-filled fields below.");
      } else {
        setIsOcrVerified(false);
        const reason = !data.brand_matched
          ? "Brand could not be identified."
          : !data.code_matched
          ? "Coupon code not detected clearly."
          : "Could not fully verify screenshot.";
        toast.warning(`⚠️ Partial scan: ${reason} Fields extracted where possible.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "OCR scan failed. Please try a clearer screenshot.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Apply autofill suggestions to form fields
  const applyAutofill = (af) => {
    if (!af) return;
    if (af.title)              setTitle(af.title);
    if (af.source_app)         setSourceApp(af.source_app);
    if (af.category)           setCategory(af.category);
    if (af.coupon_code)        setCouponCode(af.coupon_code);
    if (af.discount_type)      setDiscountType(af.discount_type);
    if (af.discount_percent)   setDiscountPercent(String(af.discount_percent));
    if (af.max_discount_cap)   setMaxDiscountCap(String(af.max_discount_cap));
    if (af.min_order_value)    setMinOrderValue(String(af.min_order_value));
    if (af.coupon_value)       setCouponValue(String(af.coupon_value));
    if (af.expiry_date)        setExpiryDate(af.expiry_date);
    if (af.bogo_details)       setBogoDetails(af.bogo_details);
    if (af.free_gift_details)  setFreeGiftDetails(af.free_gift_details);
    toast.success("✨ Form auto-filled from screenshot! Review & adjust if needed.");
    setOcrAutofill(null); // dismiss the autofill panel after applying
  };

  const confirmRedeem = async (couponId) => {
    if (!window.confirm("Did the coupon work successfully? This will release the escrow payout to the seller.")) return;
    try {
      const response = await api.post(`/coupons/${couponId}/confirm-redeem`);
      toast.success(response.data.message || "Coupon confirmed! Payout released to seller.");
      loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to confirm redemption");
    }
  };

  const submitDispute = async () => {
    if (!disputeModalCoupon) return;
    try {
      const response = await api.post(`/coupons/${disputeModalCoupon.id}/dispute-refund`, {
        reason: disputeReason || "Coupon code did not work / was invalid"
      });
      toast.success(response.data.message || "100% refund processed to your wallet!");
      setDisputeModalCoupon(null);
      setDisputeReason("");
      loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to process dispute refund");
    }
  };

  const createCoupon = async () => {

    try {

      // Auto-compute reasonable coupon_value if left blank
      let computedValue = parseInt(couponValue, 10);
      if (!computedValue || computedValue <= 0) {
        if (discountType === "PERCENTAGE") computedValue = parseInt(maxDiscountCap, 10) || 100;
        else if (discountType === "FREE_SHIPPING") computedValue = 50;
        else if (discountType === "BOGO") computedValue = 250;
        else if (discountType === "FREE_GIFT") computedValue = 299;
        else computedValue = 100;
      }

      await api.post(
        "/coupons",
        {
          title,
          description,
          source_app: sourceApp,
          category,
          discount_type: discountType,
          discount_percent: parseInt(discountPercent, 10) || 0,
          max_discount_cap: parseInt(maxDiscountCap, 10) || 0,
          min_order_value: parseInt(minOrderValue, 10) || 0,
          bogo_details: bogoDetails || null,
          free_gift_details: freeGiftDetails || null,
          distribution_channel: distributionChannel,
          target_audience: targetAudience,
          usage_structure: usageStructure,
          coupon_code: couponCode || null,
          security_pin: securityPin || null,
          terms_note: termsNote || null,
          redemption_url: redemptionUrl || null,
          coupon_value: computedValue,
          expiry_date: expiryDate || null,
          is_ocr_verified: isOcrVerified
        }
      );

      toast.success(
        "Coupon Created & Published to Marketplace!"
      );

      setTitle("");
      setDescription("");
      setSourceApp("");
      setCategory("OTHER");
      setDiscountType("FLAT_AMOUNT");
      setDiscountPercent("");
      setMaxDiscountCap("");
      setMinOrderValue("");
      setBogoDetails("");
      setFreeGiftDetails("");
      setDistributionChannel("DIGITAL");
      setTargetAudience("ALL_USERS");
      setUsageStructure("SINGLE_USE");
      setCouponCode("");
      setSecurityPin("");
      setTermsNote("");
      setRedemptionUrl("");
      setCouponValue("");
      setExpiryDate("");
      setIsOcrVerified(false);
      setOcrFeedback(null);

      loadCoupons();

    } catch (error) {

      console.log(error);

      toast.error(
        error?.response?.data?.detail || "Failed To Create Coupon"
      );

    }

  };

  const shareCoupon = async (
    couponId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.post(
          "/share-coupon",
          {
            coupon_id: couponId,
            receiver_email:
              receiverEmails[couponId]
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      toast.success(
        response.data.message
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Share Coupon"
      );

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  const filteredCoupons =
    coupons.filter((coupon) => {

      const searchMatch =

        coupon.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )

        ||

        coupon.coupon_code
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const sourceMatch =

        sourceFilter === ""

        ||

        coupon.source_app ===
        sourceFilter;

      return (
        searchMatch &&
        sourceMatch
      );

    });

  const uniqueSources = [

    ...new Set(

      coupons.map(
        (c) => c.source_app
      )

    )

  ];

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        My Coupons
      </h1>

      <hr />

      <div className="card p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: "#f1f5f9" }}>
          <div>
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "19px" }}>
              Add New Coupon 🎟️
            </h4>
            <p className="text-muted small mb-0">
              Store your vouchers or prepare them for sharing with friends
            </p>
          </div>
          {(title || sourceApp) && (
            <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill">
              <span className="text-muted small">Brand detected:</span>
              <CouponLogo title={title} sourceApp={sourceApp} description={description} size={32} />
            </div>
          )}
        </div>

        {/* ─── Screenshot Scan Banner ───────────────────────────────────────── */}
        <div
          className="mb-4 p-3 rounded-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3"
          style={{ background: "linear-gradient(135deg,#f0f7ff 0%,#eef2ff 100%)", border: "1px dashed #93c5fd" }}
        >
          <div className="flex-grow-1">
            <p className="fw-semibold mb-1" style={{ color: "#1e40af" }}>
              📸 Scan Coupon Screenshot
            </p>
            <p className="text-muted small mb-0">
              Upload a screenshot of any coupon/offer and we'll auto-fill the form for you.
            </p>
          </div>

          <label
            className="btn btn-sm px-3 fw-semibold text-nowrap"
            style={{ background: "#3b82f6", color: "#fff", borderRadius: "10px", cursor: "pointer" }}
          >
            {ocrLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />&nbsp;Scanning…</>
            ) : (
              <>📷 &nbsp;Upload Screenshot</>
            )}
            <input
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleOcrUpload}
            />
          </label>
        </div>

        {/* ─── Screenshot Preview + Autofill Panel ─────────────────────────── */}
        {(ocrPreviewUrl || ocrAutofill) && (
          <div
            className="mb-4 p-3 rounded-3"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="row g-3 align-items-start">
              {ocrPreviewUrl && (
                <div className="col-auto">
                  <img
                    src={ocrPreviewUrl}
                    alt="Uploaded coupon screenshot"
                    className="rounded-2 shadow-sm"
                    style={{ maxHeight: "160px", maxWidth: "220px", objectFit: "contain", border: "1px solid #e2e8f0" }}
                  />
                </div>
              )}

              {ocrAutofill && (
                <div className="col">
                  <p className="fw-semibold mb-2" style={{ color: "#0f766e" }}>
                    ✨ Detected Fields — Click "Apply" to fill the form
                  </p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {ocrAutofill.title && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#ecfdf5", color: "#065f46", fontSize: "12px" }}>
                        📌 Title: {ocrAutofill.title}
                      </span>
                    )}
                    {ocrAutofill.source_app && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#eff6ff", color: "#1e40af", fontSize: "12px" }}>
                        🏷️ Brand: {ocrAutofill.source_app}
                      </span>
                    )}
                    {ocrAutofill.coupon_code && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#fef9c3", color: "#713f12", fontSize: "12px" }}>
                        🎫 Code: {ocrAutofill.coupon_code}
                      </span>
                    )}
                    {ocrAutofill.discount_type && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#fdf4ff", color: "#6b21a8", fontSize: "12px" }}>
                        💰 Type: {ocrAutofill.discount_type}
                      </span>
                    )}
                    {ocrAutofill.discount_percent && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#fff7ed", color: "#9a3412", fontSize: "12px" }}>
                        % {ocrAutofill.discount_percent}% Off
                      </span>
                    )}
                    {ocrAutofill.max_discount_cap && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#ecfdf5", color: "#065f46", fontSize: "12px" }}>
                        🔝 Max Cap: ₹{ocrAutofill.max_discount_cap}
                      </span>
                    )}
                    {ocrAutofill.min_order_value && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#f0fdf4", color: "#14532d", fontSize: "12px" }}>
                        🛒 Min Order: ₹{ocrAutofill.min_order_value}
                      </span>
                    )}
                    {ocrAutofill.expiry_date && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#fff1f2", color: "#9f1239", fontSize: "12px" }}>
                        📅 Expires: {ocrAutofill.expiry_date}
                      </span>
                    )}
                    {ocrAutofill.category && (
                      <span className="badge rounded-pill px-3 py-2" style={{ background: "#f5f3ff", color: "#4c1d95", fontSize: "12px" }}>
                        📂 {ocrAutofill.category}
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm fw-semibold px-4"
                      style={{ background: "#0f766e", color: "#fff", borderRadius: "8px" }}
                      onClick={() => applyAutofill(ocrAutofill)}
                    >
                      ✅ Apply Auto-Fill
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary fw-semibold px-3"
                      style={{ borderRadius: "8px" }}
                      onClick={() => { setOcrAutofill(null); setOcrPreviewUrl(null); }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {!ocrAutofill && ocrPreviewUrl && !ocrLoading && (
                <div className="col d-flex align-items-center">
                  <p className="text-muted small mb-0">
                    {ocrFeedback?.is_verified
                      ? "✅ Verified — no additional auto-fill data found."
                      : "⚠️ Screenshot processed but few fields could be extracted. Try a clearer image."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: Basic Information */}

        <div className="row g-3 mb-2">
          <div className="col-12 col-md-5">
            <label className="form-label fw-semibold small text-secondary">Coupon Title *</label>
            <input
              className="form-control"
              placeholder="e.g. Flat 50% Off / Amazon ₹500 Card / Swiggy BOGO"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Source Brand / App *</label>
            <input
              className="form-control"
              placeholder="e.g. Swiggy, Amazon, GooglePay, Myntra, Uber..."
              value={sourceApp}
              onChange={(e) => setSourceApp(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label fw-semibold small text-secondary">Industry Category *</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {MY_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small text-secondary">Short Description</label>
            <input
              className="form-control"
              placeholder="Brief description or highlights of offer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 2: Discount Mechanism (Dynamic Fields) */}
        <div className="p-3 mb-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div>
              <span className="fw-bold text-dark d-block" style={{ fontSize: "14px" }}>
                1. Select Discount Mechanism 🏷️
              </span>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Fields below automatically adapt to your chosen coupon type
              </span>
            </div>
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill small">
              Dynamic Form Engine
            </span>
          </div>

          {/* Discount Type Selector Buttons */}
          <div className="row g-2 mb-3">
            {DISCOUNT_TYPES.map(t => {
              const active = discountType === t.id;
              return (
                <div className="col-6 col-md-4 col-lg-2" key={t.id}>
                  <button
                    type="button"
                    className={`btn w-100 p-2 text-start rounded-3 h-100 transition-all ${
                      active ? "btn-primary shadow-sm" : "btn-outline-secondary bg-white text-dark border"
                    }`}
                    onClick={() => {
                      setDiscountType(t.id);
                      if (t.id === "FREE_SHIPPING" && !couponValue) setCouponValue("50");
                      if (t.id === "BOGO" && !couponValue) setCouponValue("250");
                      if (t.id === "FREE_GIFT" && !couponValue) setCouponValue("300");
                    }}
                  >
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <span className="fs-5">{t.icon}</span>
                      <strong style={{ fontSize: "12px" }}>{t.label}</strong>
                    </div>
                    <div className="small opacity-75" style={{ fontSize: "10px", lineHeight: "1.2" }}>
                      {t.example}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC FIELDS: PERCENTAGE */}
          {discountType === "PERCENTAGE" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Discount Percentage (%) *</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 20"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                  <span className="input-group-text bg-light">% OFF</span>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Maximum Discount Cap (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 150 (Leave blank if no cap)"
                  value={maxDiscountCap}
                  onChange={(e) => {
                    setMaxDiscountCap(e.target.value);
                    if (e.target.value && !couponValue) setCouponValue(e.target.value);
                  }}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Minimum Cart Spend (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 499 (0 for no min spend)"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FLAT AMOUNT */}
          {discountType === "FLAT_AMOUNT" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Flat Discount Amount (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                  />
                </div>
                <span className="text-muted small" style={{ fontSize: "11px" }}>Amount directly deducted from the bill</span>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Minimum Order Value (₹)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 499 (e.g. $10 off $50 purchase)"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: BOGO */}
          {discountType === "BOGO" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold small text-dark">BOGO Offer Details *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Buy 1 Large Pizza, Get 1 Medium Free / Buy 1 Movie Ticket, Get 1 Free"
                  value={bogoDetails}
                  onChange={(e) => setBogoDetails(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Estimated Free Item Value (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 250"
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FREE SHIPPING */}
          {discountType === "FREE_SHIPPING" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Minimum Spend for Free Delivery (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 199 (0 for any order)"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Estimated Shipping Savings (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 50"
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FREE GIFT / TRIAL */}
          {discountType === "FREE_GIFT" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold small text-dark">Free Gift / Subscription Details *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Free 3-Month Spotify Premium / Free Travel Shaving Kit"
                  value={freeGiftDetails}
                  onChange={(e) => setFreeGiftDetails(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Estimated Gift / Trial Value (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 299"
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: TIERED */}
          {discountType === "TIERED" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold small text-dark">Tiered Spend & Discount Details *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Save ₹50 on ₹250, Save ₹150 on ₹750, Save ₹300 on ₹1500"
                  value={termsNote}
                  onChange={(e) => setTermsNote(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Max Potential Savings (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 300"
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Distribution & Redemption Channel (Dynamic Fields) */}
        <div className="p-3 mb-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div>
              <span className="fw-bold text-dark d-block" style={{ fontSize: "14px" }}>
                2. Select Distribution / Redemption Channel 🌐
              </span>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                How the buyer will actually redeem this voucher
              </span>
            </div>
          </div>

          {/* Channel Selector Pills */}
          <div className="row g-2 mb-3">
            {CHANNELS.map(ch => {
              const active = distributionChannel === ch.id;
              return (
                <div className="col-6 col-md-3" key={ch.id}>
                  <button
                    type="button"
                    className={`btn w-100 p-2 text-start rounded-3 h-100 transition-all ${
                      active ? "btn-dark shadow-sm text-white" : "btn-outline-secondary bg-white text-dark border"
                    }`}
                    onClick={() => setDistributionChannel(ch.id)}
                  >
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <span className="fs-5">{ch.icon}</span>
                      <strong style={{ fontSize: "12px" }}>{ch.label}</strong>
                    </div>
                    <div className="small opacity-75" style={{ fontSize: "10px", lineHeight: "1.2" }}>
                      {ch.tip}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC CHANNEL INPUTS */}
          <div className="p-3 bg-white rounded-3 border">
            {distributionChannel === "DIGITAL" && (
              <div>
                <label className="form-label fw-semibold small text-dark">Coupon / Promo Code *</label>
                <input
                  className="form-control font-monospace"
                  placeholder="e.g. FLAT50, SWIGGYIT, SAVE200"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <span className="text-muted small" style={{ fontSize: "11px" }}>Customer copies and applies this text code in the website/app checkout</span>
              </div>
            )}

            {distributionChannel === "DIRECT_LINK" && (
              <div className="row g-2">
                <div className="col-12 col-md-8">
                  <label className="form-label fw-semibold small text-dark">
                    🔗 Direct Redemption Link / Website *
                    <span className="badge bg-primary bg-opacity-10 text-primary ms-2" style={{ fontSize: "10px" }}>Google Pay / Affiliate</span>
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://brand.com/redeem?offer=... (Paste Google Pay or app redirect link here)"
                    value={redemptionUrl}
                    onChange={(e) => setRedemptionUrl(e.target.value)}
                  />
                  <span className="text-muted small" style={{ fontSize: "11px" }}>One-click redirect button unlocks offer directly</span>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-dark">Accompanying Code <span className="text-muted fw-normal">(Optional)</span></label>
                  <input
                    className="form-control font-monospace"
                    placeholder="Leave blank if none"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
              </div>
            )}

            {distributionChannel === "IN_STORE" && (
              <div>
                <label className="form-label fw-semibold small text-dark">In-Store Barcode / POS Code *</label>
                <input
                  className="form-control font-monospace"
                  placeholder="e.g. 890123456789 or STORE-9921"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <span className="text-muted small" style={{ fontSize: "11px" }}>
                  📱 RewardsHub will automatically generate a high-contrast POS scannable Barcode & QR Code for the customer screen!
                </span>
              </div>
            )}

            {distributionChannel === "GIFT_CARD" && (
              <div className="row g-2">
                <div className="col-12 col-md-7">
                  <label className="form-label fw-semibold small text-dark">Gift Card / Voucher Number *</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="e.g. 6014-8821-9920-4123"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold small text-dark">
                    🔐 Secret Security PIN *
                    <span className="badge bg-warning bg-opacity-25 text-dark ms-2" style={{ fontSize: "10px" }}>Escrow Protected</span>
                  </label>
                  <input
                    className="form-control font-monospace"
                    placeholder="e.g. 4921 or 6-digit PIN"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                  />
                  <span className="text-muted small" style={{ fontSize: "11px" }}>Hidden on marketplace until buyer completes escrow payment</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Eligibility & Redemption Structure */}
        <div className="row g-3 mb-2">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Target Eligibility</label>
            <select
              className="form-select"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              {TARGET_AUDIENCES.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Redemption Structure</label>
            <select
              className="form-select"
              value={usageStructure}
              onChange={(e) => setUsageStructure(e.target.value)}
            >
              {USAGE_STRUCTURES.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Expiry Date</label>
            <input
              type="date"
              className="form-control"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-secondary">
              Terms & Conditions / Min Order <span className="text-muted fw-normal">(Optional)</span>
            </label>
            <input
              className="form-control"
              placeholder="e.g. Valid on Weekends only, App only, Not on beverages"
              value={termsNote}
              onChange={(e) => setTermsNote(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-secondary">Face Value of Voucher (₹) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 100"
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
            />
            <span className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
              🛒 <strong>Marketplace Price (25%):</strong> ₹{Math.round((parseInt(couponValue, 10) || 0) * 0.25)} • <strong>You Earn (20%):</strong> ₹{Math.round((parseInt(couponValue, 10) || 0) * 0.20)}
            </span>
          </div>

          {/* OCR Screenshot Proof Upload */}
          <div className="col-12">
            <div className="p-3 rounded-3" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span className="fw-semibold small text-dark d-block">
                    📸 Upload Reward Screenshot (Automated OCR Verification)
                  </span>
                  <span className="text-muted small" style={{ fontSize: "12px" }}>
                    Upload your reward screenshot to prove authenticity. Our OCR AI verifies genuine reward codes & detects brands.
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="file"
                    id="ocrFileInput"
                    className="d-none"
                    accept="image/*"
                    onChange={handleOcrUpload}
                  />
                  <label
                    htmlFor="ocrFileInput"
                    className={`btn btn-sm ${ocrLoading ? "btn-secondary disabled" : "btn-outline-primary"}`}
                    style={{ cursor: "pointer" }}
                  >
                    {ocrLoading ? "Scanning Screenshot..." : "📁 Upload & Verify Screenshot"}
                  </label>
                </div>
              </div>
              {isOcrVerified && (
                <div className="mt-2 text-success small fw-semibold d-flex align-items-center gap-2 flex-wrap">
                  <span>🛡️ Proof of Reward Verified by OCR!</span>
                  {ocrFeedback?.detected_brands?.length > 0 && (
                    <span className="badge bg-success bg-opacity-25 text-success">
                      Brand: {ocrFeedback.detected_brands.join(", ")}
                    </span>
                  )}
                  {ocrFeedback?.detected_codes?.length > 0 && (
                    <span className="badge bg-dark">
                      Code: {ocrFeedback.detected_codes[0]}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 text-end pt-2">
            <button
              className="btn btn-primary px-4 py-2"
              onClick={createCoupon}
            >
              + Create Coupon
            </button>
          </div>
        </div>
      </div>

      <div className="card p-3 mb-4 border-0 shadow-sm" style={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                className="form-control border-start-0"
                placeholder="Search coupons by title or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">All Brands & Apps</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: "22px" }}>
          Available Coupons ({filteredCoupons.length})
        </h3>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <div style={{ fontSize: "40px" }} className="mb-2">🎟️</div>
          <h5 className="fw-semibold text-dark">No coupons found</h5>
          <p className="text-muted small">Try adjusting your search or add a new coupon above.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredCoupons.map((coupon) => {
            const expired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();

            return (
              <div key={coupon.id} className="col-12 col-md-6 col-lg-4">
                <div className={`card h-100 card-coupon shadow-sm ${expired ? "border-danger opacity-75" : ""}`}>
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Top Row: Logo & Status Badge */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <CouponLogo
                          title={coupon.title}
                          sourceApp={coupon.source_app}
                          description={coupon.description}
                          size={46}
                        />
                        <div className="d-flex flex-column align-items-end gap-1">
                          {expired ? (
                            <span className="badge-soft badge-soft-danger">Expired</span>
                          ) : (
                            <span className="badge-soft badge-soft-success">
                              {coupon.status || "AVAILABLE"}
                            </span>
                          )}
                          <span className="text-muted small" style={{ fontSize: "11px" }}>
                            {coupon.source_app}
                          </span>
                          {coupon.category && coupon.category !== "OTHER" && (
                            <span className="badge bg-light text-dark border px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              {MY_CATEGORIES.find(c => c.id === coupon.category)?.icon || "🏷️"} {MY_CATEGORIES.find(c => c.id === coupon.category)?.label || coupon.category}
                            </span>
                          )}
                          {coupon.discount_type === "PERCENTAGE" && coupon.discount_percent > 0 && (
                            <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🏷️ {coupon.discount_percent}% OFF {coupon.max_discount_cap ? `(Max ₹${coupon.max_discount_cap})` : ""}
                            </span>
                          )}
                          {coupon.discount_type === "BOGO" && (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🎁 BOGO Offer
                            </span>
                          )}
                          {coupon.discount_type === "FREE_SHIPPING" && (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🚚 Free Shipping
                            </span>
                          )}
                          {coupon.discount_type === "FREE_GIFT" && (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              ✨ Free Gift / Trial
                            </span>
                          )}
                          {coupon.target_audience === "NEW_USERS" && (
                            <span className="badge bg-secondary bg-opacity-10 text-dark border px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              👤 New Users
                            </span>
                          )}
                          {coupon.usage_structure === "STACKABLE" && (
                            <span className="badge bg-success bg-opacity-10 text-success border px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              ⚡ Stackable
                            </span>
                          )}
                          {coupon.is_ocr_verified && (
                            <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🛡️ OCR Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "17px", lineHeight: "1.3" }}>
                        {coupon.title}
                      </h5>
                      {coupon.description && (
                        <p className="text-muted small mb-2" style={{ fontSize: "13px" }}>
                          {coupon.description}
                        </p>
                      )}

                      {/* BOGO or Gift Details Highlight */}
                      {coupon.bogo_details && (
                        <div className="p-2 mb-2 rounded-2" style={{ background: "#fef2f2", border: "1px solid #fecaca", fontSize: "12px", color: "#991b1b" }}>
                          <strong>🎁 BOGO Offer:</strong> {coupon.bogo_details}
                        </div>
                      )}
                      {coupon.free_gift_details && (
                        <div className="p-2 mb-2 rounded-2" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "12px", color: "#166534" }}>
                          <strong>✨ Free Bonus:</strong> {coupon.free_gift_details}
                        </div>
                      )}

                      {/* Terms Note */}
                      {coupon.terms_note && (
                        <div className="p-2 mb-3 rounded-2 text-dark" style={{ background: "#fefce8", border: "1px solid #fef08a", fontSize: "11px" }}>
                          <strong>ℹ️ Terms:</strong> {coupon.terms_note}
                        </div>
                      )}

                      {/* Value & Code Box */}
                      <div className="coupon-ticket-notch mb-3 d-flex align-items-center justify-content-between">
                        <div>
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Coupon Code</span>
                          {coupon.coupon_code && coupon.coupon_code !== "REDEEM_VIA_LINK" ? (
                            <code className="fw-bold text-dark fs-6 bg-transparent p-0">{coupon.coupon_code}</code>
                          ) : (
                            <span className="badge bg-primary bg-opacity-15 text-primary small">Direct Link Voucher</span>
                          )}
                        </div>
                        <div className="text-end">
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Value</span>
                          <span className="fw-bold text-success fs-5">₹{coupon.coupon_value || 0}</span>
                        </div>
                      </div>

                      {/* Security PIN Display (if gift card) */}
                      {coupon.security_pin && (
                        <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <div>
                            <span className="text-muted small d-block" style={{ fontSize: "10px", textTransform: "uppercase" }}>🔐 Secret PIN</span>
                            <code className="fw-bold text-dark fs-6 bg-transparent p-0">
                              {showPin[coupon.id] ? coupon.security_pin : "••••"}
                            </code>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            style={{ fontSize: "11px" }}
                            onClick={() => togglePin(coupon.id)}
                          >
                            {showPin[coupon.id] ? "Hide" : "Reveal PIN"}
                          </button>
                        </div>
                      )}

                      {/* Direct Redemption Link Button */}
                      {coupon.redemption_url && (
                        <div className="mb-2">
                          <a
                            href={coupon.redemption_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
                            style={{ borderRadius: "8px" }}
                          >
                            <span>🌐 Open & Redeem on {coupon.source_app || "Website"}</span>
                            <span style={{ fontSize: "13px" }}>↗</span>
                          </a>
                        </div>
                      )}

                      {/* In-Store Barcode / QR Button */}
                      {coupon.coupon_code && coupon.coupon_code !== "REDEEM_VIA_LINK" && (
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm w-100 mb-3 d-flex align-items-center justify-content-center gap-2 py-1"
                          style={{ fontSize: "12px", borderRadius: "8px" }}
                          onClick={() => setQrModalCoupon(coupon)}
                        >
                          <span>📱 Show In-Store Barcode / QR</span>
                        </button>
                      )}

                      {/* Escrow Status & Action Section */}
                      {coupon.escrow_status === "IN_ESCROW" && (
                        <div className="p-3 mb-3 rounded-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                          <div className="d-flex align-items-center gap-1 mb-1 text-success fw-bold small">
                            <span>🔒 Buyer Escrow Protection Active</span>
                          </div>
                          <p className="text-secondary mb-2" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                            Your payment is held in escrow. Test this code on {coupon.source_app || "the merchant site"}. If it works, confirm to release payout to seller. If invalid, report for an instant 100% refund.
                          </p>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm flex-grow-1 py-1 fw-semibold"
                              style={{ fontSize: "12px" }}
                              onClick={() => confirmRedeem(coupon.id)}
                            >
                              ✅ Verify & Redeem
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm flex-grow-1 py-1 fw-semibold"
                              style={{ fontSize: "12px" }}
                              onClick={() => setDisputeModalCoupon(coupon)}
                            >
                              ❌ Report Issue
                            </button>
                          </div>
                        </div>
                      )}

                      {coupon.escrow_status === "COMPLETED" && (
                        <div className="p-2 mb-2 rounded-2 text-center" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: "12px" }}>
                          <span className="text-success fw-semibold">✅ Verified & Redeemed (Payout Released)</span>
                        </div>
                      )}

                      {coupon.escrow_status === "REFUNDED" && (
                        <div className="p-2 mb-2 rounded-2 text-center" style={{ background: "#fef2f2", border: "1px solid #fecaca", fontSize: "12px" }}>
                          <span className="text-danger fw-semibold">❌ Disputed & Refunded (100% Returned)</span>
                        </div>
                      )}

                      {/* Expiry */}
                      {coupon.expiry_date && (
                        <div className="text-muted small mb-3" style={{ fontSize: "12px" }}>
                          📅 Expires: <strong>{coupon.expiry_date}</strong>
                        </div>
                      )}
                    </div>

                    {/* Share Action */}
                    <div className="pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
                      <div className="input-group input-group-sm">
                        <input
                          className="form-control"
                          placeholder="Friend's email to share"
                          value={receiverEmails[coupon.id] || ""}
                          onChange={(e) =>
                            setReceiverEmails(prev => ({ ...prev, [coupon.id]: e.target.value }))
                          }
                        />
                        <button
                          className="btn btn-primary btn-sm px-3"
                          onClick={() => shareCoupon(coupon.id)}
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute / Refund Modal */}
      {disputeModalCoupon && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 py-3">
                <h5 className="modal-title fw-bold">⚠️ Report Issue & Request 100% Refund</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDisputeModalCoupon(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  If this coupon code was invalid, expired, or rejected at checkout, submit this dispute. Your payment will be <strong>instantly refunded 100%</strong> to your wallet balance.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark">Coupon Details</label>
                  <div className="p-2 rounded bg-light border text-secondary small">
                    <strong>{disputeModalCoupon.title}</strong> — <code>{disputeModalCoupon.coupon_code}</code>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark">Reason for Dispute *</label>
                  <select
                    className="form-select mb-2"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Code was marked invalid / not recognized">Code was marked invalid / not recognized</option>
                    <option value="Code was already redeemed / used by someone else">Code was already redeemed / used by someone else</option>
                    <option value="Terms or minimum spend did not match description">Terms or minimum spend did not match description</option>
                    <option value="Coupon expired prior to stated date">Coupon expired prior to stated date</option>
                    <option value="Other issue with redemption">Other issue with redemption</option>
                  </select>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Additional details (optional)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 p-3 bg-light">
                <button
                  type="button"
                  className="btn btn-secondary px-3"
                  onClick={() => setDisputeModalCoupon(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={submitDispute}
                >
                  Submit Dispute & Get 100% Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Store QR / Barcode Scanner Modal */}
      {qrModalCoupon && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div className="modal-header bg-dark text-white border-0 py-3">
                <h5 className="modal-title fw-bold fs-6">📱 In-Store Counter Voucher</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setQrModalCoupon(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="mb-2">
                  <span className="badge bg-primary px-3 py-1 rounded-pill">{qrModalCoupon.source_app}</span>
                </div>
                <h5 className="fw-bold text-dark mb-1">{qrModalCoupon.title}</h5>
                <p className="text-muted small mb-3">Present this QR code to the cashier to scan at checkout</p>

                {/* Scannable QR Code */}
                <div className="p-3 bg-white d-inline-block rounded-3 border mb-3 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrModalCoupon.coupon_code)}`}
                    alt="Voucher QR Code"
                    style={{ width: "180px", height: "180px" }}
                  />
                </div>

                {/* Coupon Code Display */}
                <div className="p-2 mb-2 bg-light rounded-3 border">
                  <span className="text-muted small d-block" style={{ fontSize: "11px" }}>COUPON CODE</span>
                  <code className="fs-5 fw-bold text-primary">{qrModalCoupon.coupon_code}</code>
                </div>

                {/* PIN if applicable */}
                {qrModalCoupon.security_pin && (
                  <div className="p-2 mb-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25">
                    <span className="text-muted small d-block" style={{ fontSize: "11px" }}>GIFT CARD PIN</span>
                    <code className="fs-5 fw-bold text-dark">{qrModalCoupon.security_pin}</code>
                  </div>
                )}

                <button className="btn btn-secondary w-100 py-2 mt-2" onClick={() => setQrModalCoupon(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}
