import { useEffect, useState } from "react";

import api from "../services/api";

export default function ExpiryDashboard() {

  const [data, setData] =
    useState(null);

  useEffect(() => {

    loadExpiryData();

  }, []);

  const loadExpiryData =
    async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await api.get(
          "/expiry-dashboard",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setData(
        response.data
      );

    } catch (error) {

      console.log(error);

    }

  };

  if (!data) {

    return null;

  }

  return (

    <div
      className="
        card
        p-3
        mb-4
      "
    >

      <h3>
        Coupon Expiry Dashboard
      </h3>

      <hr />

      <div className="row">

        <div className="col-md-4">

          <div
            className="
              alert
              alert-warning
            "
          >

            <h5>
              Expiring Today
            </h5>

            <h2>
              {
                data.expiring_today
                  .length
              }
            </h2>

          </div>

        </div>

        <div className="col-md-4">

          <div
            className="
              alert
              alert-info
            "
          >

            <h5>
              Next 7 Days
            </h5>

            <h2>
              {
                data.expiring_soon
                  .length
              }
            </h2>

          </div>

        </div>

        <div className="col-md-4">

          <div
            className="
              alert
              alert-danger
            "
          >

            <h5>
              Expired
            </h5>

            <h2>
              {
                data.expired
                  .length
              }
            </h2>

          </div>

        </div>

      </div>

      {
        data.expiring_today
          .length > 0 && (

          <>

            <h5>
              Expiring Today
            </h5>

            {
              data.expiring_today
                .map(
                  coupon => (

                    <p
                      key={
                        coupon.id
                      }
                    >

                      ⚠️

                      {" "}

                      {
                        coupon.title
                      }

                    </p>

                  )
                )
            }

          </>

        )
      }

      {
        data.expiring_soon
          .length > 0 && (

          <>

            <h5>
              Expiring Within 7 Days
            </h5>

            {
              data.expiring_soon
                .map(
                  coupon => (

                    <p
                      key={
                        coupon.id
                      }
                    >

                      📅

                      {" "}

                      {
                        coupon.title
                      }

                    </p>

                  )
                )
            }

          </>

        )
      }

      {
        data.expired
          .length > 0 && (

          <>

            <h5>
              Expired Coupons
            </h5>

            {
              data.expired
                .map(
                  coupon => (

                    <p
                      key={
                        coupon.id
                      }
                    >

                      ❌

                      {" "}

                      {
                        coupon.title
                      }

                    </p>

                  )
                )
            }

          </>

        )
      }

    </div>

  );

}
