-- Migration 007: Add dynamic coupon discount mechanisms, channels, and eligibility
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'FLAT_AMOUNT';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount_cap INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_value INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS bogo_details VARCHAR(255);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_gift_details VARCHAR(255);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS distribution_channel VARCHAR(50) DEFAULT 'DIGITAL';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'ALL_USERS';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_structure VARCHAR(50) DEFAULT 'SINGLE_USE';
CREATE INDEX IF NOT EXISTS idx_coupons_discount_type ON coupons(discount_type);
CREATE INDEX IF NOT EXISTS idx_coupons_distribution_channel ON coupons(distribution_channel);
