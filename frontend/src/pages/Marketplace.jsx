import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import CouponLogo from "../components/CouponLogo";

import { toast } from "react-toastify";

export default function Marketplace() {

  const [coupons, setCoupons] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [purchasedReceipt, setPurchasedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const [couponsRes, walletRes] = await Promise.all([
        api.get("/marketplace"),
        api.get("/wallet").catch(() => ({ data: null }))
      ]);

      setCoupons(Array.isArray(couponsRes.data) ? couponsRes.data : []);
      if (walletRes.data) {
        setWallet(walletRes.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed To Load Marketplace");
    } finally {
      setLoading(false);
    }
  };

  const requestCoupon = async (couponId) => {
    try {
      const response = await api.post(`/request-coupon/${couponId}`, {});

      setPurchasedReceipt(response.data);
      toast.success(response.data.message);
      loadMarketplace();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.detail || "Request Failed"
      );
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <Navbar />
        <h3>Loading Marketplace...</h3>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <Navbar />

      {/* Header Banner with Business Rules & Wallet Status */}
      <div
        className="card mb-4 border-0 text-white overflow-hidden shadow-md"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "18px"
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary px-3 py-1 rounded-pill">
                Fair Trade Marketplace
              </span>
              <span className="text-white-50 small">Instant Claim & Automated Settlement</span>
            </div>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: "26px" }}>
              Coupon Marketplace 🛒
            </h2>
            <p className="text-white-50 mb-0 small">
              Request high-value coupons at <strong>25% of face value</strong>. 
              Owner receives <strong>20% payout</strong> automatically, and <strong>5% platform fee</strong> covers secure settlement.
            </p>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-3">
            {/* Split Badges */}
            <div className="d-flex gap-2 bg-dark bg-opacity-50 p-2 rounded-3 border border-secondary border-opacity-25">
              <div className="text-center px-3 py-1 border-end border-secondary border-opacity-25">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>YOU PAY</span>
                <span className="fw-bold text-warning fs-6">25%</span>
              </div>
              <div className="text-center px-3 py-1 border-end border-secondary border-opacity-25">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>OWNER GETS</span>
                <span className="fw-bold text-success fs-6">20%</span>
              </div>
              <div className="text-center px-3 py-1">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>FEE</span>
                <span className="fw-bold text-info fs-6">5%</span>
              </div>
            </div>

            {/* Wallet balance pill */}
            {wallet && (
              <div className="bg-success bg-opacity-10 border border-success border-opacity-25 p-2 px-3 rounded-3 text-end">
                <span className="text-white-50 small d-block" style={{ fontSize: "11px" }}>WALLET BALANCE</span>
                <span className="fw-bold text-white fs-6">💳 ₹{wallet.wallet_balance}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instant Purchase Receipt Banner */}
      {purchasedReceipt && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm p-4 mb-4 rounded-4" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="fw-bold text-success mb-0">🎉 Coupon Unlocked & Transferred!</h5>
            <button type="button" className="btn-close" onClick={() => setPurchasedReceipt(null)}></button>
          </div>
          <p className="mb-2 text-dark">
            Coupon Code: <span className="badge bg-success fs-6 px-3 py-1 font-monospace">{purchasedReceipt.coupon_code}</span>
            <span className="text-muted small ms-2">(Added to your <strong>My Coupons</strong> list)</span>
          </p>
          <div className="d-flex flex-wrap gap-3 small text-secondary">
            <span>Transaction: <strong>{purchasedReceipt.transaction_id}</strong></span>
            <span>Paid (25%): <strong className="text-dark">₹{purchasedReceipt.total_price}</strong></span>
            <span>Credited to Owner (20%): <strong className="text-success">₹{purchasedReceipt.owner_payout}</strong></span>
            <span>Platform Fee (5%): <strong className="text-info">₹{purchasedReceipt.platform_fee}</strong></span>
            <span>Remaining Balance: <strong className="text-dark">₹{purchasedReceipt.wallet_balance}</strong></span>
          </div>
        </div>
      )}

      <div className="row g-3">

        {
          coupons.length === 0 && (
            <div className="col-12">
              <div className="card text-center p-5 border-dashed">
                <div style={{ fontSize: "40px" }} className="mb-2">🛒</div>
                <h5 className="fw-semibold text-dark">No marketplace coupons available</h5>
                <p className="text-muted small">Check back soon or share your own unused coupons to earn rewards.</p>
              </div>
            </div>
          )
        }

        {
          coupons.map((coupon) => {
            const val = coupon.coupon_value || 0;
            const totalPrice = coupon.total_price ?? Math.round(val * 0.25);
            const ownerPayout = coupon.owner_payout ?? Math.round(val * 0.20);
            const platformFee = coupon.platform_fee ?? Math.round(val * 0.05);

            return (
              <div className="col-12 col-md-6 col-lg-4" key={coupon.id}>
                <div className="card h-100 card-coupon shadow-sm">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Header */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <CouponLogo
                          title={coupon.title}
                          sourceApp={coupon.source_app}
                          description={coupon.description}
                          size={46}
                        />
                        <span className="badge-soft badge-soft-primary">
                          {coupon.source_app}
                        </span>
                      </div>

                      <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "17px", lineHeight: "1.3" }}>
                        {coupon.title}
                      </h5>
                      {coupon.description && (
                        <p className="text-muted small mb-3" style={{ fontSize: "13px" }}>
                          {coupon.description}
                        </p>
                      )}

                      {/* Face Value & Total to Pay */}
                      <div className="coupon-ticket-notch mb-3 d-flex align-items-center justify-content-between">
                        <div>
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>Coupon Value</span>
                          <span className="fw-bold text-dark fs-5">₹{val}</span>
                        </div>
                        <div className="text-end">
                          <span className="text-muted small d-block" style={{ fontSize: "11px", textTransform: "uppercase" }}>You Pay (25%)</span>
                          <span className="fw-bold text-warning fs-5">₹{totalPrice}</span>
                        </div>
                      </div>

                      {/* Transparent 20% / 5% Breakdown Pill */}
                      <div className="p-2 rounded-2 mb-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                        <div className="d-flex justify-content-between text-secondary mb-1">
                          <span>Owner Payout (20%):</span>
                          <strong className="text-success">₹{ownerPayout}</strong>
                        </div>
                        <div className="d-flex justify-content-between text-secondary">
                          <span>Convenience & Platform Fee (5%):</span>
                          <strong className="text-muted">₹{platformFee}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-100 py-2 mt-2"
                      onClick={() => requestCoupon(coupon.id)}
                    >
                      Request & Pay ₹{totalPrice}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }

      </div>

    </div>

  );

}
