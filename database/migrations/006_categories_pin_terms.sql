-- Migration 006: Add category, security_pin, and terms_note
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'OTHER';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS security_pin VARCHAR(50);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS terms_note VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons(category);
