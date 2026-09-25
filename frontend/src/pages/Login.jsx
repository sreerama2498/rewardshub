import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
            <label className="form-label fw-semibold small text-secondary">
              Password
            </label>
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
    </div>
  );
}
