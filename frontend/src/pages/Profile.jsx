import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/profile");
      setName(response.data.name || "");
      setEmail(response.data.email || "");
      setCreatedAt(response.data.created_at || "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!name || !email) {
      toast.warning("Name and email cannot be empty");
      return;
    }
    setUpdatingProfile(true);
    try {
      const response = await api.put("/profile", { name, email });
      toast.success(response.data.message || "Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Profile update failed");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const changePassword = async (e) => {
    if (e) e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.warning("Please fill in current and new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.warning("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("New passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.put("/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success(response.data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Password change failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const initials = name
    ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Profile Header Card */}
      <div
        className="card mb-4 border-0 text-white overflow-hidden shadow-md"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: "18px"
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-white shadow"
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                fontSize: "24px"
              }}
            >
              {initials}
            </div>
            <div>
              <h3 className="fw-bold mb-1 text-white">{name}</h3>
              <p className="text-white-50 mb-0 small">{email}</p>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-secondary text-white px-3 py-2 rounded-pill small">
              Member Since: {createdAt ? new Date(createdAt).toLocaleDateString() : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Personal Information */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px" }}>
              Personal Information 👤
            </h4>
            <p className="text-muted small mb-4">
              Update your account details and contact email
            </p>

            <form onSubmit={updateProfile}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Full Name
                </label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-secondary">
                  Email Address
                </label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2"
                disabled={updatingProfile}
              >
                {updatingProfile ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Password */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px" }}>
              Security & Credentials 🔒
            </h4>
            <p className="text-muted small mb-4">
              Change your password to keep your reward coupons safe
            </p>

            <form onSubmit={changePassword}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-secondary">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-warning w-100 py-2 text-white fw-bold"
                disabled={updatingPassword}
              >
                {updatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
