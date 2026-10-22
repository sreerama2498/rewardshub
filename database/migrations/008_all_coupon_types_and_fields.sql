-- Migration 008: Add additional fields for complete taxonomy support (Cashback, Subscription, Tiered)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS cashback_amount INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS subscription_period VARCHAR(100);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS tier_details VARCHAR(255);
