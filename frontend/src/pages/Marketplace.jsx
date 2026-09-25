import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import CouponLogo from "../components/CouponLogo";

import { toast } from "react-toastify";

export default function Marketplace() {

  const [coupons, setCoupons] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadMarketplace();

  }, []);

  const loadMarketplace = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          "/marketplace",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setCoupons(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Marketplace"
      );

    } finally {

      setLoading(false);

    }

  };

  const requestCoupon = async (
    couponId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.post(
          `/request-coupon/${couponId}`,
          {},
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

      loadMarketplace();

    } catch (error) {

      console.log(error);

      toast.error(
        error?.response?.data?.detail
        ||
        "Request Failed"
      );

    }

  };

  if (loading) {

    return (

      <div className="container mt-4">

        <Navbar />

        <h3>
          Loading Marketplace...
        </h3>

      </div>

    );

  }

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        Coupon Marketplace
      </h1>

      <hr />

      <div className="row">

        {
          coupons.length === 0 && (

            <div className="alert alert-info">

              No coupons available.

            </div>

          )
        }

        {
          coupons.map((coupon) => (
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
                      <span className="badge-soft badge-soft-primary">
                        {coupon.source_app}
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "17px", lineHeight: "1.3" }}>
                      {coupon.title}
                    </h5>
                    {coupon.description && (
                      <p className="text-muted small mb-3" style={{ fontSize: "13px" }}>
                        {coupon.description}
                      </p>
                    )}

                    {/* Value Badge Box */}
                    <div className="coupon-ticket-notch mb-3 d-flex align-items-center justify-content-between">
                      <div>
                        <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Coupon Value</span>
                        <span className="fw-bold text-dark fs-5">₹{coupon.coupon_value || 0}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Owner Reward</span>
                        <span className="fw-bold text-primary fs-5">₹{coupon.reward_amount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-100 py-2 mt-2"
                    onClick={() => requestCoupon(coupon.id)}
                  >
                    Request Coupon
                  </button>
                </div>
              </div>
            </div>
          ))
        }

      </div>

    </div>

  );

}
