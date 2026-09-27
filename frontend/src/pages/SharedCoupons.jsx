import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";
import { toast } from "react-toastify";

export default function SharedCoupons() {

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadShares = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response = await api.get(
        "/shared-with-me",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      setShares(response.data);

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed to load shared coupons"
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadShares();

  }, []);

  const acceptShare = async (
    shareId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      await api.post(
        `/accept-share/${shareId}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      toast.success("Coupon Accepted");

      loadShares();

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed to accept coupon"
      );

    }

  };

  const rejectShare = async (
    shareId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      await api.post(
        `/reject-share/${shareId}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      toast.success(
        "Coupon Rejected"
      );

      loadShares();

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed to reject coupon"
      );

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        Shared Coupons
      </h1>

      <hr />

      {shares.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <div style={{ fontSize: "40px" }} className="mb-2">📥</div>
          <h5 className="fw-semibold text-dark">No shared coupons yet</h5>
          <p className="text-muted small">Coupons shared by other users with your email will appear here.</p>
        </div>
      ) : (
        <div className="row g-3">
          {shares.map((share) => (
            <div key={share.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <CouponLogo
                        title={share.coupon_title}
                        sourceApp={share.source_app}
                        description={share.coupon_description}
                        size={44}
                      />
                      <div className="d-flex flex-column align-items-end gap-1">
                        <span className={`badge-soft ${
                          share.status === "ACCEPTED" ? "badge-soft-success" :
                          share.status === "REJECTED" ? "badge-soft-danger" : "badge-soft-warning"
                        }`}>
                          {share.status || "PENDING"}
                        </span>
                        {share.source_app && (
                          <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill small" style={{ fontSize: "10px" }}>
                            {share.source_app}
                          </span>
                        )}
                      </div>
                    </div>

                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "16px" }}>
                      {share.coupon_title || "Shared Coupon Gift"}
                    </h5>
                    {share.coupon_description && (
                      <p className="text-muted small mb-2" style={{ fontSize: "12px" }}>
                        {share.coupon_description}
                      </p>
                    )}

                    <div className="p-2 mb-3 rounded-2 text-dark" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "11px" }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">From:</span>
                        <strong>{share.sender_name || "A friend"} ({share.sender_email})</strong>
                      </div>
                      {share.coupon_value > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Face Value:</span>
                          <strong className="text-success">₹{share.coupon_value}</strong>
                        </div>
                      )}
                      {share.expiry_date && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Expires:</span>
                          <strong>{share.expiry_date}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {share.status === "PENDING" ? (
                    <div className="d-flex gap-2 pt-2 border-top" style={{ borderColor: "#f1f5f9" }}>
                      <button
                        className="btn btn-primary flex-grow-1 btn-sm py-2 fw-semibold"
                        onClick={() => acceptShare(share.id)}
                      >
                        🎁 Accept Gift
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm px-3"
                        onClick={() => rejectShare(share.id)}
                      >
                        Decline
                      </button>
                    </div>
                  ) : share.status === "ACCEPTED" ? (
                    <div className="text-center pt-2 border-top">
                      <span className="text-success small fw-semibold">
                        ✓ Added to your My Coupons!
                      </span>
                    </div>
                  ) : (
                    <div className="text-center pt-2 border-top">
                      <span className="text-muted small">
                        Offer declined
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>

  );

}
