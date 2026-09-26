import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ExpiryDashboard from "../components/ExpiryDashboard";
import Modal from "react-bootstrap/Modal";

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // ✅ Replaced activityFilter with two new filter states
  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [activityTypeFilter, setActivityTypeFilter] =
    useState("ALL");

  const navigate = useNavigate();

  // ✅ Updated filter logic using both filters
  const filteredActivities =
    activities.filter(activity => {

      const categoryMatch =
        categoryFilter === "ALL" ||
        activity.category === categoryFilter;

      const typeMatch =
        activityTypeFilter === "ALL" ||
        activity.action === activityTypeFilter;

      return categoryMatch && typeMatch;

    });

  // ✅ Dynamic type options based on selected category
  const getTypeOptions = () => {

    if (categoryFilter === "COUPON") {
      return (
        <>
          <option value="ALL">All Coupon Activities</option>
          <option value="CREATE_COUPON">Coupon Created</option>
          <option value="UPDATE_COUPON">Coupon Updated</option>
          <option value="DELETE_COUPON">Coupon Deleted</option>
          <option value="EXPIRE_COUPON">Coupon Expired</option>
          <option value="REDEEM_COUPON">Coupon Redeemed</option>
          <option value="REQUEST_COUPON">Coupon Requested</option>
          <option value="APPROVE_COUPON">Coupon Approved</option>
          <option value="REJECT_COUPON">Coupon Rejected</option>
        </>
      );
    }

    if (categoryFilter === "SHARING") {
      return (
        <>
          <option value="ALL">All Sharing Activities</option>
          <option value="SHARE_COUPON">Coupon Shared</option>
          <option value="ACCEPT_SHARE">Share Accepted</option>
          <option value="REJECT_SHARE">Share Rejected</option>
          <option value="CANCEL_SHARE">Share Cancelled</option>
        </>
      );
    }

    if (categoryFilter === "USER") {
      return (
        <>
          <option value="ALL">All User Activities</option>
          <option value="USER_REGISTERED">New User Registered</option>
          <option value="PROFILE_UPDATED">Profile Updated</option>
          <option value="PASSWORD_CHANGED">Password Changed</option>
          <option value="USER_DISABLED">User Disabled</option>
          <option value="USER_ENABLED">User Enabled</option>
        </>
      );
    }

    if (categoryFilter === "NOTIFICATION") {
      return (
        <>
          <option value="ALL">All Notification Activities</option>
          <option value="NOTIFICATION_SENT">Notification Sent</option>
          <option value="NOTIFICATION_READ">Notification Read</option>
          <option value="EXPIRY_REMINDER">Expiry Reminder Sent</option>
        </>
      );
    }

    if (categoryFilter === "ADMIN") {
      return (
        <>
          <option value="ALL">All Admin Activities</option>
          <option value="PROMOTE_ADMIN">User Promoted To Admin</option>
          <option value="ADMIN_DISABLE_USER">User Disabled</option>
          <option value="ADMIN_ENABLE_USER">User Enabled</option>
          <option value="SYSTEM_CLEANUP">System Cleanup Performed</option>
        </>
      );
    }

    return null;

  };

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const token = localStorage.getItem("token");

        const userResponse = await api.get(
          "/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setUser(userResponse.data);

        try {

          const statsResponse = await api.get(
            "/stats",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setStats(statsResponse.data);

        } catch (error) {

          console.log("Stats API not available");

        }

        try {

          const activityResponse = await api.get(
            "/activity",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setActivities(
            activityResponse.data
          );

        } catch (error) {

          console.log("Activity API not available");

        }

      } catch (error) {

        console.log(error);

        localStorage.removeItem("token");

        navigate("/");

      }

    };

    loadDashboard();

  }, []);

  const openStatsModal = async (
    type,
    title
  ) => {

    console.log("CLICKED:", type);

    setModalTitle(title);
    setModalData([]);
    setModalLoading(true);
    setShowModal(true);

    try {

      const token =
        localStorage.getItem("token");

      console.log("Calling:", `/stats/${type}`);

      const response =
        await api.get(
          `/stats/${type}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      console.log("Response:", response.data);

      setModalData(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(error);

      setModalData([]);

    } finally {

      setModalLoading(false);

    }

  };

  if (!user) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container mt-4">

      <Navbar />

      {/* Welcome Banner */}
      <div
        className="card mb-4 border-0 text-white overflow-hidden position-relative shadow-md"
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
          borderRadius: "18px"
        }}
      >
        <div className="card-body p-4 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-white text-dark fw-bold px-2 py-1 rounded-pill">
                  {user.role === "ADMIN" ? "👑 Admin Account" : "✨ Member"}
                </span>
                <span className="text-white-50 small">ID: #{user.id}</span>
              </div>
              <h2 className="text-white fw-bold mb-1" style={{ fontSize: "28px" }}>
                Welcome back, {user.name}! 👋
              </h2>
              <p className="text-white-50 mb-3">
                {user.email} • Track, share, and redeem your rewards effortlessly
              </p>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white bg-opacity-10 px-3 py-1 rounded-3 border border-white border-opacity-20">
                  <span className="text-white-50 small d-block" style={{ fontSize: "11px" }}>WALLET BALANCE</span>
                  <span className="fw-bold text-white fs-6">💳 ₹{user.wallet_balance || 0}</span>
                </div>
                <div className="bg-white bg-opacity-10 px-3 py-1 rounded-3 border border-white border-opacity-20">
                  <span className="text-white-50 small d-block" style={{ fontSize: "11px" }}>EARNINGS CREDITED</span>
                  <span className="fw-bold text-white fs-6">💰 ₹{user.total_earned || 0}</span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <button
                className="btn btn-outline-light fw-bold"
                onClick={() => navigate("/profile")}
                title="Manage Wallet, UPI & Bank Details"
              >
                💳 Wallet & Banking
              </button>
              <button
                className="btn btn-light fw-bold"
                onClick={() => navigate("/my-coupons")}
              >
                + Add Coupon
              </button>
              {user.role === "ADMIN" && (
                <button
                  className="btn btn-warning fw-bold"
                  onClick={() => navigate("/admin")}
                >
                  👑 Admin Panel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: "20px" }}>
          Platform Overview
        </h3>
        <span className="text-muted small">Click any metric for details</span>
      </div>

      <div className="row mb-4 g-3">
        <div className="col-6 col-md-3">
          <div
            className="stat-widget"
            onClick={() => openStatsModal("users", "Total Registered Users")}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Total Users</span>
              <span className="p-2 rounded-3" style={{ background: "#eef2ff", fontSize: "16px" }}>👥</span>
            </div>
            <div className="stat-number">{stats?.total_users || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="stat-widget"
            onClick={() => openStatsModal("coupons", "Total Available Coupons")}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Coupons</span>
              <span className="p-2 rounded-3" style={{ background: "#fdf4ff", fontSize: "16px" }}>🎟️</span>
            </div>
            <div className="stat-number">{stats?.total_coupons || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="stat-widget"
            onClick={() => openStatsModal("shares", "Total Shared Coupons")}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Shares</span>
              <span className="p-2 rounded-3" style={{ background: "#ecfeff", fontSize: "16px" }}>🤝</span>
            </div>
            <div className="stat-number">{stats?.total_shares || 0}</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="stat-widget"
            onClick={() => openStatsModal("accepted", "Accepted Coupon Shares")}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Accepted</span>
              <span className="p-2 rounded-3" style={{ background: "#ecfdf5", fontSize: "16px" }}>✅</span>
            </div>
            <div className="stat-number">{stats?.accepted_shares || 0}</div>
          </div>
        </div>
      </div>

      <ExpiryDashboard />

      <h2 className="mb-3">
        Recent Activity
      </h2>

      {/* ✅ Filter 1: Category dropdown */}
      <div className="row mb-3">

        <div className="col-md-4">

          <label className="form-label fw-bold">
            Category
          </label>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setActivityTypeFilter("ALL");
            }}
          >
            <option value="ALL">All Activities</option>
            <option value="COUPON">Coupons</option>
            <option value="SHARING">Sharing</option>
            <option value="USER">Users</option>
            <option value="NOTIFICATION">Notifications</option>
            <option value="ADMIN">Admin</option>
          </select>

        </div>

        {/* ✅ Filter 2: Dynamic type dropdown */}
        {
          categoryFilter !== "ALL" && (

            <div className="col-md-4">

              <label className="form-label fw-bold">
                Activity Type
              </label>

              <select
                className="form-select"
                value={activityTypeFilter}
                onChange={(e) =>
                  setActivityTypeFilter(
                    e.target.value
                  )
                }
              >
                {getTypeOptions()}
              </select>

            </div>

          )
        }

      </div>

      {/* ✅ Render filteredActivities */}
      {
        filteredActivities.length === 0 ? (

          <div className="alert alert-info">
            No activity available.
          </div>

        ) : (

          filteredActivities.map(
            (activity, index) => (

              <div
                key={index}
                className="card mb-3 shadow-sm"
              >

                <div className="card-body">

                  <h5>
                    {activity.type}
                  </h5>

                  <p>
                    {activity.title}
                  </p>

                  <small className="text-muted">
                    {
                      activity.created_at
                        ? new Date(
                            activity.created_at
                          ).toLocaleString()
                        : "No Timestamp"
                    }
                  </small>

                </div>

              </div>

            )
          )

        )
      }

      <h2 className="mt-4 mb-3">
        Quick Actions
      </h2>

      <div className="d-flex gap-2 flex-wrap">

        <button
          className="btn btn-primary"
          onClick={() => navigate("/my-coupons")}
        >
          My Coupons
        </button>

        <button
          className="btn btn-success"
          onClick={() => navigate("/shared-with-me")}
        >
          Shared Coupons
        </button>

        <button
          className="btn btn-warning"
          onClick={() => navigate("/users")}
        >
          Users
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>

      </div>

      {/* Stats Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
      >

        <Modal.Header closeButton>
          <Modal.Title>
            {modalTitle}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {
            modalLoading ? (

              <p>Loading...</p>

            ) : modalData.length === 0 ? (

              <p>No records found.</p>

            ) : (

              <div className="table-responsive">

                <table
                  className="table table-bordered table-striped"
                >

                  <thead className="table-dark">
                    <tr>
                      {
                        Object.keys(modalData[0]).map(key => (
                          <th key={key}>{key}</th>
                        ))
                      }
                    </tr>
                  </thead>

                  <tbody>
                    {
                      modalData.map((row, index) => (
                        <tr key={index}>
                          {
                            Object.values(row).map(
                              (value, idx) => (
                                <td key={idx}>
                                  {String(value ?? "")}
                                </td>
                              )
                            )
                          }
                        </tr>
                      ))
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
