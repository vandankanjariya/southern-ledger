CREATE TABLE IF NOT EXISTS category_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'starts_with', 'exact')),
  pattern TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  tax_tag TEXT,
  business_use_percent INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfer_matches (
  id TEXT PRIMARY KEY,
  outflow_transaction_id TEXT NOT NULL REFERENCES transactions(id),
  inflow_transaction_id TEXT NOT NULL REFERENCES transactions(id),
  confidence INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested', 'confirmed', 'dismissed')) DEFAULT 'suggested',
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(outflow_transaction_id, inflow_transaction_id)
);

CREATE TABLE IF NOT EXISTS reconciliation_events (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('category_applied', 'transfer_confirmed', 'tax_tag_applied', 'status_changed')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_payment_splits (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE REFERENCES transactions(id),
  principal_cents INTEGER NOT NULL,
  interest_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested', 'confirmed')) DEFAULT 'suggested',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_category_rules_active ON category_rules(is_active, priority);
CREATE INDEX IF NOT EXISTS idx_transfer_matches_status ON transfer_matches(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_events_transaction ON reconciliation_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_loan_payment_splits_status ON loan_payment_splits(status);

INSERT OR IGNORE INTO category_rules (id, name, category_id, match_type, pattern, priority, tax_tag, business_use_percent) VALUES
  ('rule-xero', 'Xero subscriptions', 'cat-software', 'contains', 'xero', 10, 'Business', 100),
  ('rule-woolworths', 'Woolworths groceries', 'cat-groceries', 'contains', 'woolworths', 20, NULL, NULL),
  ('rule-rent-income', 'Rental income', 'cat-rent', 'contains', 'rental income', 10, NULL, NULL),
  ('rule-loan-interest', 'Investment loan repayments', 'cat-interest', 'contains', 'investment loan repayment', 10, 'Investment property', NULL),
  ('rule-bas', 'ATO and BAS payments', 'cat-tax', 'contains', 'bas', 15, 'BAS', NULL),
  ('rule-transfer', 'Own account transfers', 'cat-transfer', 'contains', 'transfer', 5, NULL, NULL);

INSERT OR IGNORE INTO transactions (id, account_id, category_id, transaction_date, description, merchant, amount_cents, kind, status, tax_tag, fingerprint) VALUES
  ('txn-013', 'acc-offset', 'cat-transfer', '2026-05-07', 'Transfer from everyday', 'Internal Transfer', 300000, 'transfer', 'cleared', NULL, '2026-05-07|transfer from everyday|3000.00');
