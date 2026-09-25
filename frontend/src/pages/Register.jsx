import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const register = async (e) => {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.warning("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/register", {
        name,
        email,
        password
      });

      toast.success("Account created successfully! Please sign in.");
      navigate("/");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Registration Failed";
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
            <span style={{ fontSize: "32px" }}>🚀</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ color: "#0f172a", fontSize: "28px" }}>
            Get Started
          </h2>
          <p className="text-muted small">
            Create your RewardsHub account in seconds
          </p>
        </div>

        {/* Form */}
        <form onSubmit={register}>
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary">
              Full Name
            </label>
            <input
              className="form-control"
              placeholder="e.g. Sreeram Ragipati"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              Password (min. 8 characters)
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
          <span className="text-muted small me-2">Already have an account?</span>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate("/")}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
