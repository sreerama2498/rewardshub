import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, meRes] = await Promise.all([
          api.get("/users"),
          api.get("/me").catch(() => ({ data: null }))
        ]);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        if (meRes.data) {
          setCurrentUser(meRes.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load community members");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCopyEmail = (userEmail) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(userEmail);
    }
    toast.success(`Copied ${userEmail} to clipboard! Paste it into 'My Coupons' to share a gift.`);
  };

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
            const isMe = currentUser && currentUser.id === user.id;
            const initials = user.name
              ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
              : "U";

            return (
              <div key={user.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`card h-100 shadow-sm border-0 ${isMe ? "border-primary" : ""}`}
                  style={{
                    borderRadius: "16px",
                    border: isMe ? "2px solid #6366f1" : "1px solid #e2e8f0",
                    backgroundColor: isMe ? "#f8faff" : "#ffffff"
                  }}
                >
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-white shadow-sm"
                        style={{
                          width: "50px",
                          height: "50px",
                          background: isMe
                            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                          fontSize: "17px"
                        }}
                      >
                        {initials}
                      </div>

                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex align-items-center justify-content-between mb-1 gap-1">
                          <h6 className="fw-bold text-dark text-truncate mb-0" style={{ fontSize: "16px" }}>
                            {user.name}
                          </h6>
                          {isMe ? (
                            <span className="badge bg-success" style={{ fontSize: "10px" }}>
                              You
                            </span>
                          ) : (
                            <span className="badge-soft badge-soft-primary" style={{ fontSize: "11px" }}>
                              #{user.id}
                            </span>
                          )}
                        </div>
                        <p className="text-muted small text-truncate mb-1" style={{ fontSize: "13px" }}>
                          {user.email}
                        </p>
                        <span className="badge-soft badge-soft-success" style={{ fontSize: "10px" }}>
                          ● Active Member
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-top border-light d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-3"
                        style={{ fontSize: "12px", borderRadius: "8px" }}
                        onClick={() => handleCopyEmail(user.email)}
                        title="Copy email to share coupon"
                      >
                        📋 Copy Email
                      </button>
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
