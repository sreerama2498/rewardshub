import { useState } from "react";
import { COUPON_TYPES_GUIDE, CATEGORIES_GUIDE } from "../utils/couponTaxonomy";

export default function CouponKnowledgeModal({ isOpen, onClose, onSelectType }) {
  const [activeTab, setActiveTab] = useState("TYPES"); // 'TYPES' | 'CATEGORIES'
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredTypes = COUPON_TYPES_GUIDE.filter(t =>
    t.friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.technicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.example.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = CATEGORIES_GUIDE.filter(c =>
    c.friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.popularBrands.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1060
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header text-white p-3 px-4 border-0"
            style={{ background: "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fs-3">💡</span>
              <div>
                <h5 className="modal-title fw-bold mb-0">Coupon & Category Knowledge Guide</h5>
                <small className="text-light opacity-75" style={{ fontSize: "12px" }}>
                  Understand every coupon mechanism and industry category with zero confusion
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Navigation Bar & Search */}
          <div className="p-3 bg-light border-bottom d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "TYPES" ? "btn-primary shadow-sm fw-bold" : "btn-outline-secondary bg-white"}`}
                onClick={() => setActiveTab("TYPES")}
              >
                🏷️ 10 Coupon Types Explained
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "CATEGORIES" ? "btn-primary shadow-sm fw-bold" : "btn-outline-secondary bg-white"}`}
                onClick={() => setActiveTab("CATEGORIES")}
              >
                🏢 10 Categories & Brands
              </button>
            </div>

            <div className="input-group input-group-sm" style={{ maxWidth: "260px" }}>
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search offers, brands, terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ maxHeight: "65vh" }}>
            {activeTab === "TYPES" ? (
              <div className="d-flex flex-column gap-3">
                <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-2 rounded-3 border-0" style={{ background: "#eff6ff", color: "#1e40af" }}>
                  <span>ℹ️</span>
                  <span>
                    <strong>Unsure which type to choose?</strong> Look at what the offer gives you at checkout and pick the matching card below.
                  </span>
                </div>

                {filteredTypes.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-3 border transition-all"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-3 p-2 bg-light rounded-circle">{t.icon}</span>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-dark">{t.friendlyName}</h6>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "10px" }}>
                              System: {t.id}
                            </span>
                          </div>
                          <small className="text-primary fw-medium" style={{ fontSize: "12px" }}>
                            {t.tagline}
                          </small>
                        </div>
                      </div>

                      {onSelectType && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1"
                          onClick={() => {
                            onSelectType(t.id);
                            onClose();
                          }}
                        >
                          Use This Type ➔
                        </button>
                      )}
                    </div>

                    <p className="text-muted small mb-2" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                      {t.explanation}
                    </p>

                    <div className="row g-2 pt-2 border-top" style={{ fontSize: "11px" }}>
                      <div className="col-12 col-md-6">
                        <span className="text-dark fw-bold">🛒 Real Example: </span>
                        <span className="text-success fw-medium">{t.example}</span>
                      </div>
                      <div className="col-12 col-md-6">
                        <span className="text-dark fw-bold">🎯 Best For: </span>
                        <span className="text-secondary">{t.bestFor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-2 rounded-3 border-0" style={{ background: "#eff6ff", color: "#1e40af" }}>
                  <span>🏢</span>
                  <span>
                    Categories help buyers discover your coupon on the marketplace. You can also just type your brand name and the app will auto-detect it for you!
                  </span>
                </div>

                {filteredCategories.map(c => (
                  <div
                    key={c.id}
                    className="p-3 rounded-3 border"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fs-3 p-2 bg-light rounded-circle">{c.icon}</span>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{c.friendlyName}</h6>
                        <small className="text-muted" style={{ fontSize: "12px" }}>
                          {c.description}
                        </small>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="fw-bold text-dark small" style={{ fontSize: "11px" }}>Common Brands: </span>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {c.popularBrands.map(b => (
                          <span
                            key={b}
                            className="badge bg-light text-dark border px-2 py-1"
                            style={{ fontSize: "11px", fontWeight: "normal" }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 bg-light rounded-2 small text-secondary" style={{ fontSize: "11px" }}>
                      <strong>Typical Offers: </strong> {c.sampleOffers}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light p-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm px-4 rounded-3"
              onClick={onClose}
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
