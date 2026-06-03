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

      {
        shares.length === 0 ? (

          <div
            className="
              alert
              alert-info
            "
          >
            No shared coupons.
          </div>

        ) : (

          shares.map((share) => (

            <div
              key={share.id}
              className="
                card
                mb-3
                shadow-sm
              "
            >

              <div
                className="card-body"
              >

                <h5>
                  Share Request #
                  {share.id}
                </h5>

                <p>

                  <strong>
                    Status:
                  </strong>

                  {" "}

                  {share.status}

                </p>

                <button
                  className="
                    btn
                    btn-success
                    me-2
                  "
                  onClick={() =>
                    acceptShare(
                      share.id
                    )
                  }
                >
                  Accept
                </button>

                <button
                  className="
                    btn
                    btn-danger
                  "
                  onClick={() =>
                    rejectShare(
                      share.id
                    )
                  }
                >
                  Reject
                </button>

              </div>

            </div>

          ))

        )
      }

    </div>

  );

}
