import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      String(u.id).includes(s)
    );
  });

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ fontSize: "24px" }}>
            Community Directory 👥
          </h2>
          <p className="text-muted small mb-0">
            Connect and share coupons with fellow RewardsHub members
          </p>
        </div>
        <div className="text-end">
          <span className="badge-soft badge-soft-primary px-3 py-2 fw-semibold">
            {users.length} Active Members
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-3 mb-4 border-0 shadow-sm" style={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                className="form-control border-start-0"
                placeholder="Search by name, email, or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end text-muted small">
            Showing {filteredUsers.length} of {users.length} members
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading member directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <div style={{ fontSize: "40px" }} className="mb-2">👤</div>
          <h5 className="fw-semibold text-dark">No members found</h5>
          <p className="text-muted small">Try searching with a different name or email.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredUsers.map((user) => {
            // Generate initials avatar
            const initials = user.name
              ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
              : "U";

            return (
              <div key={user.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                  <div className="card-body p-4 d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-white shadow-sm"
                      style={{
                        width: "52px",
                        height: "52px",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                        fontSize: "18px"
                      }}
                    >
                      {initials}
                    </div>

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="fw-bold text-dark text-truncate mb-0" style={{ fontSize: "16px" }}>
                          {user.name}
                        </h6>
                        <span className="badge-soft badge-soft-primary" style={{ fontSize: "11px" }}>
                          #{user.id}
                        </span>
                      </div>
                      <p className="text-muted small text-truncate mb-2" style={{ fontSize: "13px" }}>
                        {user.email}
                      </p>
                      <span className="badge-soft badge-soft-success" style={{ fontSize: "11px" }}>
                        ● Active Member
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
