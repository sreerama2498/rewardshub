import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";
import CouponKnowledgeModal from "../components/CouponKnowledgeModal";
import CouponPhotoModal from "../components/CouponPhotoModal";

import { toast } from "react-toastify";
import { triggerConfetti } from "../utils/confetti";
import {
  detectCategoryFromBrand,
  detectMechanismFromText,
  COUPON_TYPES_GUIDE
} from "../utils/couponTaxonomy";

const MY_CATEGORIES = [
  { id: "FOOD", label: "Food & Dining", icon: "🍔" },
  { id: "FASHION", label: "Fashion & Shopping", icon: "🛍️" },
  { id: "GROCERY", label: "Grocery & Quick Comm", icon: "🛒" },
  { id: "TRAVEL", label: "Travel & Commute", icon: "✈️" },
  { id: "ENTERTAINMENT", label: "OTT & Entertainment", icon: "🎬" },
  { id: "HEALTH", label: "Health & Wellness", icon: "💊" },
  { id: "GAMING", label: "Gaming & Digital", icon: "🎮" },
  { id: "EDTECH", label: "EdTech & Courses", icon: "🎓" },
  { id: "FINTECH", label: "Fintech, Bills & Recharge", icon: "💳" },
  { id: "OTHER", label: "Other Offers", icon: "🏷️" }
];

const DISCOUNT_TYPES = [
  { id: "FLAT_AMOUNT", label: "Fixed Rupee Discount", icon: "💵", example: "Flat ₹150 OFF on cart" },
  { id: "PERCENTAGE", label: "Percentage-Off", icon: "🏷️", example: "30% OFF up to ₹150" },
  { id: "BOGO", label: "Buy-One-Get-One (BOGO)", icon: "🎁", example: "Buy 1 Get 1 Free on pizzas" },
  { id: "FREE_SHIPPING", label: "Free Shipping", icon: "🚚", example: "Free delivery on orders ₹299+" },
  { id: "FREE_GIFT", label: "Free Gift / Sample", icon: "✨", example: "Free trial kit with purchase" },
  { id: "TIERED", label: "Spend More, Save More", icon: "📊", example: "Spend ₹1000 save ₹100, ₹2500 save ₹350" },
  { id: "GIFT_CARD", label: "Prepaid Gift Card & PIN", icon: "💳", example: "Amazon / Flipkart ₹500 voucher with PIN" },
  { id: "CASHBACK", label: "Cashback Voucher", icon: "🪙", example: "₹50 cashback in wallet after transaction" },
  { id: "SUBSCRIPTION_PASS", label: "Subscription / OTT Pass", icon: "⭐", example: "3 Months Spotify / OTT Premium Free" },
  { id: "RECHARGE_BILL", label: "Recharge & Bill Pay", icon: "⚡", example: "Flat ₹25 OFF on mobile / electricity bill" }
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
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [subscriptionPeriod, setSubscriptionPeriod] = useState("");
  const [tierDetails, setTierDetails] = useState("");

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
  const [ocrPreviewUrls, setOcrPreviewUrls] = useState([]);   // array of screenshot URLs
  const [ocrProofUrl, setOcrProofUrl] = useState(null);       // serialized proof for DB
  const [ocrAutofill, setOcrAutofill] = useState(null);       // parsed autofill fields
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalCoupon, setPhotoModalCoupon] = useState(null);
  const [photoModalData, setPhotoModalData] = useState(null);
  const [disputeModalCoupon, setDisputeModalCoupon] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showPin, setShowPin] = useState({});
  const [qrModalCoupon, setQrModalCoupon] = useState(null);

  // Assisted UX Helpers
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [autoDetectedCat, setAutoDetectedCat] = useState(null);
  const [autoDetectedType, setAutoDetectedType] = useState(null);

  const handleSourceAppChange = (val) => {
    setSourceApp(val);
    const detected = detectCategoryFromBrand(val);
    if (detected) {
      setCategory(detected);
      setAutoDetectedCat(detected);
    } else {
      setAutoDetectedCat(null);
    }
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    const detected = detectMechanismFromText(val);
    if (detected) {
      setAutoDetectedType(detected);
    } else {
      setAutoDetectedType(null);
    }
  };

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
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Show image previews immediately
    const localPreviews = rawFiles.map(f => URL.createObjectURL(f));
    setOcrPreviewUrls(prev => [...prev, ...localPreviews]);

    const formData = new FormData();
    rawFiles.forEach(f => formData.append("files", f));
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

      if (data.ocr_proof_url) {
        setOcrProofUrl(data.ocr_proof_url);
      }
      if (data.image_previews && data.image_previews.length > 0) {
        setOcrPreviewUrls(data.image_previews);
      }

      // Always store autofill suggestions
      if (Object.keys(af).length > 0) {
        setOcrAutofill(af);
        // Automatically populate form fields with extracted data!
        applyAutofill(af, false);
      }

      if (isVerified) {
        setIsOcrVerified(true);
        toast.success(`✅ Scanned ${rawFiles.length} screenshot(s)! Fields automatically extracted.`);
      } else {
        setIsOcrVerified(false);
        const reason = !data.brand_matched
          ? "Brand could not be fully identified."
          : !data.code_matched
          ? "Coupon code not detected clearly."
          : "Could not fully verify screenshot.";
        toast.warning(`⚠️ Partial scan: ${reason} Extracted available offer details.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "OCR scan failed. Please try a clearer screenshot.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Apply autofill suggestions to form fields
  const applyAutofill = (af, showNotification = true) => {
    if (!af) return;
    if (af.title)              setTitle(af.title);
    if (af.source_app)         setSourceApp(af.source_app);
    if (af.category)           setCategory(af.category);
    if (af.coupon_code)        setCouponCode(af.coupon_code);
    if (af.security_pin)       setSecurityPin(af.security_pin);
    if (af.discount_type)      setDiscountType(af.discount_type);
    if (af.discount_percent)   setDiscountPercent(String(af.discount_percent));
    if (af.max_discount_cap)   setMaxDiscountCap(String(af.max_discount_cap));
    if (af.min_order_value)    setMinOrderValue(String(af.min_order_value));
    if (af.coupon_value)       setCouponValue(String(af.coupon_value));
    if (af.expiry_date)        setExpiryDate(af.expiry_date);
    if (af.bogo_details)       setBogoDetails(af.bogo_details);
    if (af.free_gift_details)  setFreeGiftDetails(af.free_gift_details);
    if (af.cashback_amount)    setCashbackAmount(String(af.cashback_amount));
    if (af.subscription_period) setSubscriptionPeriod(af.subscription_period);
    if (af.distribution_channel) setDistributionChannel(af.distribution_channel);
    if (showNotification) {
      toast.success("✨ Form auto-filled from screenshot! Review & adjust if needed.");
    }
  };

  const publishDirectlyFromOcr = async () => {
    const activeAf = ocrAutofill || {};
    const finalSourceApp = sourceApp || activeAf.source_app;
    const finalCode = couponCode || activeAf.coupon_code || redemptionUrl;
    const finalTitle = title || activeAf.title || `${finalSourceApp || "Special"} Offer Voucher`;
    const finalType = discountType || activeAf.discount_type || "FLAT_AMOUNT";

    if (!finalSourceApp) {
      toast.warning("Please specify the brand (e.g. Swiggy, Amazon) before publishing.");
      return;
    }
    if (!finalCode) {
      toast.warning("Please specify a coupon code or redemption link before publishing.");
      return;
    }

    let finalValue = parseInt(couponValue || activeAf.coupon_value || 0, 10);
    if (!finalValue || finalValue <= 0) {
      if (finalType === "PERCENTAGE") finalValue = parseInt(maxDiscountCap || activeAf.max_discount_cap || 100, 10);
      else if (finalType === "FREE_SHIPPING") finalValue = 50;
      else if (finalType === "BOGO") finalValue = 250;
      else if (finalType === "FREE_GIFT") finalValue = 299;
      else if (finalType === "CASHBACK") finalValue = parseInt(cashbackAmount || activeAf.cashback_amount || 50, 10);
      else if (finalType === "SUBSCRIPTION_PASS") finalValue = 299;
      else finalValue = 100;
    }

    try {
      await api.post("/coupons", {
        title: finalTitle,
        description: description || "Verified offer uploaded via screenshot",
        source_app: finalSourceApp,
        category: category || activeAf.category || "OTHER",
        discount_type: finalType,
        discount_percent: parseInt(discountPercent || activeAf.discount_percent || 0, 10),
        max_discount_cap: parseInt(maxDiscountCap || activeAf.max_discount_cap || 0, 10),
        min_order_value: parseInt(minOrderValue || activeAf.min_order_value || 0, 10),
        bogo_details: bogoDetails || activeAf.bogo_details || null,
        free_gift_details: freeGiftDetails || activeAf.free_gift_details || null,
        cashback_amount: parseInt(cashbackAmount || activeAf.cashback_amount || 0, 10),
        subscription_period: subscriptionPeriod || activeAf.subscription_period || null,
        tier_details: tierDetails || activeAf.tier_details || null,
        distribution_channel: distributionChannel || activeAf.distribution_channel || "DIGITAL",
        target_audience: targetAudience || "ALL_USERS",
        usage_structure: usageStructure || "SINGLE_USE",
        coupon_code: finalCode,
        security_pin: securityPin || activeAf.security_pin || null,
        terms_note: termsNote || activeAf.terms_note || null,
        redemption_url: redemptionUrl || null,
        coupon_value: finalValue,
        expiry_date: expiryDate || activeAf.expiry_date || null,
        is_ocr_verified: true,
        ocr_proof_url: ocrProofUrl || null
      });

      triggerConfetti();
      toast.success("🎉 Coupon Created & Published to Marketplace with Verified Screenshot!");

      // Reset
      setTitle("");
      setDescription("");
      setSourceApp("");
      setCategory("OTHER");
      setDiscountType("FLAT_AMOUNT");
      setDiscountPercent("");
      setMaxDiscountCap("");
      setMinOrderValue("");
      setCouponCode("");
      setSecurityPin("");
      setCouponValue("");
      setExpiryDate("");
      setIsOcrVerified(false);
      setOcrFeedback(null);
      setOcrAutofill(null);
      setOcrPreviewUrls([]);
      setOcrProofUrl(null);

      loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to publish coupon to marketplace.");
    }
  };

  const confirmRedeem = async (couponId) => {
    if (!window.confirm("Did the coupon work successfully? This will release the escrow payout to the seller.")) return;
    try {
      const response = await api.post(`/coupons/${couponId}/confirm-redeem`);
      triggerConfetti();
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
        else if (discountType === "CASHBACK") computedValue = parseInt(cashbackAmount, 10) || 50;
        else if (discountType === "SUBSCRIPTION_PASS") computedValue = 299;
        else if (discountType === "RECHARGE_BILL") computedValue = 50;
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
          cashback_amount: parseInt(cashbackAmount, 10) || 0,
          subscription_period: subscriptionPeriod || null,
          tier_details: tierDetails || null,
          distribution_channel: distributionChannel,
          target_audience: targetAudience,
          usage_structure: usageStructure,
          coupon_code: couponCode || null,
          security_pin: securityPin || null,
          terms_note: termsNote || null,
          redemption_url: redemptionUrl || null,
          coupon_value: computedValue,
          expiry_date: expiryDate || null,
          is_ocr_verified: isOcrVerified,
          ocr_proof_url: ocrProofUrl || null
        }
      );

      triggerConfetti();
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
      setCashbackAmount("");
      setSubscriptionPeriod("");
      setTierDetails("");
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
      setOcrAutofill(null);
      setOcrPreviewUrls([]);
      setOcrProofUrl(null);
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

        {/* ─── Multi-Screenshot Scan Banner ──────────────────────────────────── */}
        <div
          className="mb-4 p-3 rounded-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 shadow-sm"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)", border: "1px dashed #6366f1" }}
        >
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="fs-4">📸</span>
              <p className="fw-bold mb-0" style={{ color: "#312e81" }}>
                Auto-Scan Coupon Screenshots (Multi-Photo Supported)
              </p>
              <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: "10px" }}>
                Multi-Image OCR
              </span>
            </div>
            <p className="text-secondary small mb-0">
              Upload 1 or more screenshots (offer banner, promo code, terms, expiry). We merge them and auto-fill all required fields.
            </p>
          </div>

          <label
            className="btn btn-sm px-4 py-2 fw-semibold text-nowrap shadow-sm"
            style={{ background: "#4f46e5", color: "#fff", borderRadius: "10px", cursor: "pointer" }}
          >
            {ocrLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />&nbsp;Scanning Photos…</>
            ) : (
              <>📷 &nbsp;Upload Screenshot(s)</>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="d-none"
              onChange={handleOcrUpload}
            />
          </label>
        </div>

        {/* ─── Multi-Screenshot Preview & 1-Click Publishing Panel ───────────── */}
        {(ocrPreviewUrls.length > 0 || ocrAutofill) && (
          <div
            className="mb-4 p-4 rounded-3 shadow-sm"
            style={{ background: "#ffffff", border: "1px solid #c7d2fe" }}
          >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div>
                <span className="fw-bold text-dark d-block">
                  🖼️ Uploaded Coupon Photos ({ocrPreviewUrls.length})
                </span>
                <span className="text-muted small" style={{ fontSize: "12px" }}>
                  Click any photo thumbnail to inspect the full image and extracted offer details
                </span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    setOcrPreviewUrls([]);
                    setOcrProofUrl(null);
                    setOcrAutofill(null);
                  }}
                >
                  Clear Photos
                </button>
              </div>
            </div>

            <div className="row g-3 align-items-start">
              {/* Photo Thumbnails */}
              {ocrPreviewUrls.length > 0 && (
                <div className="col-12 col-md-auto d-flex flex-wrap gap-2">
                  {ocrPreviewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="position-relative rounded-3 overflow-hidden border shadow-sm transition-all"
                      style={{
                        cursor: "pointer",
                        width: "120px",
                        height: "120px",
                        background: "#0f172a"
                      }}
                      onClick={() => {
                        setPhotoModalData(ocrPreviewUrls);
                        setPhotoModalCoupon({
                          title: title || ocrAutofill?.title || "Scanned Coupon",
                          source_app: sourceApp || ocrAutofill?.source_app,
                          coupon_code: couponCode || ocrAutofill?.coupon_code,
                          security_pin: securityPin || ocrAutofill?.security_pin,
                          discount_type: discountType || ocrAutofill?.discount_type,
                          coupon_value: couponValue || ocrAutofill?.coupon_value,
                          expiry_date: expiryDate || ocrAutofill?.expiry_date,
                          terms_note: termsNote || ocrAutofill?.terms_note
                        });
                        setPhotoModalOpen(true);
                      }}
                      title="Click to view full photo and offer details"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span className="position-absolute top-0 start-0 badge bg-dark bg-opacity-75 m-1" style={{ fontSize: "10px" }}>
                        #{idx + 1}
                      </span>
                      <div
                        className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white py-1 text-center small"
                        style={{ fontSize: "10px" }}
                      >
                        🔍 View Photo
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Detected Offer Details & 1-Click Publishing */}
              {ocrAutofill && (
                <div className="col">
                  <div className="p-3 rounded-3 mb-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold small text-success">
                        ✨ Extracted Offer Details (Ready to Publish)
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none small"
                        onClick={() => {
                          setPhotoModalData(ocrPreviewUrls);
                          setPhotoModalCoupon({
                            title: title || ocrAutofill?.title || "Scanned Coupon",
                            source_app: sourceApp || ocrAutofill?.source_app,
                            coupon_code: couponCode || ocrAutofill?.coupon_code,
                            security_pin: securityPin || ocrAutofill?.security_pin,
                            discount_type: discountType || ocrAutofill?.discount_type,
                            coupon_value: couponValue || ocrAutofill?.coupon_value,
                            expiry_date: expiryDate || ocrAutofill?.expiry_date,
                            terms_note: termsNote || ocrAutofill?.terms_note
                          });
                          setPhotoModalOpen(true);
                        }}
                      >
                        🔍 Inspect In Photo Viewer
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {(title || ocrAutofill.title) && (
                        <span className="badge rounded-pill px-3 py-2 bg-success bg-opacity-10 text-success" style={{ fontSize: "12px" }}>
                          📌 Title: {title || ocrAutofill.title}
                        </span>
                      )}
                      {(sourceApp || ocrAutofill.source_app) && (
                        <span className="badge rounded-pill px-3 py-2 bg-primary bg-opacity-10 text-primary" style={{ fontSize: "12px" }}>
                          🏷️ Brand: {sourceApp || ocrAutofill.source_app}
                        </span>
                      )}
                      {(couponCode || ocrAutofill.coupon_code) && (
                        <span className="badge rounded-pill px-3 py-2 bg-warning bg-opacity-25 text-dark fw-bold" style={{ fontSize: "12px" }}>
                          🎫 Code: {couponCode || ocrAutofill.coupon_code}
                        </span>
                      )}
                      {(securityPin || ocrAutofill.security_pin) && (
                        <span className="badge rounded-pill px-3 py-2 bg-danger bg-opacity-10 text-danger fw-bold" style={{ fontSize: "12px" }}>
                          🔐 PIN: {securityPin || ocrAutofill.security_pin}
                        </span>
                      )}
                      {(discountType || ocrAutofill.discount_type) && (
                        <span className="badge rounded-pill px-3 py-2 bg-info bg-opacity-10 text-dark" style={{ fontSize: "12px" }}>
                          💰 Type: {discountType || ocrAutofill.discount_type}
                        </span>
                      )}
                      {(couponValue || ocrAutofill.coupon_value) && (
                        <span className="badge rounded-pill px-3 py-2 bg-success bg-opacity-10 text-success fw-bold" style={{ fontSize: "12px" }}>
                          💵 Value: ₹{couponValue || ocrAutofill.coupon_value}
                        </span>
                      )}
                      {(expiryDate || ocrAutofill.expiry_date) && (
                        <span className="badge rounded-pill px-3 py-2 bg-danger bg-opacity-10 text-danger" style={{ fontSize: "12px" }}>
                          📅 Expires: {expiryDate || ocrAutofill.expiry_date}
                        </span>
                      )}
                    </div>

                    {/* Direct 1-Click Publishing Button */}
                    <div className="d-flex flex-wrap align-items-center gap-2 pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-success fw-bold px-4 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                        onClick={publishDirectlyFromOcr}
                      >
                        <span>🚀</span>
                        <span>Auto-Fill & Publish to Marketplace Now</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary fw-semibold px-3 py-2 rounded-3"
                        onClick={() => {
                          applyAutofill(ocrAutofill);
                          const el = document.getElementById("coupon-form-anchor");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        ✏️ Review & Edit Form Below
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!ocrAutofill && ocrPreviewUrls.length > 0 && !ocrLoading && (
                <div className="col d-flex align-items-center">
                  <p className="text-muted small mb-0">
                    {ocrFeedback?.is_verified
                      ? "✅ Verified — click 'Publish to Marketplace' below to list your coupon."
                      : "⚠️ Screenshots scanned. You can review and adjust any remaining fields below before publishing."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div id="coupon-form-anchor" />

        {/* SECTION 1: Basic Information */}

        <div className="row g-3 mb-2">
          <div className="col-12 col-md-5">
            <label className="form-label fw-semibold small text-secondary">Coupon Title *</label>
            <input
              className="form-control"
              placeholder="e.g. Flat 50% Off / Amazon ₹500 Card / Swiggy BOGO"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
            {autoDetectedType && autoDetectedType !== discountType && (
              <div className="mt-1 d-flex align-items-center gap-2">
                <span className="badge bg-primary bg-opacity-10 text-primary small" style={{ fontSize: "11px" }}>
                  ✨ Detected type: {DISCOUNT_TYPES.find(d => d.id === autoDetectedType)?.label}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-primary text-decoration-none fw-bold small"
                  style={{ fontSize: "11px" }}
                  onClick={() => {
                    setDiscountType(autoDetectedType);
                    setAutoDetectedType(null);
                    toast.info(`Applied ${DISCOUNT_TYPES.find(d => d.id === autoDetectedType)?.label}`);
                  }}
                >
                  Apply ➔
                </button>
              </div>
            )}
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Source Brand / App *</label>
            <input
              className="form-control"
              placeholder="e.g. Swiggy, Amazon, GooglePay, Myntra, Uber..."
              value={sourceApp}
              onChange={(e) => handleSourceAppChange(e.target.value)}
            />
            {autoDetectedCat && (
              <span className="badge bg-success bg-opacity-10 text-success d-inline-flex align-items-center gap-1 mt-1 small" style={{ fontSize: "11px" }}>
                ✨ Auto-selected: {MY_CATEGORIES.find(c => c.id === autoDetectedCat)?.label}
              </span>
            )}
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label fw-semibold small text-secondary">Industry Category *</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setAutoDetectedCat(null);
              }}
            >
              {MY_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
            <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
              e.g. Swiggy → Food, Myntra → Fashion, Blinkit → Grocery
            </small>
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
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <span className="fw-bold text-dark d-block" style={{ fontSize: "14px" }}>
                1. Select Discount Mechanism 🏷️
              </span>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Fields below automatically adapt to your chosen coupon type
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3 shadow-sm"
                onClick={() => setShowGuideModal(true)}
              >
                💡 Coupon Guide
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3 shadow-sm ${
                  showWizard ? "btn-warning fw-bold" : "btn-outline-warning text-dark bg-white"
                }`}
                onClick={() => setShowWizard(!showWizard)}
              >
                🪄 {showWizard ? "Hide Wizard" : "Help Me Choose"}
              </button>
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill small">
                Dynamic Form Engine
              </span>
            </div>
          </div>

          {/* INTERACTIVE WIZARD: HELP ME CHOOSE */}
          {showWizard && (
            <div className="p-3 mb-3 rounded-3 border bg-white shadow-sm" style={{ borderColor: "#fde68a" }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-dark small">
                  🪄 Quick Helper: What does this coupon give you?
                </span>
                <button
                  type="button"
                  className="btn-close btn-sm"
                  onClick={() => setShowWizard(false)}
                />
              </div>
              <p className="text-muted small mb-2" style={{ fontSize: "12px" }}>
                Click the scenario that best matches your voucher:
              </p>
              <div className="row g-2">
                {[
                  { id: "FLAT_AMOUNT", title: "💵 Direct Rupee Discount", desc: "Flat ₹100 or ₹200 off your cart total" },
                  { id: "PERCENTAGE", title: "🏷️ Percentage Off", desc: "20% or 50% discount with a maximum cap" },
                  { id: "BOGO", title: "🎁 Buy 1 Get 1 Free", desc: "Buy one item/pizza/ticket and get another free" },
                  { id: "FREE_SHIPPING", title: "🚚 Free Delivery", desc: "Removes delivery or shipping charges completely" },
                  { id: "GIFT_CARD", title: "💳 Prepaid Gift Card & PIN", desc: "Pre-loaded money with a voucher code and secret PIN" },
                  { id: "SUBSCRIPTION_PASS", title: "⭐ Free Membership / Trial", desc: "3 months free Spotify, YouTube, or OTT access" },
                  { id: "CASHBACK", title: "🪙 Post-Order Cashback", desc: "Money credited back to wallet/UPI after order" },
                  { id: "RECHARGE_BILL", title: "⚡ Utility / Recharge Rebate", desc: "Discount on mobile recharge, FASTag, or electricity" }
                ].map(wiz => (
                  <div className="col-12 col-md-6 col-lg-3" key={wiz.id}>
                    <button
                      type="button"
                      className={`btn w-100 text-start p-2 rounded-3 h-100 border ${
                        discountType === wiz.id ? "border-primary bg-primary bg-opacity-10" : "bg-light hover-bg-white"
                      }`}
                      onClick={() => {
                        setDiscountType(wiz.id);
                        setShowWizard(false);
                        toast.success(`Selected: ${wiz.title}`);
                      }}
                    >
                      <strong className="d-block small text-dark">{wiz.title}</strong>
                      <span className="text-muted d-block small" style={{ fontSize: "11px", lineHeight: "1.2" }}>
                        {wiz.desc}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Active Discount Type Contextual Helper Bar */}
          {(() => {
            const activeGuide = COUPON_TYPES_GUIDE.find(g => g.id === discountType);
            if (!activeGuide) return null;
            return (
              <div
                className="p-2 px-3 mb-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "12px" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">{activeGuide.icon}</span>
                  <div>
                    <strong className="text-primary">{activeGuide.friendlyName}:</strong>{" "}
                    <span className="text-dark">{activeGuide.explanation}</span>
                  </div>
                </div>
                <div className="text-muted small">
                  <strong>Example:</strong> <span className="text-success fw-medium">{activeGuide.example}</span>
                </div>
              </div>
            );
          })()}

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
                  value={tierDetails || termsNote}
                  onChange={(e) => {
                    setTierDetails(e.target.value);
                    if (!termsNote) setTermsNote(e.target.value);
                  }}
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

          {/* DYNAMIC FIELDS: GIFT_CARD */}
          {discountType === "GIFT_CARD" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Gift Card Balance (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 500"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Secret PIN / Passcode (Optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g. 123456"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: CASHBACK */}
          {discountType === "CASHBACK" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Cashback Benefit (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={cashbackAmount || couponValue}
                    onChange={(e) => {
                      setCashbackAmount(e.target.value);
                      setCouponValue(e.target.value);
                    }}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Minimum Transaction Spend (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 499 (0 if no minimum)"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: SUBSCRIPTION_PASS */}
          {discountType === "SUBSCRIPTION_PASS" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Subscription Duration *</label>
                <input
                  className="form-control"
                  placeholder="e.g. 3 Months Free Premium, 1-Year Pass"
                  value={subscriptionPeriod}
                  onChange={(e) => setSubscriptionPeriod(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Equivalent Market Value (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 299"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: RECHARGE_BILL */}
          {discountType === "RECHARGE_BILL" && (
            <div className="row g-2 p-3 bg-white rounded-3 border">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Bill Discount / Rebate Amount (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Minimum Recharge / Bill Spend (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 199"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
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
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="form-label fw-semibold small text-secondary mb-0">Expiry Date</label>
              <div className="d-flex gap-1">
                {[
                  { label: "+7D", days: 7 },
                  { label: "+30D", days: 30 },
                  { label: "+90D", days: 90 },
                  { label: "+1Yr", days: 365 }
                ].map(q => (
                  <button
                    key={q.label}
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0 px-1"
                    style={{ fontSize: "10px" }}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + q.days);
                      setExpiryDate(d.toISOString().split("T")[0]);
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              className="form-control"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            {expiryDate && (
              <span className="badge bg-success bg-opacity-10 text-success mt-1 small" style={{ fontSize: "11px" }}>
                📅 Valid until {expiryDate}
              </span>
            )}
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
                    📸 Upload Reward Screenshot(s) (Automated OCR Verification)
                  </span>
                  <span className="text-muted small" style={{ fontSize: "12px" }}>
                    Upload 1 or more screenshots to verify authenticity and extract offer terms, code, and expiry.
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="file"
                    id="ocrFileInput"
                    className="d-none"
                    accept="image/*"
                    multiple
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
                          {coupon.discount_type === "GIFT_CARD" && (
                            <span className="badge bg-purple bg-opacity-10 text-dark border border-secondary border-opacity-25 px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              💳 Gift Card (₹{coupon.coupon_value})
                            </span>
                          )}
                          {coupon.discount_type === "CASHBACK" && (
                            <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              🪙 Cashback (₹{coupon.cashback_amount || coupon.coupon_value})
                            </span>
                          )}
                          {coupon.discount_type === "SUBSCRIPTION_PASS" && (
                            <span className="badge bg-info bg-opacity-10 text-dark border border-info border-opacity-25 px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              ⭐ Subscription Pass
                            </span>
                          )}
                          {coupon.discount_type === "RECHARGE_BILL" && (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              ⚡ Bill / Recharge Rebate
                            </span>
                          )}
                          {coupon.discount_type === "TIERED" && (
                            <span className="badge bg-dark text-white px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              📊 Tiered Offer
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
                          {coupon.ocr_proof_url && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill px-2 py-0 d-inline-flex align-items-center gap-1 border"
                              style={{ fontSize: "10px", fontWeight: "600" }}
                              onClick={() => {
                                setPhotoModalCoupon(coupon);
                                setPhotoModalData(coupon.ocr_proof_url);
                                setPhotoModalOpen(true);
                              }}
                            >
                              📸 View Voucher Photo
                            </button>
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
                            onClick={() => {
                              if (coupon.coupon_code && coupon.coupon_code !== "REDEEM_VIA_LINK") {
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard.writeText(coupon.coupon_code);
                                }
                                toast.success(`Copied code "${coupon.coupon_code}" and opening store!`);
                              }
                            }}
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

      {/* Coupon & Category Knowledge Guide Modal */}
      <CouponKnowledgeModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onSelectType={(tId) => setDiscountType(tId)}
      />

      {/* Coupon Photo & Offer Details Lightbox Modal */}
      <CouponPhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        photoData={photoModalData}
        coupon={photoModalCoupon}
      />

    </div>

  );

}
