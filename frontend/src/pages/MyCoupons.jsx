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

  const loadCoupons = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response = await api.get(
        "/my-coupons",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

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

  const createCoupon = async () => {

    try {

      const token =
        localStorage.getItem("token");

      await api.post(
        "/coupons",
        {
          title,
          description,
          source_app: sourceApp,
          coupon_code: couponCode,
          coupon_value:
          parseInt(couponValue, 10) || 0,
          expiry_date: expiryDate
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      toast.success(
        "Coupon Created"
      );

      setTitle("");
      setDescription("");
      setSourceApp("");
      setCouponCode("");
      setCouponValue("");
      setExpiryDate("");

      loadCoupons();

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Create Coupon"
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

    </div>

  );

}
