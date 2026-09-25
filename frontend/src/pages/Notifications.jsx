import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL"); // ALL, UNREAD, READ

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success("Notification marked as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update notification");
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => api.put(`/notifications/${n.id}/read`)));
      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.is_read;
    if (filter === "READ") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ fontSize: "24px" }}>
            Notifications & Alerts 🔔
          </h2>
          <p className="text-muted small mb-0">
            Real-time updates regarding your coupon shares, claims, and expiry reminders
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary btn-sm py-2 px-3" onClick={markAllRead}>
              ✓ Mark All Read
            </button>
          )}
          <button className="btn btn-light btn-sm py-2 px-3" onClick={loadNotifications}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          className={`btn btn-sm ${filter === "ALL" ? "btn-primary" : "btn-light text-secondary"}`}
          onClick={() => setFilter("ALL")}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${filter === "UNREAD" ? "btn-primary" : "btn-light text-secondary"}`}
          onClick={() => setFilter("UNREAD")}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`btn btn-sm ${filter === "READ" ? "btn-primary" : "btn-light text-secondary"}`}
          onClick={() => setFilter("READ")}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="card text-center p-5 border-dashed">
          <div style={{ fontSize: "40px" }} className="mb-2">🎉</div>
          <h5 className="fw-semibold text-dark">All caught up!</h5>
          <p className="text-muted small">You don't have any notifications under this filter.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className={`card shadow-sm border-0 position-relative ${
                !notification.is_read ? "border-start border-4 border-primary" : ""
              }`}
              style={{
                borderRadius: "14px",
                background: !notification.is_read ? "#fdfefe" : "#ffffff",
                border: "1px solid #e2e8f0"
              }}
            >
              <div className="card-body p-4 d-flex align-items-start justify-content-between gap-3">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: "44px",
                      height: "44px",
                      background: !notification.is_read ? "#eef2ff" : "#f1f5f9",
                      fontSize: "20px"
                    }}
                  >
                    {!notification.is_read ? "✨" : "📩"}
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "16px" }}>
                        {notification.title}
                      </h6>
                      {!notification.is_read && (
                        <span className="badge-soft badge-soft-primary" style={{ fontSize: "11px" }}>
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-muted small mb-2" style={{ fontSize: "14px" }}>
                      {notification.message}
                    </p>

                    <span className="text-muted small" style={{ fontSize: "12px" }}>
                      🕒 {notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                </div>

                {!notification.is_read && (
                  <button
                    className="btn btn-outline-primary btn-sm flex-shrink-0"
                    style={{ fontSize: "13px" }}
                    onClick={() => markRead(notification.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
