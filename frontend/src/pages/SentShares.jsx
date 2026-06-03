import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

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

      {
        shares.length === 0

        ? (

            <div
              className="
                alert
                alert-info
              "
            >
              No Sent Shares
            </div>

          )

        : (

            shares.map(
              (share) => (

                <div
                  key={share.id}
                  className="
                    card
                    mb-3
                    shadow-sm
                  "
                >

                  <div
                    className="
                      card-body
                    "
                  >

                    <h5>
                      {
                        share.coupon_title
                      }
                    </h5>

                    <p>

                      <strong>
                        Receiver:
                      </strong>

                      {" "}

                      {
                        share.receiver_email
                      }

                    </p>

                    <p>

                      <strong>
                        Status:
                      </strong>

                      {" "}

                      {
                        share.status
                      }

                    </p>

                    <p>

                      <strong>
                        Sent:
                      </strong>

                      {" "}

                      {
                        new Date(
                          share.created_at
                        ).toLocaleString()
                      }

                    </p>

                    <p>

                      <strong>
                        Last Update:
                      </strong>

                      {" "}

                      {
                        new Date(
                          share.updated_at
                        ).toLocaleString()
                      }

                    </p>

                  </div>

                </div>

              )
            )

          )
      }

    </div>

  );

}
