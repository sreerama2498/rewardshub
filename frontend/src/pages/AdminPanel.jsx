import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import CouponLogo from "../components/CouponLogo";
import { toast } from "react-toastify";

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [dashboardView, setDashboardView] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredLogs =
    activityFilter === "ALL"
      ? logs
      : logs.filter((log) => log.category === activityFilter);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/audit-logs")
      ]);

      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin telemetry data");
    } finally {
      setLoading(false);
    }
  };

  const viewCoupons = async (userId, userName) => {
    try {
      const response = await api.get(`/admin/user/${userId}/coupons`);
      setSelectedCoupons(response.data);
      setSelectedUser(userName);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user coupons");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const response = await api.delete(`/admin/user/${userId}`);
      toast.success(response.data.message || "User deleted");
      loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    }
  };

  const disableUser = async (userId) => {
    try {
      const response = await api.put(`/admin/user/${userId}/disable`, {});
      toast.success(response.data.message || "User disabled");
      loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to disable user");
    }
  };

  const enableUser = async (userId) => {
    try {
      const response = await api.put(`/admin/user/${userId}/enable`, {});
      toast.success(response.data.message || "User enabled");
      loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to enable user");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredUsers = users
    .filter((user) => {
      if (dashboardView === "ADMINS") return user.role === "ADMIN";
      if (dashboardView === "ACTIVE") return user.is_active;
      if (dashboardView === "DISABLED") return !user.is_active;
      return true;
    })
    .filter((user) => {
      const s = search.toLowerCase();
      return user.name?.toLowerCase().includes(s) || user.email?.toLowerCase().includes(s);
    });

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Header Banner */}
      <div
        className="card mb-4 border-0 text-white overflow-hidden shadow-md"
        style={{
          background: "linear-gradient(135deg, #1e1e2f 0%, #2d2b55 100%)",
          borderRadius: "18px"
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                👑 Super Admin
              </span>
              <span className="text-white-50 small">System Control Center</span>
            </div>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: "26px" }}>
              Enterprise Administration Console
            </h2>
            <p className="text-white-50 mb-0 small">
              Manage permissions, monitor system security audit logs, and inspect accounts
            </p>
          </div>
          <button className="btn btn-outline-light btn-sm" onClick={loadAdminData}>
            🔄 Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Metric Widgets */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Users", val: stats?.total_users || 0, view: "ALL", icon: "👥", bg: "#eef2ff" },
          { label: "Admins", val: stats?.admin_users || 0, view: "ADMINS", icon: "👑", bg: "#fffbeb" },
          { label: "Active", val: stats?.active_users || 0, view: "ACTIVE", icon: "🟢", bg: "#ecfdf5" },
          { label: "Disabled", val: stats?.disabled_users || 0, view: "DISABLED", icon: "🔴", bg: "#fef2f2" },
          { label: "Total Coupons", val: stats?.total_coupons || 0, view: null, icon: "🎟️", bg: "#fdf4ff" },
          { label: "Total Shares", val: stats?.total_shares || 0, view: null, icon: "🤝", bg: "#ecfeff" },
        ].map((m, idx) => (
          <div key={idx} className="col-6 col-md-4 col-lg-2">
            <div
              className={`stat-widget ${dashboardView === m.view ? "border-primary shadow-sm" : ""}`}
              style={{ padding: "16px", cursor: m.view ? "pointer" : "default" }}
              onClick={() => m.view && setDashboardView(m.view)}
            >
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">{m.label}</span>
                <span className="p-1 rounded" style={{ background: m.bg, fontSize: "14px" }}>{m.icon}</span>
              </div>
              <div className="stat-number fs-4">{m.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Management Section */}
      <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: "#f1f5f9" }}>
            <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "19px" }}>
              User Accounts & Governance
            </h4>
            <div className="input-group" style={{ maxWidth: "340px" }}>
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                className="form-control form-control-sm border-start-0"
                placeholder="Filter by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-muted small">No users found under current filter</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-bold text-dark">{u.name}</div>
                        <div className="text-muted small">ID: #{u.id}</div>
                      </td>
                      <td className="text-muted small">{u.email}</td>
                      <td>
                        <span className={`badge-soft ${u.role === "ADMIN" ? "badge-soft-warning" : "badge-soft-primary"}`}>
                          {u.role === "ADMIN" ? "👑 Admin" : "Member"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-soft ${u.is_active ? "badge-soft-success" : "badge-soft-danger"}`}>
                          {u.is_active ? "● Active" : "● Disabled"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary py-1 px-2"
                            style={{ fontSize: "12px" }}
                            onClick={() => viewCoupons(u.id, u.name)}
                          >
                            Coupons
                          </button>
                          {u.role !== "ADMIN" && (
                            <>
                              {u.is_active ? (
                                <button
                                  className="btn btn-sm btn-outline-warning py-1 px-2"
                                  style={{ fontSize: "12px" }}
                                  onClick={() => disableUser(u.id)}
                                >
                                  Disable
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-success py-1 px-2"
                                  style={{ fontSize: "12px" }}
                                  onClick={() => enableUser(u.id)}
                                >
                                  Enable
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                style={{ fontSize: "12px" }}
                                onClick={() => deleteUser(u.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Selected User Coupons Modal Card */}
      {selectedUser && (
        <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-dark mb-0">Coupons owned by {selectedUser}</h5>
              <button className="btn btn-sm btn-light" onClick={() => setSelectedUser(null)}>✕ Close</button>
            </div>
            {selectedCoupons.length === 0 ? (
              <p className="text-muted small mb-0">This user has not registered any coupons yet.</p>
            ) : (
              <div className="row g-3">
                {selectedCoupons.map((c) => (
                  <div key={c.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card p-3 shadow-sm border" style={{ borderRadius: "12px" }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <CouponLogo title={c.title} size={32} />
                        <h6 className="fw-bold mb-0 text-dark text-truncate">{c.title}</h6>
                      </div>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>Code: <code>{c.coupon_code}</code></span>
                        <span className="fw-bold text-success">₹{c.coupon_value || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Section */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: "#f1f5f9" }}>
            <div>
              <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px" }}>
                Security & Operational Audit Trail 📜
              </h4>
              <p className="text-muted small mb-0">
                Immutable record of user logins, role modifications, and coupon transfers
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-semibold">Filter:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
              >
                <option value="ALL">All Event Types</option>
                <option value="AUTH">Authentication Events</option>
                <option value="COUPON">Coupon Events</option>
                <option value="ADMIN">Administrative Events</option>
                <option value="OTHER">Other Operations</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-4 text-muted small">No audit logs matching selection</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
                  style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className={`badge-soft ${
                      log.category === "AUTH" ? "badge-soft-primary" :
                      log.category === "COUPON" ? "badge-soft-warning" :
                      log.category === "ADMIN" ? "badge-soft-danger" : "badge-soft-secondary"
                    }`} style={{ minWidth: "70px", justifyContent: "center" }}>
                      {log.category}
                    </span>
                    <div>
                      <span className="fw-bold text-dark me-2 small">{log.action}:</span>
                      <span className="text-secondary small">{log.details}</span>
                    </div>
                  </div>
                  <span className="text-muted small" style={{ fontSize: "11px" }}>
                    🕒 {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
