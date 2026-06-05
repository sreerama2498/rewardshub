import { useEffect, useState } from "react";

import api from "../services/api";

import Modal from "react-bootstrap/Modal";

export default function ExpiryDashboard() {

  const [data, setData] =
    useState(null);

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

  const openModal = (
    title,
    coupons
  ) => {

    setModalTitle(title);

    setModalCoupons(coupons);

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

        {/* ✅ Expiring Today - updated */}
        <div className="col-md-4">

          <div
            className="alert alert-warning text-center shadow-sm"
            style={{
              cursor: "pointer",
              transition: "0.2s"
            }}
            onClick={() =>
              openModal(
                "Expiring Today",
                data.expiring_today
              )
            }
          >

            <h5>Expiring Today</h5>

            <h2>
              {data.expiring_today.length}
            </h2>

            <p className="mb-0">
              Click to view details
            </p>

          </div>

        </div>

        {/* ✅ Next 7 Days - updated */}
        <div className="col-md-4">

          <div
            className="alert alert-info text-center shadow-sm"
            style={{
              cursor: "pointer",
              transition: "0.2s"
            }}
            onClick={() =>
              openModal(
                "Next 7 Days",
                data.expiring_soon
              )
            }
          >

            <h5>Next 7 Days</h5>

            <h2>
              {data.expiring_soon.length}
            </h2>

            <p className="mb-0">
              Click to view details
            </p>

          </div>

        </div>

        {/* ✅ Expired - updated */}
        <div className="col-md-4">

          <div
            className="alert alert-danger text-center shadow-sm"
            style={{
              cursor: "pointer",
              transition: "0.2s"
            }}
            onClick={() =>
              openModal(
                "Expired Coupons",
                data.expired
              )
            }
          >

            <h5>Expired</h5>

            <h2>
              {data.expired.length}
            </h2>

            <p className="mb-0">
              Click to view details
            </p>

          </div>

        </div>

      </div>

      {/* ✅ Expiry Modal with table */}
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

              <p>No coupons found.</p>

            ) : (

              <div className="table-responsive">

                <table
                  className="table table-striped table-bordered"
                >

                  <thead className="table-dark">

                    <tr>
                      <th>ID</th>
                      <th>Coupon Title</th>
                      <th>Expiry Date</th>
                    </tr>

                  </thead>

                  <tbody>

                    {
                      modalCoupons.map(
                        coupon => (

                          <tr key={coupon.id}>

                            <td>{coupon.id}</td>

                            <td>{coupon.title}</td>

                            <td>{coupon.expiry_date}</td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
          }

        </Modal.Body>

      </Modal>

    </div>

  );

}
