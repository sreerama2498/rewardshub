import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";
import api from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role) {
          setUserRole(payload.role);
        }
      }
    } catch (e) {
      console.error("Token decode error:", e);
    }

    api.get("/me")
      .then((res) => {
        if (res.data?.role) {
          setUserRole(res.data.role);
        }
        if (res.data?.wallet_balance !== undefined) {
          setWalletBalance(res.data.wallet_balance);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "My Coupons", path: "/my-coupons", icon: "🎟️" },
    { label: "Marketplace", path: "/marketplace", icon: "🛒" },
    { label: "Received", path: "/shared-with-me", icon: "📥" },
    { label: "Sent", path: "/sent-shares", icon: "📤" },
    { label: "Community", path: "/users", icon: "👥" },
    { label: "Profile", path: "/profile", icon: "👤" },
  ];

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm mb-4 px-4 py-2 sticky-top" style={{ borderColor: "#e2e8f0" }}>
      <div className="container-fluid px-0">
        {/* Brand */}
        <span
          className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 mb-0"
          style={{ cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          onClick={() => navigate("/dashboard")}
        >
          <span>🎁</span>
          <span>RewardsHub</span>
        </span>

        {/* Navigation links */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`btn btn-sm ${
                isActive(item.path)
                  ? "btn-primary text-white"
                  : "btn-light text-secondary border-0"
              }`}
              style={{
                borderRadius: "10px",
                padding: "7px 14px",
                fontSize: "14px",
                fontWeight: isActive(item.path) ? "600" : "500"
              }}
              onClick={() => navigate(item.path)}
            >
              <span className="me-1">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Admin Panel button */}
          {userRole === "ADMIN" && (
            <button
              className={`btn btn-sm ${
                isActive("/admin")
                  ? "btn-warning text-dark fw-bold"
                  : "btn-outline-warning text-dark fw-semibold"
              }`}
              style={{ borderRadius: "10px", padding: "7px 14px", fontSize: "14px" }}
              onClick={() => navigate("/admin")}
            >
              👑 Admin Panel
            </button>
          )}

          {/* Wallet Balance Badge */}
          {walletBalance !== null && (
            <button
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 fw-bold"
              style={{
                borderRadius: "10px",
                padding: "6px 13px",
                fontSize: "13px",
                background: "#f0fdf4",
                borderColor: "#bbf7d0"
              }}
              onClick={() => navigate("/profile")}
              title="RewardsHub Wallet Balance - Click to view or add funds"
            >
              <span>💳</span>
              <span>₹{Number(walletBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </button>
          )}

          {/* Notification Badge */}
          <div className="ms-1">
            <NotificationBadge />
          </div>

          {/* Logout */}
          <button
            className="btn btn-sm btn-outline-danger ms-2"
            style={{ borderRadius: "10px", padding: "7px 14px", fontSize: "14px" }}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
