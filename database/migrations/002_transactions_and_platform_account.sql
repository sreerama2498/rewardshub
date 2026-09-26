ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance FLOAT DEFAULT 1000.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earned FLOAT DEFAULT 0.0;

ALTER TABLE coupon_requests ADD COLUMN IF NOT EXISTS total_price INTEGER DEFAULT 0;
ALTER TABLE coupon_requests ADD COLUMN IF NOT EXISTS owner_payout INTEGER DEFAULT 0;
ALTER TABLE coupon_requests ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS platform_account (
    id SERIAL PRIMARY KEY,
    balance FLOAT DEFAULT 0.0,
    total_volume FLOAT DEFAULT 0.0,
    total_transactions INTEGER DEFAULT 0,
    account_name VARCHAR DEFAULT 'RewardsHub Platform Account',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_account (id, balance, total_volume, total_transactions, account_name)
VALUES (1, 0.0, 0.0, 0, 'RewardsHub Platform Account')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR UNIQUE NOT NULL,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    total_amount FLOAT DEFAULT 0.0,
    owner_payout FLOAT DEFAULT 0.0,
    platform_fee FLOAT DEFAULT 0.0,
    owner_upi VARCHAR,
    status VARCHAR DEFAULT 'COMPLETED',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
