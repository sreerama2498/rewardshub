-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_owner_id ON coupons(owner_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry_date ON coupons(expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupons_buyer_id ON coupons(buyer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_seller_id ON coupons(seller_id);

CREATE INDEX IF NOT EXISTS idx_coupon_shares_coupon_id ON coupon_shares(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_shares_sender_id ON coupon_shares(sender_id);
CREATE INDEX IF NOT EXISTS idx_coupon_shares_receiver_id ON coupon_shares(receiver_id);
CREATE INDEX IF NOT EXISTS idx_coupon_shares_status ON coupon_shares(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_coupon_id ON transactions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
