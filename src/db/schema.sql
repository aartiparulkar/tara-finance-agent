CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    category TEXT NOT NULL,
    currency TEXT NOT NULL,
    merchant_raw TEXT NOT NULL,
    merchant_normalized TEXT NOT NULL,
    is_refund BOOLEAN DEFAULT FALSE,
    is_transfer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funds (
    fund_id UUID PRIMARY KEY,
    fund_name TEXT NOT NULL,
    nav_date DATE NOT NULL,
    nav NUMERIC(14,4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holdings (
    holding_id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    fund_id UUID NOT NULL,
    units NUMERIC(14,4) NOT NULL,
    purchase_nav NUMERIC(14,4) NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_fund
      FOREIGN KEY(fund_id)
      REFERENCES funds(fund_id)
);

CREATE TABLE IF NOT EXISTS holdings (
    holding_id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    fund_id UUID NOT NULL,
    units NUMERIC(14,4) NOT NULL,
    purchase_nav NUMERIC(14,4) NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_fund
      FOREIGN KEY(fund_id)
      REFERENCES funds(fund_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant
ON transactions(merchant_normalized);

CREATE INDEX IF NOT EXISTS idx_funds_name
ON funds(fund_name);

CREATE INDEX IF NOT EXISTS idx_holdings_user
ON holdings(user_id);