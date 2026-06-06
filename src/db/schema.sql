CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    category TEXT NOT NULL,
    currency TEXT NOT NULL,
    merchant_raw TEXT NOT NULL,
    merchant_canon TEXT NOT NULL,
    is_refund BOOLEAN DEFAULT FALSE,
    is_transfer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funds (
    fund_id text NOT NULL,
    fund_name TEXT NOT NULL,
    nav_date DATE NOT NULL,
    nav NUMERIC(14,4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (fund_id, nav_date)
);

CREATE TABLE IF NOT EXISTS holdings (
    holding_id TEXT PRIMARY KEY,
    fund_id TEXT NOT NULL,
    fund_name TEXT NOT NULL,
    units NUMERIC(14,4) NOT NULL,
    purchase_nav NUMERIC(14,4) NOT NULL,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE IF NOT EXISTS merchant_canonicals (
  merchant_raw   TEXT PRIMARY KEY,
  merchant_canon TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_merchant_canonicals_raw ON merchant_canonicals(merchant_raw);
CREATE INDEX IF NOT EXISTS idx_merchant_canonicals_canon ON merchant_canonicals(merchant_canon);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_canon);

CREATE INDEX IF NOT EXISTS idx_funds_name ON funds(fund_name);
CREATE INDEX IF NOT EXISTS idx_funds_date ON funds(nav_date);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(fund_id);