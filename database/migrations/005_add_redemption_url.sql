-- Migration 005: Add redemption_url and allow nullable coupon_code for direct redeem links
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS redemption_url VARCHAR(2048);
ALTER TABLE coupons ALTER COLUMN coupon_code DROP NOT NULL;
