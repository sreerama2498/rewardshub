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

  // Payment / Settlement Details
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Wallet & Transactions
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topupLoading, setTopupLoading] = useState(false);

  // Security Credentials
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
      const [profileRes, walletRes] = await Promise.all([
        api.get("/profile"),
        api.get("/wallet").catch(() => ({ data: null }))
      ]);

      setName(profileRes.data.name || "");
      setEmail(profileRes.data.email || "");
      setCreatedAt(profileRes.data.created_at || "");
      setUpiId(profileRes.data.upi_id || "");
      setBankAccountNumber(profileRes.data.bank_account_number || "");
      setBankIfsc(profileRes.data.bank_ifsc || "");
      setBankName(profileRes.data.bank_name || "");

      if (walletRes.data) {
        setWalletBalance(walletRes.data.wallet_balance || 0);
        setTotalEarned(walletRes.data.total_earned || 0);
        setTransactions(Array.isArray(walletRes.data.transactions) ? walletRes.data.transactions : []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (amount) => {
    setTopupLoading(true);
    try {
      const res = await api.post("/wallet/topup", { amount });
      toast.success(res.data.message || `Added ₹${amount} successfully!`);
      loadProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Top-up failed");
    } finally {
      setTopupLoading(false);
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

  const updatePaymentDetails = async (e) => {
    if (e) e.preventDefault();
    setUpdatingPayment(true);
    try {
      const response = await api.put("/payment-details", {
        upi_id: upiId,
        bank_account_number: bankAccountNumber,
        bank_ifsc: bankIfsc,
        bank_name: bankName
      });
      toast.success(response.data.message || "Payout details saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update payout details");
    } finally {
      setUpdatingPayment(false);
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

  const hasPayoutConfigured = Boolean(upiId || bankAccountNumber);

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
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0 text-white">{name}</h3>
                {hasPayoutConfigured ? (
                  <span className="badge bg-success text-white px-2 py-1 rounded-pill small">
                    ✓ Payouts Ready
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark px-2 py-1 rounded-pill small">
                    ⚠️ Setup Banking Details
                  </span>
                )}
              </div>
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
        {/* Left Column: Personal Information & Password */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          {/* Personal Information */}
          <div className="card p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px" }}>
              Personal Profile 👤
            </h4>
            <p className="text-muted small mb-4">
              Update your basic display information and primary contact email
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
                {updatingProfile ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="card p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px" }}>
              Security & Credentials 🔒
            </h4>
            <p className="text-muted small mb-4">
              Change your password to secure account operations
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
                className="btn btn-outline-secondary w-100 py-2 fw-bold"
                disabled={updatingPassword}
              >
                {updatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Business Banking & UPI Details */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "19px" }}>
                Payout & Banking Accounts 💳
              </h4>
              <span className="badge-soft badge-soft-success">Verified Settlement</span>
            </div>
            <p className="text-muted small mb-4">
              Add your UPI VPA and Bank account details to receive reward redemptions and marketplace payouts
            </p>

            <form onSubmit={updatePaymentDetails}>
              {/* UPI ID Section */}
              <div className="mb-4 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize: "20px" }}>⚡</span>
                  <label className="form-label fw-bold text-dark mb-0">
                    Instant UPI Virtual Payment Address (VPA)
                  </label>
                </div>
                <input
                  className="form-control"
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <span className="text-muted small d-block mt-1" style={{ fontSize: "12px" }}>
                  Used for instant 1-click cashback & marketplace reward payouts
                </span>
              </div>

              {/* Direct Bank Account Section */}
              <div className="mb-4 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span style={{ fontSize: "20px" }}>🏦</span>
                  <label className="form-label fw-bold text-dark mb-0">
                    Direct Bank Account Details
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">
                    Bank Name
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">
                    Account Number
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. 50100234567890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold small text-secondary">
                    Bank IFSC Code
                  </label>
                  <input
                    className="form-control text-uppercase"
                    placeholder="e.g. HDFC0001234"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fs-6"
                disabled={updatingPayment}
              >
                {updatingPayment ? "Saving Payout Details..." : "💾 Save Payout & Banking Details"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Wallet, Auto-Payouts & Transaction History Section */}
      <div className="card mt-4 p-4 shadow-sm border-0" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: "#f1f5f9" }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "19px" }}>
                RewardsHub Wallet & Automatic Payouts 💰
              </h4>
              <span className="badge-soft badge-soft-primary">Instant Auto-Settlement</span>
            </div>
            <p className="text-muted small mb-0">
              When coupons are requested, <strong>20% owner payouts</strong> are credited automatically to your account and <strong>5% platform fee</strong> is settled seamlessly.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Quick Add Funds:</span>
            <button
              className="btn btn-outline-primary btn-sm fw-semibold"
              disabled={topupLoading}
              onClick={() => handleTopup(250)}
            >
              + ₹250
            </button>
            <button
              className="btn btn-outline-primary btn-sm fw-semibold"
              disabled={topupLoading}
              onClick={() => handleTopup(500)}
            >
              + ₹500
            </button>
            <button
              className="btn btn-outline-primary btn-sm fw-semibold"
              disabled={topupLoading}
              onClick={() => handleTopup(1000)}
            >
              + ₹1,000
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Available Wallet Balance</span>
                <span style={{ fontSize: "20px" }}>💳</span>
              </div>
              <h3 className="fw-bold text-success mb-0">₹{walletBalance}</h3>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Used for instant coupon purchases in marketplace
              </span>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Total Payouts Earned</span>
                <span style={{ fontSize: "20px" }}>📈</span>
              </div>
              <h3 className="fw-bold text-primary mb-0">₹{totalEarned}</h3>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Cumulative 20% coupon earnings automatically credited
              </span>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small fw-semibold">Primary Payout Destination</span>
                <span style={{ fontSize: "20px" }}>⚡</span>
              </div>
              <h5 className="fw-bold text-dark mb-0 text-truncate">
                {upiId ? `UPI: ${upiId}` : (bankAccountNumber ? `A/C: ••••${bankAccountNumber.slice(-4)}` : "Not Configured")}
              </h5>
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                {upiId ? "Instant settlement enabled" : "Configure above to direct-deposit"}
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <h5 className="fw-bold text-dark mb-3" style={{ fontSize: "16px" }}>
          Transaction & Settlement Ledger
        </h5>

        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted small bg-light rounded-3">
            No transactions recorded yet. Purchase or request coupons in the marketplace to start trading!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light text-muted small">
                <tr>
                  <th>DATE & TIME</th>
                  <th>TRANSACTION ID</th>
                  <th>TYPE</th>
                  <th>DESCRIPTION</th>
                  <th className="text-end">AMOUNT</th>
                  <th className="text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="small">
                {transactions.map((t) => {
                  const isCredit = t.type === "CREDIT" || t.type === "TOPUP";
                  return (
                    <tr key={t.id}>
                      <td className="text-muted">
                        {t.created_at ? new Date(t.created_at).toLocaleString() : "Just now"}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark font-monospace border">
                          {t.transaction_id}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-soft ${t.type === "CREDIT" ? "badge-soft-success" : (t.type === "TOPUP" ? "badge-soft-primary" : "badge-soft-danger")}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="text-secondary">{t.description}</td>
                      <td className={`text-end fw-bold ${isCredit ? "text-success" : "text-danger"}`}>
                        {isCredit ? `+₹${t.amount}` : `-₹${t.amount}`}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2">
                          ✓ {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
