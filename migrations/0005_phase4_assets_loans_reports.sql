CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id),
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  balance_cents INTEGER NOT NULL,
  rate_percent REAL NOT NULL,
  repayment_cents INTEGER NOT NULL,
  offset_account_id TEXT REFERENCES accounts(id),
  next_payment_date TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('personal', 'investment-property', 'business')),
  interest_deductible INTEGER NOT NULL DEFAULT 0 CHECK (interest_deductible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'property', 'investment', 'vehicle', 'other')),
  value_cents INTEGER NOT NULL,
  valuation_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liabilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit-card', 'loan', 'mortgage', 'tax', 'other')),
  balance_cents INTEGER NOT NULL,
  as_of_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_month TEXT NOT NULL UNIQUE,
  assets_cents INTEGER NOT NULL,
  liabilities_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_liabilities_type ON liabilities(type);
CREATE INDEX IF NOT EXISTS idx_loans_purpose ON loans(purpose);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_month ON net_worth_snapshots(snapshot_month);

INSERT OR IGNORE INTO loans (
  id, account_id, name, institution, balance_cents, rate_percent, repayment_cents,
  offset_account_id, next_payment_date, purpose, interest_deductible
) VALUES
  ('loan-investment', 'acc-loan', 'Investment Property Loan', 'Macquarie', 54120000, 6.19, 298000, 'acc-offset', '2026-06-04', 'investment-property', 1),
  ('loan-car', NULL, 'Vehicle Loan', 'Toyota Finance', 1840000, 7.45, 62000, NULL, '2026-05-28', 'personal', 0);

INSERT OR IGNORE INTO assets (id, name, institution, type, value_cents, valuation_date, notes) VALUES
  ('asset-property', 'Investment property valuation', 'Manual valuation', 'property', 77500000, '2026-05-12', 'Manual valuation used for net worth reporting'),
  ('asset-super', 'Superannuation balance', 'Manual valuation', 'investment', 8950000, '2026-05-12', 'Manual retirement asset placeholder'),
  ('asset-vehicle', 'Vehicle estimate', 'Manual valuation', 'vehicle', 2200000, '2026-05-12', 'Conservative resale estimate');

INSERT OR IGNORE INTO liabilities (id, name, institution, type, balance_cents, as_of_date, notes) VALUES
  ('liability-car-loan', 'Vehicle Loan', 'Toyota Finance', 'loan', 1840000, '2026-05-12', 'Manual liability not represented by a bank account');

INSERT OR IGNORE INTO tax_tags (id, name, description) VALUES
  ('tax-business', 'Business', 'Business deductible or partly deductible expense'),
  ('tax-investment-property', 'Investment property', 'Investment property income or expense review'),
  ('tax-bas', 'BAS', 'Business activity statement and GST related payments');

INSERT OR IGNORE INTO net_worth_snapshots (id, snapshot_month, assets_cents, liabilities_cents) VALUES
  ('nw-2025-07', '2025-07', 77800000, 59000000),
  ('nw-2025-08', '2025-08', 78650000, 58680000),
  ('nw-2025-09', '2025-09', 79230000, 58360000),
  ('nw-2025-10', '2025-10', 80190000, 58040000),
  ('nw-2025-11', '2025-11', 81240000, 57710000),
  ('nw-2025-12', '2025-12', 82010000, 57390000),
  ('nw-2026-01', '2026-01', 82670000, 57060000),
  ('nw-2026-02', '2026-02', 83460000, 56730000),
  ('nw-2026-03', '2026-03', 84290000, 56390000),
  ('nw-2026-04', '2026-04', 85150000, 56060000),
  ('nw-2026-05', '2026-05', 85890000, 55720000);
