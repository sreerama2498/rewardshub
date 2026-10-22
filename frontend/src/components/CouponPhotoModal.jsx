import { useState, useMemo } from "react";

export default function CouponPhotoModal({ isOpen, onClose, photoData, coupon }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Normalize photoData: could be a single data URL string, an array of strings, or a JSON string
  const photos = useMemo(() => {
    const raw = photoData || coupon?.ocr_proof_url;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      if (raw.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // fallback to single string
        }
      }
      return [raw];
    }
    return [];
  }, [photoData, coupon]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[selectedIdx] || photos[0];

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(10, 15, 29, 0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 1070
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 overflow-hidden shadow-2xl bg-white">
          {/* Header */}
          <div
            className="modal-header text-white px-4 py-3 border-0"
            style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}
          >
            <div className="d-flex align-items-center gap-3">
              <span className="fs-3">📸</span>
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  {coupon?.title || "Coupon Screenshot Proof"}
                </h5>
                <small className="text-light opacity-75" style={{ fontSize: "12px" }}>
                  {photos.length > 1
                    ? `Showing screenshot ${selectedIdx + 1} of ${photos.length}`
                    : "Verified voucher screenshot"}
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="btn-group btn-group-sm me-2 bg-dark rounded-pill p-1">
                <button
                  type="button"
                  className="btn btn-dark btn-sm text-white border-0"
                  onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.2))}
                  title="Zoom Out"
                >
                  🔍 -
                </button>
                <button
                  type="button"
                  className="btn btn-dark btn-sm text-white border-0"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  className="btn btn-dark btn-sm text-white border-0"
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                  title="Zoom In"
                >
                  🔍 +
                </button>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-0">
            <div className="row g-0">
              {/* Image Preview Canvas */}
              <div
                className="col-12 col-lg-8 p-4 d-flex flex-column align-items-center justify-content-center position-relative"
                style={{
                  background: "#0f172a",
                  minHeight: "450px",
                  maxHeight: "70vh",
                  overflow: "auto"
                }}
              >
                <img
                  src={currentPhoto}
                  alt="Coupon voucher proof"
                  className="img-fluid rounded-3 shadow-lg transition-all"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    maxHeight: "60vh",
                    objectFit: "contain",
                    transition: "transform 0.2s ease"
                  }}
                />

                {/* Multiple Photos Thumbnails Carousel */}
                {photos.length > 1 && (
                  <div
                    className="position-absolute bottom-0 start-50 translate-middle-x p-2 mb-3 rounded-pill d-flex gap-2 shadow"
                    style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", zIndex: 10 }}
                  >
                    {photos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`btn p-0 rounded-2 overflow-hidden border-2 ${
                          selectedIdx === idx ? "border-primary" : "border-secondary opacity-50"
                        }`}
                        style={{ width: "45px", height: "45px", borderStyle: "solid" }}
                        onClick={() => {
                          setSelectedIdx(idx);
                          setZoomLevel(1);
                        }}
                      >
                        <img
                          src={p}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Offer Details Sidebar */}
              <div
                className="col-12 col-lg-4 p-4 border-start bg-light d-flex flex-column justify-content-between"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill small">
                      ✅ OCR Verified Screenshot
                    </span>
                    <span className="text-muted small" style={{ fontSize: "11px" }}>
                      Original Proof
                    </span>
                  </div>

                  <h6 className="fw-bold text-dark mb-1">
                    {coupon?.title || "Scanned Offer Details"}
                  </h6>
                  <p className="text-secondary small mb-3">
                    {coupon?.description || "Original details extracted directly from the uploaded coupon voucher screenshot."}
                  </p>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {coupon?.source_app && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between small">
                        <span className="text-muted">Brand / App:</span>
                        <strong className="text-dark">{coupon.source_app}</strong>
                      </div>
                    )}

                    {coupon?.coupon_code && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between align-items-center small">
                        <span className="text-muted">Coupon Code:</span>
                        <code className="text-primary fw-bold fs-6">{coupon.coupon_code}</code>
                      </div>
                    )}

                    {coupon?.security_pin && (
                      <div className="p-2 bg-warning bg-opacity-10 rounded-2 border border-warning border-opacity-25 d-flex justify-content-between small">
                        <span className="text-muted">Secret PIN:</span>
                        <code className="text-dark fw-bold">{coupon.security_pin}</code>
                      </div>
                    )}

                    {coupon?.discount_type && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between small">
                        <span className="text-muted">Mechanism:</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {coupon.discount_type}
                        </span>
                      </div>
                    )}

                    {coupon?.coupon_value > 0 && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between small">
                        <span className="text-muted">Face Value:</span>
                        <strong className="text-success">₹{coupon.coupon_value}</strong>
                      </div>
                    )}

                    {coupon?.min_order_value > 0 && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between small">
                        <span className="text-muted">Min Cart Spend:</span>
                        <span className="text-dark fw-medium">₹{coupon.min_order_value}</span>
                      </div>
                    )}

                    {coupon?.expiry_date && (
                      <div className="p-2 bg-white rounded-2 border d-flex justify-content-between small">
                        <span className="text-muted">Expires On:</span>
                        <span className="text-danger fw-medium">{coupon.expiry_date}</span>
                      </div>
                    )}

                    {coupon?.terms_note && (
                      <div className="p-2 bg-white rounded-2 border small">
                        <span className="text-muted d-block mb-1">Terms:</span>
                        <span className="text-secondary" style={{ fontSize: "11px" }}>{coupon.terms_note}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary w-100 py-2 rounded-3"
                    onClick={onClose}
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
