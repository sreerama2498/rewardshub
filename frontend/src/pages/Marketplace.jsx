import { useEffect, useState, useCallback } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import CouponLogo from "../components/CouponLogo";

import { toast } from "react-toastify";

const CATEGORIES = [
  { id: "ALL", label: "All Categories", icon: "🌐" },
  { id: "FOOD", label: "Food & Dining", icon: "🍔" },
  { id: "FASHION", label: "Fashion & Shopping", icon: "🛍️" },
  { id: "TRAVEL", label: "Travel & Commute", icon: "✈️" },
  { id: "ENTERTAINMENT", label: "OTT & Entertainment", icon: "🎬" },
  { id: "HEALTH", label: "Health & Wellness", icon: "💊" },
  { id: "EDTECH", label: "EdTech & Courses", icon: "🎓" },
  { id: "GAMING", label: "Gaming & Digital", icon: "🎮" },
  { id: "OTHER", label: "Other Offers", icon: "🏷️" }
];

const MARKET_DISCOUNT_TYPES = [
  { id: "ALL", label: "All Mechanisms", icon: "✨" },
  { id: "FLAT_AMOUNT", label: "Fixed Amount-Off", icon: "💵" },
  { id: "PERCENTAGE", label: "Percentage-Off", icon: "🏷️" },
  { id: "BOGO", label: "BOGO", icon: "🎁" },
  { id: "FREE_SHIPPING", label: "Free Shipping", icon: "🚚" },
  { id: "FREE_GIFT", label: "Free Gift / Trial", icon: "✨" },
  { id: "TIERED", label: "Tiered Threshold", icon: "📊" }
];

export default function Marketplace() {

  const [coupons, setCoupons] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [purchasedReceipt, setPurchasedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDiscountType, setSelectedDiscountType] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadMarketplace = useCallback(async (cat = selectedCategory, disc = selectedDiscountType) => {
    try {
      const params = new URLSearchParams();
      if (cat && cat !== "ALL") params.append("category", cat);
      if (disc && disc !== "ALL") params.append("discount_type", disc);
      const url = params.toString() ? `/marketplace?${params.toString()}` : "/marketplace";

      const [couponsRes, walletRes] = await Promise.all([
        api.get(url),
        api.get("/wallet").catch(() => ({ data: null }))
      ]);

      setCoupons(Array.isArray(couponsRes.data) ? couponsRes.data : []);
      if (walletRes.data) {
        setWallet(walletRes.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed To Load Marketplace");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDiscountType]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const requestCoupon = async (couponId) => {
    try {
      const response = await api.post(`/request-coupon/${couponId}`, {});

      setPurchasedReceipt(response.data);
      toast.success(response.data.message);
      loadMarketplace();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.detail || "Request Failed"
      );
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <Navbar />
        <h3>Loading Marketplace...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Header Banner with Business Rules & Wallet Status */}
      <div
        className="card mb-4 border-0 text-white overflow-hidden shadow-md"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "18px"
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary px-3 py-1 rounded-pill">
                Fair Trade Marketplace
              </span>
              <span className="text-white-50 small">🛡️ 100% Escrow Protected & OCR Verified</span>
            </div>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: "26px" }}>
              Coupon Marketplace 🛒
            </h2>
            <p className="text-white-50 mb-0 small">
              Request high-value coupons at <strong>25% of face value</strong>. 
              Your payment is held safely in <strong>Escrow</strong> until you verify the coupon works. Owner receives <strong>20% payout</strong> upon verification, and you are protected by an instant <strong>100% refund</strong> if invalid.
            </p>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-3">
            {/* Split Badges */}
            <div className="d-flex gap-2 bg-dark bg-opacity-50 p-2 rounded-3 border border-secondary border-opacity-25">
              <div className="text-center px-3 py-1 border-end border-secondary border-opacity-25">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>YOU PAY</span>
                <span className="fw-bold text-warning fs-6">25%</span>
              </div>
              <div className="text-center px-3 py-1 border-end border-secondary border-opacity-25">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>OWNER GETS</span>
                <span className="fw-bold text-success fs-6">20%</span>
              </div>
              <div className="text-center px-3 py-1">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>FEE</span>
                <span className="fw-bold text-info fs-6">5%</span>
              </div>
            </div>

            {/* Wallet balance pill */}
            {wallet && (
              <div className="bg-success bg-opacity-10 border border-success border-opacity-25 p-2 px-3 rounded-3 text-end">
                <span className="text-white-50 small d-block" style={{ fontSize: "11px" }}>WALLET BALANCE</span>
                <span className="fw-bold text-white fs-6">💳 ₹{wallet.wallet_balance}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instant Purchase Receipt Banner */}
      {purchasedReceipt && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm p-4 mb-4 rounded-4" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="fw-bold text-success mb-0">🎉 Coupon Unlocked & Transferred!</h5>
            <button type="button" className="btn-close" onClick={() => setPurchasedReceipt(null)}></button>
          </div>
          <p className="mb-2 text-dark">
            Coupon Code: <span className="badge bg-success fs-6 px-3 py-1 font-monospace">{purchasedReceipt.coupon_code}</span>
            <span className="text-muted small ms-2">(Added to your <strong>My Coupons</strong> list)</span>
          </p>
          <div className="d-flex flex-wrap gap-3 small text-secondary">
            <span>Transaction: <strong>{purchasedReceipt.transaction_id}</strong></span>
            <span>Paid (25%): <strong className="text-dark">₹{purchasedReceipt.total_price}</strong></span>
            <span>Credited to Owner (20%): <strong className="text-success">₹{purchasedReceipt.owner_payout}</strong></span>
            <span>Platform Fee (5%): <strong className="text-info">₹{purchasedReceipt.platform_fee}</strong></span>
            <span>Remaining Balance: <strong className="text-dark">₹{purchasedReceipt.wallet_balance}</strong></span>
          </div>
        </div>
      )}

      {/* Category Pills & Search Toolbar */}
      <div className="card p-3 mb-4 border-0 shadow-sm" style={{ borderRadius: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                className="form-control border-start-0"
                placeholder="Search marketplace by brand, title, or terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end text-muted small">
            Showing <strong>{coupons.filter(c => {
              const q = search.toLowerCase();
              return !q || (c.title || "").toLowerCase().includes(q) || (c.source_app || "").toLowerCase().includes(q) || (c.terms_note || "").toLowerCase().includes(q);
            }).length}</strong> offer(s)
          </div>
        </div>

        {/* Scrollable Category Chips */}
        <div className="d-flex align-items-center gap-2 overflow-auto pb-2 border-bottom" style={{ whiteSpace: "nowrap" }}>
          <span className="text-muted small fw-semibold me-1">Category:</span>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-sm rounded-pill px-3 py-1 transition-all ${
                  isActive
                    ? "btn-primary shadow-sm fw-bold"
                    : "btn-outline-secondary border-0 bg-light text-dark"
                }`}
                style={{ fontSize: "12px" }}
              >
                <span className="me-1">{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Discount Mechanism Chips */}
        <div className="d-flex align-items-center gap-2 overflow-auto pt-2" style={{ whiteSpace: "nowrap" }}>
          <span className="text-muted small fw-semibold me-1">Mechanism:</span>
          {MARKET_DISCOUNT_TYPES.map((dt) => {
            const isActive = selectedDiscountType === dt.id;
            return (
              <button
                key={dt.id}
                onClick={() => setSelectedDiscountType(dt.id)}
                className={`btn btn-sm rounded-pill px-3 py-1 transition-all ${
                  isActive
                    ? "btn-dark shadow-sm fw-bold"
                    : "btn-outline-secondary border-0 bg-light text-secondary"
                }`}
                style={{ fontSize: "12px" }}
              >
                <span className="me-1">{dt.icon}</span>
                {dt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="row g-3">

        {
          coupons
            .filter(c => {
              const q = search.toLowerCase();
              return !q || (c.title || "").toLowerCase().includes(q) || (c.source_app || "").toLowerCase().includes(q) || (c.terms_note || "").toLowerCase().includes(q);
            })
            .length === 0 && (
            <div className="col-12">
              <div className="card text-center p-5 border-dashed">
                <div style={{ fontSize: "40px" }} className="mb-2">🛒</div>
                <h5 className="fw-semibold text-dark">No marketplace coupons found</h5>
                <p className="text-muted small">Try selecting another category or check back soon.</p>
              </div>
            </div>
          )
        }

        {
          coupons
            .filter(c => {
              const q = search.toLowerCase();
              return !q || (c.title || "").toLowerCase().includes(q) || (c.source_app || "").toLowerCase().includes(q) || (c.terms_note || "").toLowerCase().includes(q);
            })
            .map((coupon) => {
            const val = coupon.coupon_value || 0;
            const totalPrice = coupon.total_price ?? Math.round(val * 0.25);
            const ownerPayout = coupon.owner_payout ?? Math.round(val * 0.20);
            const platformFee = coupon.platform_fee ?? Math.round(val * 0.05);

            return (
              <div className="col-12 col-md-6 col-lg-4" key={coupon.id}>
                <div className="card h-100 card-coupon shadow-sm">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Header */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <CouponLogo
                          title={coupon.title}
                          sourceApp={coupon.source_app}
                          description={coupon.description}
                          size={46}
                        />
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge-soft badge-soft-primary">
                            {coupon.source_app}
                          </span>
                          {coupon.category && coupon.category !== "OTHER" && (
                            <span className="badge bg-light text-dark border px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              {CATEGORIES.find(c => c.id === coupon.category)?.icon || "🏷️"} {CATEGORIES.find(c => c.id === coupon.category)?.label || coupon.category}
                            </span>
                          )}
                          {coupon.is_owner && (
                            <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1 rounded-pill small fw-bold" style={{ fontSize: "10px" }}>
                              🏷️ Listed by You
                            </span>
                          )}
                          {coupon.is_ocr_verified && (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🛡️ OCR Verified
                            </span>
                          )}
                          {coupon.has_security_pin && (
                            <span className="badge bg-secondary bg-opacity-10 text-dark border border-secondary border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🔐 Gift Card + PIN Included
                            </span>
                          )}
                          {coupon.has_redemption_url && (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                              🔗 Direct Link Included
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mechanism and Targeting Highlights */}
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {coupon.discount_type === "PERCENTAGE" && (
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill small fw-bold">
                            🏷️ {coupon.discount_percent}% OFF {coupon.max_discount_cap ? `(Max ₹${coupon.max_discount_cap})` : ""}
                          </span>
                        )}
                        {coupon.discount_type === "BOGO" && (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill small fw-bold">
                            🎁 BOGO {coupon.bogo_details ? `(${coupon.bogo_details})` : ""}
                          </span>
                        )}
                        {coupon.discount_type === "FREE_SHIPPING" && (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small fw-bold">
                            🚚 Free Shipping {coupon.min_order_value ? `(Min ₹${coupon.min_order_value})` : ""}
                          </span>
                        )}
                        {coupon.discount_type === "FREE_GIFT" && (
                          <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill small fw-bold">
                            ✨ Free Gift / Trial {coupon.free_gift_details ? `(${coupon.free_gift_details})` : ""}
                          </span>
                        )}
                        {coupon.min_order_value > 0 && coupon.discount_type !== "FREE_SHIPPING" && (
                          <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill small">
                            🛒 Min Spend: ₹{coupon.min_order_value}
                          </span>
                        )}
                        {coupon.target_audience === "NEW_USERS" && (
                          <span className="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1 rounded-pill small">
                            👤 New Users Only
                          </span>
                        )}
                        {coupon.usage_structure === "STACKABLE" && (
                          <span className="badge bg-info bg-opacity-10 text-primary border border-info border-opacity-25 px-2 py-1 rounded-pill small">
                            ⚡ Stackable
                          </span>
                        )}
                        {coupon.distribution_channel === "IN_STORE" && (
                          <span className="badge bg-dark text-white px-2 py-1 rounded-pill small">
                            📱 In-Store Counter Barcode
                          </span>
                        )}
                      </div>

                      <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "17px", lineHeight: "1.3" }}>
                        {coupon.title}
                      </h5>
                      {coupon.description && (
                        <p className="text-muted small mb-2" style={{ fontSize: "13px" }}>
                          {coupon.description}
                        </p>
                      )}

                      {/* Terms Note */}
                      {coupon.terms_note && (
                        <div className="p-2 mb-3 rounded-2 text-dark" style={{ background: "#fefce8", border: "1px solid #fef08a", fontSize: "11px" }}>
                          <strong>ℹ️ Terms:</strong> {coupon.terms_note}
                        </div>
                      )}

                      {/* Face Value & Total to Pay */}
                      <div className="coupon-ticket-notch mb-3 d-flex align-items-center justify-content-between">
                        <div>
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Coupon Value</span>
                          <span className="fw-bold text-dark fs-5">₹{val}</span>
                        </div>
                        <div className="text-end">
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>You Pay (25%)</span>
                          <span className="fw-bold text-warning fs-5">₹{totalPrice}</span>
                        </div>
                      </div>

                      {/* Transparent 20% / 5% Breakdown Pill */}
                      <div className="p-2 rounded-2 mb-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                        <div className="d-flex justify-content-between text-secondary mb-1">
                          <span>Owner Payout (20%):</span>
                          <strong className="text-success">₹{ownerPayout}</strong>
                        </div>
                        <div className="d-flex justify-content-between text-secondary">
                          <span>Platform Fee (5%):</span>
                          <strong className="text-muted">₹{platformFee}</strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="d-flex align-items-center justify-content-center gap-1 mb-2 text-primary small" style={{ fontSize: "11px" }}>
                        <span>🔒 100% Escrow Protected • Instant Refund Guarantee</span>
                      </div>
                      {coupon.is_owner ? (
                        <div>
                          <button
                            className="btn btn-outline-secondary w-100 py-2 disabled"
                            style={{ cursor: "not-allowed", opacity: 0.85 }}
                            disabled
                          >
                            🏷️ Your Listing (Live on Marketplace)
                          </button>
                          <span className="text-muted d-block text-center mt-1" style={{ fontSize: "11px" }}>
                            Visible to all buyers. You receive ₹{ownerPayout} when purchased.
                          </span>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary w-100 py-2"
                          onClick={() => requestCoupon(coupon.id)}
                        >
                          Request & Pay ₹{totalPrice}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        }

      </div>

    </div>

  );

}
