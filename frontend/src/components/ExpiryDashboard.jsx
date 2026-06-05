import { useEffect, useState } from "react";

import api from "../services/api";

import Modal from "react-bootstrap/Modal";

export default function ExpiryDashboard() {

  const [data, setData] =
    useState(null);

  // ✅ Modal state variables
  const [showModal, setShowModal] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalCoupons, setModalCoupons] =
    useState([]);

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

  // ✅ openModal function
  const openModal = (
    title,
    coupons
  ) => {

    setModalTitle(title);

    setModalCoupons(
      coupons
    );

    setShowModal(true);

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

        {/* ✅ Expiring Today - clickable */}
        <div className="col-md-4">

          <div
            className="
              alert
              alert-warning
            "
            style={{
              cursor: "pointer"
            }}
            onClick={() =>
              openModal(
                "Expiring Today",
                data.expiring_today
              )
            }
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

        {/* ✅ Expiring Soon - clickable */}
        <div className="col-md-4">

          <div
            className="
              alert
              alert-info
            "
            style={{
              cursor: "pointer"
            }}
            onClick={() =>
              openModal(
                "Next 7 Days",
                data.expiring_soon
              )
            }
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

        {/* ✅ Expired - clickable */}
        <div className="col-md-4">

          <div
            className="
              alert
              alert-danger
            "
            style={{
              cursor: "pointer"
            }}
            onClick={() =>
              openModal(
                "Expired",
                data.expired
              )
            }
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

      {/* ✅ Modal */}
      <Modal
        show={showModal}
        onHide={() =>
          setShowModal(false)
        }
        size="lg"
      >

        <Modal.Header closeButton>

          <Modal.Title>
            {modalTitle}
          </Modal.Title>

        </Modal.Header>

        <Modal.Body>

          {
            modalCoupons.length === 0 ? (

              <p>
                No coupons found
              </p>

            ) : (

              modalCoupons.map(
                coupon => (

                  <div
                    key={coupon.id}
                    className="
                      border
                      rounded
                      p-2
                      mb-2
                    "
                  >

                    <h6>
                      {coupon.title}
                    </h6>

                    <p className="mb-0">
                      <strong>
                        Code:
                      </strong>

                      {" "}

                      {coupon.coupon_code}
                    </p>

                    <small
                      className="text-muted"
                    >
                      <strong>
                        Expires:
                      </strong>

                      {" "}

                      {
                        coupon.expiry_date
                          ? coupon.expiry_date
                          : "No expiry date"
                      }
                    </small>

                  </div>

                )
              )

            )
          }

        </Modal.Body>

      </Modal>

    </div>

  );

}
