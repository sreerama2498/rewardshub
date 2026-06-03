import { useEffect, useState } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const [expiryDate, setExpiryDate] = useState("");

  const [receiverEmail, setReceiverEmail] =
    useState("");

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
              receiverEmail
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

      <div className="card p-4 mb-4">

        <h3>
          Create Coupon
        </h3>

        <input
          className="form-control mb-2"
          placeholder="Title"
          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }
        />

        <input
          className="form-control mb-2"
          placeholder="Description"
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          className="form-control mb-2"
          placeholder="Source App"
          onChange={(e) =>
            setSourceApp(
              e.target.value
            )
          }
        />

        <input
          className="form-control mb-2"
          placeholder="Coupon Code"
          onChange={(e) =>
            setCouponCode(
              e.target.value
            )
          }
        />

        <input
          type="date"
          className="form-control mb-3"
          onChange={(e) =>
            setExpiryDate(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-primary"
          onClick={createCoupon}
        >
          Create Coupon
        </button>

      </div>

      <div className="card p-3 mb-4">

        <h4>
          Search & Filters
        </h4>

        <input
          className="form-control mb-2"
          placeholder="Search Coupon"
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          className="form-select"
          onChange={(e) =>
            setSourceFilter(
              e.target.value
            )
          }
        >

          <option value="">
            All Sources
          </option>

          {
            uniqueSources.map(
              (source) => (

                <option
                  key={source}
                  value={source}
                >
                  {source}
                </option>

              )
            )
          }

        </select>

      </div>

      <h2>
        Available Coupons
      </h2>

      {
        filteredCoupons.length === 0 ? (

          <div className="alert alert-info">
            No Coupons Found
          </div>

        ) : (

          filteredCoupons.map(
            (coupon) => {

              const expired =

                coupon.expiry_date &&

                new Date(
                  coupon.expiry_date
                ) < new Date();

              return (

                <div
                  key={coupon.id}
                  className={`card mb-3 ${
                    expired
                      ? "border-danger"
                      : ""
                  }`}
                >

                  <div
                    className="card-body"
                  >

                    <h4>
                      {coupon.title}
                    </h4>

                    <p>
                      {
                        coupon.description
                      }
                    </p>

                    <p>

                      <strong>
                        Source:
                      </strong>

                      {" "}

                      {
                        coupon.source_app
                      }

                    </p>

                    <p>

                      <strong>
                        Coupon:
                      </strong>

                      {" "}

                      {
                        coupon.coupon_code
                      }

                    </p>

                    <p>

                      <strong>
                        Expiry:
                      </strong>

                      {" "}

                      {
                        coupon.expiry_date
                      }

                    </p>

                    {
                      expired && (

                        <span
                          className="
                          badge
                          bg-danger
                        "
                        >
                          Expired
                        </span>

                      )
                    }

                    <hr />

                    <input
                      className="
                        form-control
                        mb-2
                      "
                      placeholder="
                        Receiver Email
                      "
                      onChange={(e) =>
                        setReceiverEmail(
                          e.target.value
                        )
                      }
                    />

                    <button
                      className="
                        btn
                        btn-success
                      "
                      onClick={() =>
                        shareCoupon(
                          coupon.id
                        )
                      }
                    >
                      Share Coupon
                    </button>

                  </div>

                </div>

              );

            }
          )

        )
      }

    </div>

  );

}
