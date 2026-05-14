INSERT OR IGNORE INTO institutions (id, name) VALUES
  ('inst-cba', 'Commonwealth Bank'),
  ('inst-macquarie', 'Macquarie'),
  ('inst-ing', 'ING'),
  ('inst-amex', 'American Express'),
  ('inst-nab', 'NAB');

INSERT OR IGNORE INTO accounts (id, institution_id, name, type, balance_cents, currency, last_updated) VALUES
  ('acc-main', 'inst-cba', 'Everyday Account', 'transaction', 842000, 'AUD', '2026-05-12'),
  ('acc-offset', 'inst-macquarie', 'Home Loan Offset', 'offset', 4850000, 'AUD', '2026-05-12'),
  ('acc-saver', 'inst-ing', 'High Interest Saver', 'savings', 2278000, 'AUD', '2026-05-11'),
  ('acc-card', 'inst-amex', 'Rewards Credit Card', 'credit-card', -236000, 'AUD', '2026-05-10'),
  ('acc-business', 'inst-nab', 'Sole Trader Account', 'business', 1264000, 'AUD', '2026-05-12'),
  ('acc-loan', 'inst-macquarie', 'Investment Property Loan', 'loan', -54120000, 'AUD', '2026-05-12');

INSERT OR IGNORE INTO categories (id, name, category_group, tax_deductible, business_use_percent) VALUES
  ('cat-salary', 'Salary', 'Income', 0, NULL),
  ('cat-rent', 'Rental Income', 'Income', 0, NULL),
  ('cat-groceries', 'Groceries', 'Living', 0, NULL),
  ('cat-utilities', 'Utilities', 'Housing', 0, NULL),
  ('cat-fuel', 'Fuel & Transport', 'Transport', 0, NULL),
  ('cat-software', 'Business Software', 'Business', 1, 100),
  ('cat-property', 'Investment Property Expenses', 'Investment Property', 1, NULL),
  ('cat-interest', 'Loan Interest', 'Investment Property', 1, NULL),
  ('cat-transfer', 'Own Account Transfer', 'Transfers', 0, NULL),
  ('cat-tax', 'Tax Withheld & BAS', 'Tax', 0, NULL),
  ('cat-uncategorised', 'Uncategorised', 'Living', 0, NULL);

INSERT OR IGNORE INTO transactions (id, account_id, category_id, transaction_date, description, merchant, amount_cents, kind, status, tax_tag, fingerprint) VALUES
  ('txn-001', 'acc-main', 'cat-salary', '2026-05-10', 'Salary payment', 'Employer Pty Ltd', 820000, 'income', 'reconciled', NULL, '2026-05-10|salary payment|8200.00'),
  ('txn-002', 'acc-card', 'cat-groceries', '2026-05-09', 'Woolworths groceries', 'Woolworths', -21420, 'expense', 'cleared', NULL, '2026-05-09|woolworths groceries|-214.20'),
  ('txn-003', 'acc-main', 'cat-transfer', '2026-05-07', 'Transfer to offset', 'Internal Transfer', -300000, 'transfer', 'reconciled', NULL, '2026-05-07|transfer to offset|-3000.00'),
  ('txn-004', 'acc-main', 'cat-interest', '2026-05-06', 'Investment loan repayment', 'Macquarie', -298000, 'expense', 'needs-review', 'Investment property', '2026-05-06|investment loan repayment|-2980.00'),
  ('txn-005', 'acc-main', 'cat-rent', '2026-05-05', 'Rental income', 'Property Manager', 312000, 'income', 'reconciled', NULL, '2026-05-05|rental income|3120.00'),
  ('txn-006', 'acc-business', 'cat-software', '2026-05-03', 'Xero subscription', 'Xero', -7600, 'expense', 'cleared', 'Business', '2026-05-03|xero subscription|-76.00'),
  ('txn-007', 'acc-main', 'cat-utilities', '2026-04-29', 'Electricity bill', 'Energy Australia', -28680, 'expense', 'cleared', NULL, '2026-04-29|electricity bill|-286.80'),
  ('txn-008', 'acc-main', 'cat-property', '2026-04-25', 'Plumbing repair rental', 'Northside Plumbing', -64000, 'expense', 'needs-review', 'Investment property', '2026-04-25|plumbing repair rental|-640.00'),
  ('txn-009', 'acc-card', 'cat-fuel', '2026-03-18', 'Fuel', 'BP', -9270, 'expense', 'reconciled', NULL, '2026-03-18|fuel|-92.70'),
  ('txn-010', 'acc-business', 'cat-tax', '2025-12-15', 'BAS payment', 'ATO', -185000, 'expense', 'reconciled', 'BAS', '2025-12-15|bas payment|-1850.00'),
  ('txn-011', 'acc-business', 'cat-software', '2025-08-12', 'Laptop software bundle', 'Adobe', -42000, 'expense', 'reconciled', 'Business', '2025-08-12|laptop software bundle|-420.00'),
  ('txn-012', 'acc-saver', 'cat-transfer', '2025-07-02', 'Opening FY transfer', 'Internal Transfer', 500000, 'transfer', 'reconciled', NULL, '2025-07-02|opening fy transfer|5000.00');
