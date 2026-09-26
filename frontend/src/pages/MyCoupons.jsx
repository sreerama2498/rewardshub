import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";

import { toast } from "react-toastify";

export default function MyCoupons() {

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceApp, setSourceApp] = useState("");
  const [couponCode, setCouponCode] = useState("");

const [couponValue,
  setCouponValue] =
    useState("");

const [expiryDate, setExpiryDate] = useState("");

  const [receiverEmails, setReceiverEmails] =
    useState({});

  const [isOcrVerified, setIsOcrVerified] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFeedback, setOcrFeedback] = useState(null);
  const [disputeModalCoupon, setDisputeModalCoupon] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

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

    const formData = new FormData();
    formData.append("file", file);

    setOcrLoading(true);
    setOcrFeedback(null);
    try {
      const response = await api.post("/coupons/verify-ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = response.data;
      setOcrFeedback(data);
      if (data.is_valid) {
        setIsOcrVerified(true);
        toast.success("✅ Screenshot verified! Brand & code detected.");
        if (data.detected_brands?.length && !sourceApp) {
          setSourceApp(data.detected_brands[0]);
        }
        if (data.detected_codes?.length && !couponCode) {
          setCouponCode(data.detected_codes[0]);
        }
      } else {
        toast.warning(data.message || "Screenshot could not be verified automatically.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "OCR verification failed");
    } finally {
      setOcrLoading(false);
    }
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

      await api.post(
        "/coupons",
        {
          title,
          description,
          source_app: sourceApp,
          coupon_code: couponCode,
          coupon_value:
          parseInt(couponValue, 10) || 0,
          expiry_date: expiryDate,
          is_ocr_verified: isOcrVerified
        }
      );

      toast.success(
        "Coupon Created Successfully"
      );

      setTitle("");
      setDescription("");
      setSourceApp("");
      setCouponCode("");
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

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-secondary">Coupon Title *</label>
            <input
              className="form-control"
              placeholder="e.g. PhonePe Flat 50 Cashback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-secondary">Source Brand / App *</label>
            <input
              className="form-control"
              placeholder="e.g. PhonePe, Amazon, Swiggy, RedBus..."
              value={sourceApp}
              onChange={(e) => setSourceApp(e.target.value)}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small text-secondary">Description</label>
            <input
              className="form-control"
              placeholder="Brief description or terms of offer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Coupon Code *</label>
            <input
              className="form-control"
              placeholder="e.g. SAVE50"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-secondary">Coupon Value (₹)</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 50"
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
            />
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
                        <p className="text-muted small mb-3" style={{ fontSize: "13px" }}>
                          {coupon.description}
                        </p>
                      )}

                      {/* Value & Code Box */}
                      <div className="coupon-ticket-notch mb-3 d-flex align-items-center justify-content-between">
                        <div>
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Coupon Code</span>
                          <code className="fw-bold text-dark fs-6 bg-transparent p-0">{coupon.coupon_code}</code>
                        </div>
                        <div className="text-end">
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Value</span>
                          <span className="fw-bold text-success fs-5">₹{coupon.coupon_value || 0}</span>
                        </div>
                      </div>

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

    </div>

  );

}
