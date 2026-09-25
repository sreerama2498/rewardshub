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
          coupons.map(
            (coupon) => (

              <div
                className="col-md-4 mb-3"
                key={coupon.id}
              >

                <div className="card h-100">

                  <div className="card-body">

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <CouponLogo
                        title={coupon.title}
                        sourceApp={coupon.source_app}
                        description={coupon.description}
                        size={36}
                      />
                      <h5 className="mb-0">
                        {coupon.title}
                      </h5>
                    </div>

                    <p>
                      {coupon.description}
                    </p>

                    <p>

                      <strong>
                        Source:
                      </strong>

                      {" "}

                      {coupon.source_app}

                    </p>

                    <p>

                      <strong>
                        Coupon Value:
                      </strong>

                      {" "}

                      ₹{coupon.coupon_value}

                    </p>

                    <p>

                      <strong>
                        Owner Reward:
                      </strong>

                      {" "}

                      ₹{coupon.reward_amount}

                    </p>

                    <p>

                      <strong>
                        Status:
                      </strong>

                      {" "}

                      {coupon.status}

                    </p>

                    <button
                      className="
                        btn
                        btn-success
                      "
                      onClick={() =>
                        requestCoupon(
                          coupon.id
                        )
                      }
                    >

                      Request Coupon

                    </button>

                  </div>

                </div>

              </div>

            )
          )
        }

      </div>

    </div>

  );

}
