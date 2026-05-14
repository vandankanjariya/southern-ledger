PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'savings', 'offset', 'credit-card', 'loan', 'investment', 'business')),
  balance_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AUD',
  last_updated TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_group TEXT NOT NULL,
  tax_deductible INTEGER NOT NULL DEFAULT 0 CHECK (tax_deductible IN (0, 1)),
  business_use_percent INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  source TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  invalid_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('staged', 'review', 'complete')) DEFAULT 'staged'
);

CREATE TABLE IF NOT EXISTS staging_transactions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  row_number INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  transaction_date TEXT,
  description TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER,
  debit_cents INTEGER,
  credit_cents INTEGER,
  balance_cents INTEGER,
  fingerprint TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'duplicate', 'invalid', 'committed')) DEFAULT 'ready',
  issues_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  source_staging_id TEXT REFERENCES staging_transactions(id),
  transaction_date TEXT NOT NULL,
  description TEXT NOT NULL,
  merchant TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer')),
  status TEXT NOT NULL CHECK (status IN ('cleared', 'needs-review', 'reconciled')) DEFAULT 'cleared',
  tax_tag TEXT,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_staging_batch ON staging_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_fingerprint ON staging_transactions(fingerprint);
