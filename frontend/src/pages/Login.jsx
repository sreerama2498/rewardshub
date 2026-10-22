import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const login = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.warning("Please fill in both email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login", {
        email,
        password
      });

      localStorage.setItem("token", response.data.access_token);
      toast.success("Welcome back to RewardsHub!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Invalid Email or Password";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotEmail(email);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setShowForgotModal(true);
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotNewPassword) {
      toast.warning("Please enter your email and new password.");
      return;
    }
    if (forgotNewPassword.length < 8) {
      toast.warning("New password must be at least 8 characters long.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.warning("Passwords do not match. Please re-enter.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api.post("/forgot-password", {
        email: forgotEmail,
        new_password: forgotNewPassword
      });

      toast.success(response.data?.message || "Password reset successfully!");
      setEmail(forgotEmail);
      setPassword(forgotNewPassword);
      setShowForgotModal(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Failed to reset password. Please verify your email.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
            style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #eef2ff, #f3e8ff)" }}
          >
            <span style={{ fontSize: "32px" }}>🎁</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ color: "#0f172a", fontSize: "28px" }}>
            Welcome Back
          </h2>
          <p className="text-muted small">
            Sign in to manage and share your reward coupons
          </p>
        </div>

        {/* Form */}
        <form onSubmit={login}>
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary">
              Email Address
            </label>
            <input
              className="form-control"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold small text-secondary mb-0">
                Password
              </label>
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none small text-primary fw-semibold"
                style={{ fontSize: "13px" }}
                onClick={handleOpenForgot}
              >
                Forgot Password?
              </button>
            </div>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mb-3"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
          <span className="text-muted small me-2">Don't have an account?</span>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate("/register")}
          >
            Create an Account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div className="modal-header bg-primary text-white border-0 py-3">
                <h5 className="modal-title fw-bold fs-6">
                  🔐 Reset Your Password
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                ></button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-4">
                    Enter your registered email address and choose a new password (minimum 8 characters) to regain access to your account.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-secondary">
                      Registered Email Address
                    </label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-secondary">
                      New Password
                    </label>
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold small text-secondary">
                      Confirm New Password
                    </label>
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
