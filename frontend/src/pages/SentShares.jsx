import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";

export default function SentShares() {

  const [shares, setShares] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadShares();

  }, []);

  const loadShares = async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await api.get(
          "/sent-shares",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setShares(
        response.data
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        Sent Shares
      </h1>

      <hr />

      {shares.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <div style={{ fontSize: "40px" }} className="mb-2">📤</div>
          <h5 className="fw-semibold text-dark">No sent shares</h5>
          <p className="text-muted small">Coupons you send to friends will be tracked here.</p>
        </div>
      ) : (
        <div className="row g-3">
          {shares.map((share) => (
            <div key={share.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <CouponLogo title={share.coupon_title} size={42} />
                    <span className={`badge-soft ${
                      share.status === "ACCEPTED" ? "badge-soft-success" :
                      share.status === "REJECTED" ? "badge-soft-danger" : "badge-soft-warning"
                    }`}>
                      {share.status || "PENDING"}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2" style={{ fontSize: "16px" }}>
                    {share.coupon_title}
                  </h5>

                  <p className="text-muted small mb-2">
                    <strong>Recipient:</strong> {share.receiver_email}
                  </p>

                  <div className="text-muted small" style={{ fontSize: "12px" }}>
                    Sent on {new Date(share.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>

  );

}
