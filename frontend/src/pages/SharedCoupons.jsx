import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
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
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge-soft badge-soft-primary">
                        Share #{share.id}
                      </span>
                      <span className={`badge-soft ${
                        share.status === "ACCEPTED" ? "badge-soft-success" :
                        share.status === "REJECTED" ? "badge-soft-danger" : "badge-soft-warning"
                      }`}>
                        {share.status || "PENDING"}
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-1">
                      Incoming Coupon Gift
                    </h5>
                    <p className="text-muted small mb-3">
                      A coupon was shared with your account.
                    </p>
                  </div>

                  {share.status === "PENDING" && (
                    <div className="d-flex gap-2 pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
                      <button
                        className="btn btn-primary flex-grow-1 btn-sm py-2"
                        onClick={() => acceptShare(share.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm px-3"
                        onClick={() => rejectShare(share.id)}
                      >
                        Decline
                      </button>
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
