import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

import { toast } from "react-toastify";

export default function AdminPanel() {

  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [logs, setLogs] =
    useState([]);

  const [activityFilter,
  setActivityFilter] =
    useState("ALL");

  const [dashboardView,
    setDashboardView] =
      useState("ALL");

  const [search, setSearch] =
    useState("");

  const [selectedCoupons,
    setSelectedCoupons] =
      useState([]);

  const [selectedUser,
    setSelectedUser] =
      useState(null);

  const filteredLogs =
  activityFilter === "ALL"
    ? logs
    : logs.filter(
        (log) =>
          log.category ===
          activityFilter
      );

  useEffect(() => {

    loadAdminData();

  }, []);

  const loadAdminData = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const headers = {
        Authorization:
          `Bearer ${token}`
      };

      const statsResponse =
        await api.get(
          "/admin/stats",
          { headers }
        );

      setStats(
        statsResponse.data
      );

      const usersResponse =
        await api.get(
          "/admin/users",
          { headers }
        );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );

      const logsResponse =
        await api.get(
          "/admin/audit-logs",
          { headers }
        );

      setLogs(
        Array.isArray(logsResponse.data)
          ? logsResponse.data
          : []
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Admin Data"
      );

    } finally {

      setLoading(false);

    }

  };

  const viewCoupons = async (
    userId,
    userName
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          `/admin/user-coupons/${userId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setSelectedCoupons(
        response.data
      );

      setSelectedUser(
        userName
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Coupons"
      );

    }

  };

  const deleteUser = async (
    userId
  ) => {

    const confirmed =
      window.confirm(
        "Delete this user?"
      );

    if (!confirmed) {

      return;

    }

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.delete(
          `/admin/user/${userId}`,
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

      loadAdminData();

    } catch (error) {

      console.log(error);

      toast.error(
        "Delete Failed"
      );

    }

  };

  const disableUser = async (
    userId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.put(
          `/admin/user/${userId}/disable`,
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

      loadAdminData();

    } catch (error) {

      console.log(error);

      toast.error(
        "Disable Failed"
      );

    }

  };

  const enableUser = async (
    userId
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.put(
          `/admin/user/${userId}/enable`,
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

      loadAdminData();

    } catch (error) {

      console.log(error);

      toast.error(
        "Enable Failed"
      );

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  const filteredUsers =

    users
      .filter((user) => {

        if (
          dashboardView ===
          "ADMINS"
        ) {
          return (
            user.role ===
            "ADMIN"
          );
        }

        if (
          dashboardView ===
          "ACTIVE"
        ) {
          return (
            user.is_active
          );
        }

        if (
          dashboardView ===
          "DISABLED"
        ) {
          return (
            !user.is_active
          );
        }

        return true;

      })
      .filter(
        (user) =>

          user.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )

          ||

          user.email
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        Admin Console
      </h1>

      <hr />

      {/* Statistics */}

      <div className="row mb-4">

        {/* ✅ Step 3: Total Users - clickable */}
        <div
          className="col-md-2"
          onClick={() =>
            setDashboardView(
              "ALL"
            )
          }
          style={{
            cursor: "pointer"
          }}
        >
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Total Users</h6>
              <h3>{stats?.total_users}</h3>
            </div>
          </div>
        </div>

        {/* ✅ Step 3: Admins - clickable */}
        <div
          className="col-md-2"
          onClick={() =>
            setDashboardView(
              "ADMINS"
            )
          }
          style={{
            cursor: "pointer"
          }}
        >
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Admins</h6>
              <h3>{stats?.admin_users}</h3>
            </div>
          </div>
        </div>

        {/* ✅ Step 3: Active - clickable */}
        <div
          className="col-md-2"
          onClick={() =>
            setDashboardView(
              "ACTIVE"
            )
          }
          style={{
            cursor: "pointer"
          }}
        >
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Active</h6>
              <h3>{stats?.active_users}</h3>
            </div>
          </div>
        </div>

        {/* ✅ Step 3: Disabled - clickable */}
        <div
          className="col-md-2"
          onClick={() =>
            setDashboardView(
              "DISABLED"
            )
          }
          style={{
            cursor: "pointer"
          }}
        >
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Disabled</h6>
              <h3>{stats?.disabled_users}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Coupons</h6>
              <h3>{stats?.total_coupons}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-2">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h6>Shares</h6>
              <h3>{stats?.total_shares}</h3>
            </div>
          </div>
        </div>

      </div>

      {/* Search */}

      <div className="card p-3 mb-4">

        <h3>
          Search Users
        </h3>

        <input
          className="form-control"
          placeholder="Search Name or Email"
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

      </div>

      {/* Users */}

      <div className="card p-3 mb-4">

        {/* ✅ Step 4: Dynamic section title */}
        <h3>
          {
            dashboardView ===
            "ALL"
              ? "All Users"
              : dashboardView ===
                "ADMINS"
              ? "Admin Users"
              : dashboardView ===
                "ACTIVE"
              ? "Active Users"
              : "Disabled Users"
          }
        </h3>

        {
          filteredUsers.map(
            (user) => (

              <div
                key={user.id}
                className="
                  border
                  rounded
                  p-3
                  mb-2
                "
              >

                <h5>
                  {user.name}
                </h5>

                <p>
                  {user.email}
                </p>

                <p>

                  <strong>
                    Role:
                  </strong>

                  {" "}

                  {user.role}

                </p>

                <p>

                  <strong>
                    Status:
                  </strong>

                  {" "}

                  {
                    user.is_active
                      ? "🟢 Active"
                      : "🔴 Disabled"
                  }

                </p>

                <button
                  className="
                    btn
                    btn-primary
                    me-2
                  "
                  onClick={() =>
                    viewCoupons(
                      user.id,
                      user.name
                    )
                  }
                >
                  View Coupons
                </button>

                {
                  user.role !==
                  "ADMIN" && (

                    <>

                      {user.is_active ? (

                        <button
                          className="
                            btn
                            btn-warning
                            me-2
                          "
                          onClick={() =>
                            disableUser(
                              user.id
                            )
                          }
                        >
                          Disable User
                        </button>

                      ) : (

                        <button
                          className="
                            btn
                            btn-success
                            me-2
                          "
                          onClick={() =>
                            enableUser(
                              user.id
                            )
                          }
                        >
                          Enable User
                        </button>

                      )}

                      <button
                        className="
                          btn
                          btn-danger
                        "
                        onClick={() =>
                          deleteUser(
                            user.id
                          )
                        }
                      >
                        Delete User
                      </button>

                    </>

                  )
                }

              </div>

            )
          )
        }

      </div>

      {/* User Coupons */}

      {
        selectedUser && (

          <div
            className="
              card
              p-3
              mb-4
            "
          >

            <h3>

              Coupons of

              {" "}

              {selectedUser}

            </h3>

            <hr />

            {
              selectedCoupons
                .length === 0

                ? (

                    <p>
                      No Coupons
                    </p>

                  )

                : (

                    selectedCoupons
                      .map(
                        (coupon) => (

                          <div
                            key={
                              coupon.id
                            }
                            className="
                              border
                              rounded
                              p-2
                              mb-2
                            "
                          >

                            <h5>
                              {
                                coupon.title
                              }
                            </h5>

                            <p>
                              {
                                coupon.coupon_code
                              }
                            </p>

                          </div>

                        )
                      )

                  )
            }

          </div>

        )
      }

      {/* Audit Logs - Filter */}

      <div className="card p-3 mb-3">

        <h5>
          Activity Filter
        </h5>

        <select
          className="form-select"
          value={activityFilter}
          onChange={(e) =>
            setActivityFilter(
              e.target.value
            )
          }
        >

          <option value="ALL">
            All Activities
          </option>

          <option value="AUTH">
            Authentication
          </option>

          <option value="COUPON">
            Coupons
          </option>

          <option value="ADMIN">
            Admin
          </option>

          <option value="OTHER">
            Other
          </option>

        </select>

      </div>

      {/* Audit Logs */}

      <div
        className="
          card
          p-3
          mb-5
        "
      >

        <h3>
          Audit Logs
        </h3>

        <hr />

        {
          filteredLogs.length === 0

          ? (

              <p>
                No Audit Logs
              </p>

            )

          : (

              filteredLogs.map(
                (log) => (

                  <div
                    key={log.id}
                    className="
                      border-start
                      border-4
                      ps-3
                      mb-3
                    "
                  >

                    <div className="mb-2">

                      <span
                        className={
                          log.category === "AUTH"
                            ? "badge bg-primary"
                            : log.category === "COUPON"
                            ? "badge bg-warning text-dark"
                            : log.category === "ADMIN"
                            ? "badge bg-danger"
                            : "badge bg-secondary"
                        }
                      >
                        {log.category}
                      </span>

                    </div>

                    <h6>
                      {log.action}
                    </h6>

                    <p>
                      {log.details}
                    </p>

                    <small
                      className="
                        text-muted
                      "
                    >
                      {
                        log.created_at
                          ? new Date(
                              log.created_at
                            ).toLocaleString()
                          : "No Timestamp"
                      }
                    </small>

                  </div>

                )
              )

            )
        }

      </div>

    </div>

  );

}
