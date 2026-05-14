import { z } from 'zod';

type D1Value = string | number | null;

interface AccountRow {
  id: string;
  institution_name: string;
  name: string;
  type: string;
  balance_cents: number;
  currency: 'AUD';
  last_updated: string;
}

interface CategoryRow {
  id: string;
  name: string;
  category_group: string;
  tax_deductible: number;
  business_use_percent: number | null;
}

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string;
  transaction_date: string;
  description: string;
  merchant: string;
  amount_cents: number;
  kind: 'income' | 'expense' | 'transfer';
  status: 'cleared' | 'needs-review' | 'reconciled';
  tax_tag: string | null;
}

interface TransactionAuditEventRow {
  id: string;
  transaction_id: string;
  event_type: 'category_applied' | 'transfer_confirmed' | 'tax_tag_applied' | 'status_changed';
  notes: string | null;
  created_at: string;
}

interface ImportBatchRow {
  id: string;
  account_id: string;
  account_name: string;
  source: string;
  imported_at: string;
  row_count: number;
  duplicate_count: number;
  invalid_count: number;
  status: 'staged' | 'review' | 'complete';
}

interface StagingTransactionRow {
  id: string;
  batch_id: string;
  account_id: string;
  row_number: number;
  raw_json: string;
  transaction_date: string | null;
  description: string;
  amount_cents: number | null;
  debit_cents: number | null;
  credit_cents: number | null;
  balance_cents: number | null;
  fingerprint: string | null;
  status: 'ready' | 'duplicate' | 'invalid' | 'committed';
  issues_json: string;
}

interface CategoryRuleRow {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  match_type: 'contains' | 'starts_with' | 'exact';
  pattern: string;
  priority: number;
  tax_tag: string | null;
  business_use_percent: number | null;
  is_active: number;
}

interface TransferMatchRow {
  id: string;
  outflow_transaction_id: string;
  inflow_transaction_id: string;
  confidence: number;
  status: 'suggested' | 'confirmed' | 'dismissed';
  reason: string;
  outflow_date: string;
  inflow_date: string;
  outflow_description: string;
  inflow_description: string;
  outflow_amount_cents: number;
  inflow_amount_cents: number;
}

interface LoanSplitRow {
  id: string;
  transaction_id: string;
  transaction_date: string;
  description: string;
  amount_cents: number;
  principal_cents: number;
  interest_cents: number;
  status: 'suggested' | 'confirmed';
}

interface LoanRow {
  id: string;
  account_id: string | null;
  name: string;
  institution: string;
  balance_cents: number;
  rate_percent: number;
  repayment_cents: number;
  offset_account_id: string | null;
  next_payment_date: string;
  purpose: 'personal' | 'investment-property' | 'business';
  interest_deductible: number;
}

interface AssetRow {
  id: string;
  name: string;
  institution: string;
  type: 'cash' | 'property' | 'investment' | 'vehicle' | 'other';
  value_cents: number;
  valuation_date: string;
  notes: string | null;
}

interface LiabilityRow {
  id: string;
  name: string;
  institution: string;
  type: 'credit-card' | 'loan' | 'mortgage' | 'tax' | 'other';
  balance_cents: number;
  as_of_date: string;
  notes: string | null;
}

interface NetWorthSnapshotRow {
  snapshot_month: string;
  assets_cents: number;
  liabilities_cents: number;
}

interface TaxTagRow {
  id: string;
  name: string;
  description: string;
}

const stagedRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  raw: z.record(z.string(), z.string()),
  date: z.string().nullable(),
  description: z.string(),
  amount: z.number().nullable(),
  debit: z.number().nullable(),
  credit: z.number().nullable(),
  balance: z.number().nullable(),
});

const stageImportSchema = z.object({
  accountId: z.string().min(1),
  source: z.string().min(1),
  rows: z.array(stagedRowSchema).min(1),
});

const accountSchema = z.object({
  institution: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['transaction', 'savings', 'offset', 'credit-card', 'loan', 'investment', 'business']),
  balance: z.number(),
  lastUpdated: z.string().min(1),
});

const categorySchema = z.object({
  name: z.string().min(1),
  group: z.enum(['Income', 'Housing', 'Living', 'Transport', 'Business', 'Investment Property', 'Tax', 'Transfers']),
  taxDeductible: z.boolean(),
  businessUsePercent: z.number().int().min(0).max(100).optional(),
});

const assetSchema = z.object({
  name: z.string().min(1),
  institution: z.string().min(1),
  type: z.enum(['cash', 'property', 'investment', 'vehicle', 'other']),
  value: z.number().nonnegative(),
  valuationDate: z.string().min(1),
  notes: z.string().optional(),
});

const liabilitySchema = z.object({
  name: z.string().min(1),
  institution: z.string().min(1),
  type: z.enum(['credit-card', 'loan', 'mortgage', 'tax', 'other']),
  balance: z.number().nonnegative(),
  asOfDate: z.string().min(1),
  notes: z.string().optional(),
});

const loanSchema = z.object({
  accountId: z.string().optional(),
  name: z.string().min(1),
  institution: z.string().min(1),
  balance: z.number().nonnegative(),
  rate: z.number().nonnegative(),
  repayment: z.number().nonnegative(),
  offsetAccountId: z.string().optional(),
  nextPaymentDate: z.string().min(1),
  purpose: z.enum(['personal', 'investment-property', 'business']),
  interestDeductible: z.boolean(),
});

const applyCategorySchema = z.object({
  transactionId: z.string().min(1),
  categoryId: z.string().min(1),
  taxTag: z.string().optional(),
  status: z.enum(['cleared', 'needs-review', 'reconciled']).optional(),
});

const confirmTransferSchema = z.object({
  matchId: z.string().min(1),
});

const confirmLoanSplitSchema = z.object({
  transactionId: z.string().min(1),
  principal: z.number().nonnegative(),
  interest: z.number().nonnegative(),
});

const categoryRuleSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  matchType: z.enum(['contains', 'starts_with', 'exact']),
  pattern: z.string().min(1),
  priority: z.number().int().min(1).max(999),
  taxTag: z.string().optional(),
  businessUsePercent: z.number().int().min(0).max(100).optional(),
});

const categoryRuleUpdateSchema = categoryRuleSchema.extend({
  isActive: z.boolean(),
});

const taxTagSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: apiHeaders() });
      }

      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json({ ok: true });
      }

      if (url.pathname === '/api/accounts' && request.method === 'GET') {
        return json(await listAccounts(env.DB));
      }

      if (url.pathname === '/api/accounts' && request.method === 'POST') {
        const payload = accountSchema.parse(await request.json());
        return json(await createAccount(env.DB, payload), 201);
      }

      const accountMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
      if (accountMatch && request.method === 'PATCH') {
        const payload = accountSchema.parse(await request.json());
        return json(await updateAccount(env.DB, accountMatch[1], payload));
      }

      if (accountMatch && request.method === 'DELETE') {
        const result = await deleteAccount(env.DB, accountMatch[1]);
        return json(result, result.ok ? 200 : 409);
      }

      if (url.pathname === '/api/categories' && request.method === 'GET') {
        return json(await listCategories(env.DB));
      }

      if (url.pathname === '/api/categories' && request.method === 'POST') {
        const payload = categorySchema.parse(await request.json());
        return json(await createCategory(env.DB, payload), 201);
      }

      const categoryMatch = url.pathname.match(/^\/api\/categories\/([^/]+)$/);
      if (categoryMatch && request.method === 'PATCH') {
        const payload = categorySchema.parse(await request.json());
        return json(await updateCategory(env.DB, categoryMatch[1], payload));
      }

      if (categoryMatch && request.method === 'DELETE') {
        const result = await deleteCategory(env.DB, categoryMatch[1]);
        return json(result, result.ok ? 200 : 409);
      }

      if (url.pathname === '/api/transactions' && request.method === 'GET') {
        if (url.searchParams.has('page') || url.searchParams.has('pageSize') || url.searchParams.has('q') || url.searchParams.has('status') || url.searchParams.get('taxOnly') === 'true') {
          return json(await listTransactionsPage(env.DB, url.searchParams));
        }

        return json(await listTransactions(env.DB, url.searchParams.get('from'), url.searchParams.get('to')));
      }

      const transactionEventsMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)\/events$/);
      if (transactionEventsMatch && request.method === 'GET') {
        return json(await listTransactionAuditEvents(env.DB, transactionEventsMatch[1]));
      }

      if (url.pathname === '/api/loans' && request.method === 'GET') {
        return json(await listLoans(env.DB));
      }

      if (url.pathname === '/api/loans' && request.method === 'POST') {
        const payload = loanSchema.parse(await request.json());
        return json(await createLoan(env.DB, payload), 201);
      }

      const loanMatch = url.pathname.match(/^\/api\/loans\/([^/]+)$/);
      if (loanMatch && request.method === 'PATCH') {
        const payload = loanSchema.parse(await request.json());
        return json(await updateLoan(env.DB, loanMatch[1], payload));
      }

      if (url.pathname === '/api/assets' && request.method === 'GET') {
        return json(await listAssets(env.DB));
      }

      if (url.pathname === '/api/assets' && request.method === 'POST') {
        const payload = assetSchema.parse(await request.json());
        return json(await createAsset(env.DB, payload), 201);
      }

      const assetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)$/);
      if (assetMatch && request.method === 'PATCH') {
        const payload = assetSchema.parse(await request.json());
        return json(await updateAsset(env.DB, assetMatch[1], payload));
      }

      if (url.pathname === '/api/liabilities' && request.method === 'GET') {
        return json(await listLiabilities(env.DB));
      }

      if (url.pathname === '/api/liabilities' && request.method === 'POST') {
        const payload = liabilitySchema.parse(await request.json());
        return json(await createLiability(env.DB, payload), 201);
      }

      const liabilityMatch = url.pathname.match(/^\/api\/liabilities\/([^/]+)$/);
      if (liabilityMatch && request.method === 'PATCH') {
        const payload = liabilitySchema.parse(await request.json());
        return json(await updateLiability(env.DB, liabilityMatch[1], payload));
      }

      if (url.pathname === '/api/net-worth-history' && request.method === 'GET') {
        return json(await listNetWorthHistory(env.DB));
      }

      if (url.pathname === '/api/import-batches' && request.method === 'GET') {
        return json(await listImportBatches(env.DB));
      }

      if (url.pathname === '/api/category-rules' && request.method === 'GET') {
        return json(await listCategoryRules(env.DB));
      }

      if (url.pathname === '/api/category-rules' && request.method === 'POST') {
        const payload = categoryRuleSchema.parse(await request.json());
        return json(await createCategoryRule(env.DB, payload), 201);
      }

      const categoryRuleMatch = url.pathname.match(/^\/api\/category-rules\/([^/]+)$/);
      if (categoryRuleMatch && request.method === 'PATCH') {
        const payload = categoryRuleUpdateSchema.parse(await request.json());
        return json(await updateCategoryRule(env.DB, categoryRuleMatch[1], payload));
      }

      if (categoryRuleMatch && request.method === 'DELETE') {
        return json(await deleteCategoryRule(env.DB, categoryRuleMatch[1]));
      }

      if (url.pathname === '/api/tax-tags' && request.method === 'GET') {
        return json(await listTaxTags(env.DB));
      }

      if (url.pathname === '/api/tax-tags' && request.method === 'POST') {
        const payload = taxTagSchema.parse(await request.json());
        return json(await createTaxTag(env.DB, payload), 201);
      }

      const taxTagMatch = url.pathname.match(/^\/api\/tax-tags\/([^/]+)$/);
      if (taxTagMatch && request.method === 'DELETE') {
        return json(await deleteTaxTag(env.DB, taxTagMatch[1]));
      }

      if (url.pathname === '/api/recurring-transactions' && request.method === 'GET') {
        return json(await listRecurringTransactions(env.DB, url.searchParams.get('from'), url.searchParams.get('to')));
      }

      if (url.pathname === '/api/export/full' && request.method === 'GET') {
        return json(await exportFullBackup(env.DB));
      }

      if (url.pathname === '/api/reconciliation/suggestions' && request.method === 'GET') {
        return json(await getReconciliationSuggestions(env.DB, url.searchParams.get('from'), url.searchParams.get('to')));
      }

      if (url.pathname === '/api/reconciliation/apply-category' && request.method === 'POST') {
        const payload = applyCategorySchema.parse(await request.json());
        return json(await applyCategory(env.DB, payload));
      }

      if (url.pathname === '/api/reconciliation/confirm-transfer' && request.method === 'POST') {
        const payload = confirmTransferSchema.parse(await request.json());
        return json(await confirmTransfer(env.DB, payload.matchId));
      }

      if (url.pathname === '/api/reconciliation/confirm-loan-split' && request.method === 'POST') {
        const payload = confirmLoanSplitSchema.parse(await request.json());
        return json(await confirmLoanSplit(env.DB, payload));
      }

      if (url.pathname === '/api/imports/stage' && request.method === 'POST') {
        const payload = stageImportSchema.parse(await request.json());
        return json(await stageImport(env.DB, payload), 201);
      }

      const stagingMatch = url.pathname.match(/^\/api\/import-batches\/([^/]+)\/staging$/);
      if (stagingMatch && request.method === 'GET') {
        return json(await listStagingTransactions(env.DB, stagingMatch[1]));
      }

      const commitMatch = url.pathname.match(/^\/api\/import-batches\/([^/]+)\/commit$/);
      if (commitMatch && request.method === 'POST') {
        return json(await commitImportBatch(env.DB, commitMatch[1]));
      }

      return json({ error: 'Not found' }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(JSON.stringify({ level: 'error', message }));
      return json({ error: message }, error instanceof z.ZodError ? 400 : 500);
    }
  },
} satisfies ExportedHandler<Env>;

async function listAccounts(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT accounts.id, institutions.name AS institution_name, accounts.name, accounts.type,
        accounts.balance_cents, accounts.currency, accounts.last_updated
       FROM accounts
       JOIN institutions ON institutions.id = accounts.institution_id
       ORDER BY accounts.name`,
    )
    .all<AccountRow>();

  return result.results.map((row) => ({
    id: row.id,
    institution: row.institution_name,
    name: row.name,
    type: row.type,
    balance: centsToDollars(row.balance_cents),
    currency: row.currency,
    lastUpdated: row.last_updated,
  }));
}

async function createAccount(db: D1Database, payload: z.infer<typeof accountSchema>) {
  const institutionId = await getOrCreateInstitution(db, payload.institution);
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO accounts (id, institution_id, name, type, balance_cents, currency, last_updated)
       VALUES (?, ?, ?, ?, ?, 'AUD', ?)`,
    )
    .bind(id, institutionId, payload.name, payload.type, dollarsToCents(payload.balance), payload.lastUpdated)
    .run();

  return { id };
}

async function updateAccount(db: D1Database, accountId: string, payload: z.infer<typeof accountSchema>) {
  const institutionId = await getOrCreateInstitution(db, payload.institution);

  const result = await db
    .prepare(
      `UPDATE accounts
       SET institution_id = ?, name = ?, type = ?, balance_cents = ?, last_updated = ?
       WHERE id = ?`,
    )
    .bind(institutionId, payload.name, payload.type, dollarsToCents(payload.balance), payload.lastUpdated, accountId)
    .run();

  return { ok: result.meta.changes > 0 };
}

async function deleteAccount(db: D1Database, accountId: string) {
  const [transactions, importBatches, stagingRows, loans] = await Promise.all([
    countRows(db, 'SELECT COUNT(*) AS count FROM transactions WHERE account_id = ?', accountId),
    countRows(db, 'SELECT COUNT(*) AS count FROM import_batches WHERE account_id = ?', accountId),
    countRows(db, 'SELECT COUNT(*) AS count FROM staging_transactions WHERE account_id = ?', accountId),
    countRows(db, 'SELECT COUNT(*) AS count FROM loans WHERE account_id = ? OR offset_account_id = ?', accountId, accountId),
  ]);
  const linkedRecords = transactions + importBatches + stagingRows + loans;

  if (linkedRecords > 0) {
    return {
      ok: false,
      error: 'Account has linked transactions, imports, or loans and cannot be deleted.',
    };
  }

  const result = await db.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId).run();
  return { ok: result.meta.changes > 0 };
}

async function getOrCreateInstitution(db: D1Database, institutionName: string) {
  const name = institutionName.trim();
  const existing = await db
    .prepare('SELECT id FROM institutions WHERE lower(name) = lower(?) LIMIT 1')
    .bind(name)
    .first<{ id: string }>();

  if (existing?.id) {
    return existing.id;
  }

  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO institutions (id, name) VALUES (?, ?)').bind(id, name).run();
  return id;
}

async function listCategories(db: D1Database) {
  const result = await db.prepare('SELECT * FROM categories ORDER BY category_group, name').all<CategoryRow>();

  return result.results.map((row) => ({
    id: row.id,
    name: row.name,
    group: row.category_group,
    taxDeductible: row.tax_deductible === 1,
    businessUsePercent: row.business_use_percent ?? undefined,
  }));
}

async function createCategory(db: D1Database, payload: z.infer<typeof categorySchema>) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO categories (id, name, category_group, tax_deductible, business_use_percent)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, payload.name, payload.group, payload.taxDeductible ? 1 : 0, payload.businessUsePercent ?? null)
    .run();

  return { id };
}

async function updateCategory(db: D1Database, categoryId: string, payload: z.infer<typeof categorySchema>) {
  const result = await db
    .prepare(
      `UPDATE categories
       SET name = ?, category_group = ?, tax_deductible = ?, business_use_percent = ?
       WHERE id = ?`,
    )
    .bind(payload.name, payload.group, payload.taxDeductible ? 1 : 0, payload.businessUsePercent ?? null, categoryId)
    .run();

  return { ok: result.meta.changes > 0 };
}

async function deleteCategory(db: D1Database, categoryId: string) {
  const [transactions, rules] = await Promise.all([
    countRows(db, 'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?', categoryId),
    countRows(db, 'SELECT COUNT(*) AS count FROM category_rules WHERE category_id = ?', categoryId),
  ]);
  const linkedRecords = transactions + rules;

  if (linkedRecords > 0) {
    return {
      ok: false,
      error: 'Category has linked transactions or rules and cannot be deleted.',
    };
  }

  const result = await db.prepare('DELETE FROM categories WHERE id = ?').bind(categoryId).run();
  return { ok: result.meta.changes > 0 };
}

async function listTransactions(db: D1Database, from: string | null, to: string | null) {
  const conditions: string[] = [];
  const bindings: D1Value[] = [];

  if (from) {
    conditions.push('transaction_date >= ?');
    bindings.push(from);
  }

  if (to) {
    conditions.push('transaction_date <= ?');
    bindings.push(to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db
    .prepare(
      `SELECT id, account_id, category_id, transaction_date, description, merchant,
        amount_cents, kind, status, tax_tag
       FROM transactions
       ${where}
       ORDER BY transaction_date DESC, created_at DESC`,
    )
    .bind(...bindings)
    .all<TransactionRow>();

  return result.results.map(mapTransaction);
}

async function listTransactionsPage(db: D1Database, params: URLSearchParams) {
  const page = clampInt(Number(params.get('page') ?? '1'), 1, 100_000);
  const pageSize = clampInt(Number(params.get('pageSize') ?? '20'), 10, 100);
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [];
  const bindings: D1Value[] = [];
  const from = params.get('from');
  const to = params.get('to');
  const query = params.get('q')?.trim().toLowerCase();
  const status = params.get('status');
  const taxOnly = params.get('taxOnly') === 'true';

  if (from) {
    conditions.push('transactions.transaction_date >= ?');
    bindings.push(from);
  }

  if (to) {
    conditions.push('transactions.transaction_date <= ?');
    bindings.push(to);
  }

  if (status && ['cleared', 'needs-review', 'reconciled'].includes(status)) {
    conditions.push('transactions.status = ?');
    bindings.push(status);
  }

  if (query) {
    conditions.push(`(
      lower(transactions.description) LIKE ?
      OR lower(transactions.merchant) LIKE ?
      OR lower(accounts.name) LIKE ?
      OR lower(categories.name) LIKE ?
      OR lower(COALESCE(transactions.tax_tag, '')) LIKE ?
    )`);
    const like = `%${query}%`;
    bindings.push(like, like, like, like, like);
  }

  if (taxOnly) {
    conditions.push('(transactions.tax_tag IS NOT NULL OR categories.tax_deductible = 1)');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const totalRow = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM transactions
       JOIN accounts ON accounts.id = transactions.account_id
       JOIN categories ON categories.id = transactions.category_id
       ${where}`,
    )
    .bind(...bindings)
    .first<{ count: number }>();
  const result = await db
    .prepare(
      `SELECT transactions.id, transactions.account_id, transactions.category_id,
        transactions.transaction_date, transactions.description, transactions.merchant,
        transactions.amount_cents, transactions.kind, transactions.status, transactions.tax_tag
       FROM transactions
       JOIN accounts ON accounts.id = transactions.account_id
       JOIN categories ON categories.id = transactions.category_id
       ${where}
       ORDER BY transactions.transaction_date DESC, transactions.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...bindings, pageSize, offset)
    .all<TransactionRow>();

  return {
    rows: result.results.map(mapTransaction),
    total: totalRow?.count ?? 0,
    page,
    pageSize,
  };
}

function mapTransaction(row: TransactionRow) {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    date: row.transaction_date,
    description: row.description,
    merchant: row.merchant,
    amount: centsToDollars(row.amount_cents),
    kind: row.kind,
    status: row.status,
    taxTag: row.tax_tag ?? undefined,
  };
}

async function listLoans(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, account_id, name, institution, balance_cents, rate_percent, repayment_cents,
        offset_account_id, next_payment_date, purpose, interest_deductible
       FROM loans
       ORDER BY purpose, name`,
    )
    .all<LoanRow>();

  return result.results.map((row) => ({
    id: row.id,
    accountId: row.account_id ?? undefined,
    name: row.name,
    institution: row.institution,
    balance: centsToDollars(row.balance_cents),
    rate: row.rate_percent,
    repayment: centsToDollars(row.repayment_cents),
    offsetAccountId: row.offset_account_id ?? undefined,
    nextPaymentDate: row.next_payment_date,
    purpose: row.purpose,
    interestDeductible: row.interest_deductible === 1,
  }));
}

async function createLoan(db: D1Database, payload: z.infer<typeof loanSchema>) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO loans (
        id, account_id, name, institution, balance_cents, rate_percent, repayment_cents,
        offset_account_id, next_payment_date, purpose, interest_deductible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      optionalString(payload.accountId),
      payload.name,
      payload.institution,
      dollarsToCents(payload.balance),
      payload.rate,
      dollarsToCents(payload.repayment),
      optionalString(payload.offsetAccountId),
      payload.nextPaymentDate,
      payload.purpose,
      payload.interestDeductible ? 1 : 0,
    )
    .run();

  return { id };
}

async function updateLoan(db: D1Database, loanId: string, payload: z.infer<typeof loanSchema>) {
  const result = await db
    .prepare(
      `UPDATE loans
       SET account_id = ?, name = ?, institution = ?, balance_cents = ?, rate_percent = ?,
        repayment_cents = ?, offset_account_id = ?, next_payment_date = ?, purpose = ?,
        interest_deductible = ?
       WHERE id = ?`,
    )
    .bind(
      optionalString(payload.accountId),
      payload.name,
      payload.institution,
      dollarsToCents(payload.balance),
      payload.rate,
      dollarsToCents(payload.repayment),
      optionalString(payload.offsetAccountId),
      payload.nextPaymentDate,
      payload.purpose,
      payload.interestDeductible ? 1 : 0,
      loanId,
    )
    .run();

  return { ok: result.meta.changes > 0 };
}

async function listAssets(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, name, institution, type, value_cents, valuation_date, notes
       FROM assets
       ORDER BY value_cents DESC, name`,
    )
    .all<AssetRow>();

  return result.results.map((row) => ({
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    value: centsToDollars(row.value_cents),
    valuationDate: row.valuation_date,
    notes: row.notes ?? undefined,
  }));
}

async function createAsset(db: D1Database, payload: z.infer<typeof assetSchema>) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO assets (id, name, institution, type, value_cents, valuation_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, payload.name, payload.institution, payload.type, dollarsToCents(payload.value), payload.valuationDate, optionalString(payload.notes))
    .run();

  return { id };
}

async function updateAsset(db: D1Database, assetId: string, payload: z.infer<typeof assetSchema>) {
  const result = await db
    .prepare(
      `UPDATE assets
       SET name = ?, institution = ?, type = ?, value_cents = ?, valuation_date = ?, notes = ?
       WHERE id = ?`,
    )
    .bind(payload.name, payload.institution, payload.type, dollarsToCents(payload.value), payload.valuationDate, optionalString(payload.notes), assetId)
    .run();

  return { ok: result.meta.changes > 0 };
}

async function listLiabilities(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, name, institution, type, balance_cents, as_of_date, notes
       FROM liabilities
       ORDER BY balance_cents DESC, name`,
    )
    .all<LiabilityRow>();

  return result.results.map((row) => ({
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    balance: centsToDollars(row.balance_cents),
    asOfDate: row.as_of_date,
    notes: row.notes ?? undefined,
  }));
}

async function createLiability(db: D1Database, payload: z.infer<typeof liabilitySchema>) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO liabilities (id, name, institution, type, balance_cents, as_of_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, payload.name, payload.institution, payload.type, dollarsToCents(payload.balance), payload.asOfDate, optionalString(payload.notes))
    .run();

  return { id };
}

async function updateLiability(db: D1Database, liabilityId: string, payload: z.infer<typeof liabilitySchema>) {
  const result = await db
    .prepare(
      `UPDATE liabilities
       SET name = ?, institution = ?, type = ?, balance_cents = ?, as_of_date = ?, notes = ?
       WHERE id = ?`,
    )
    .bind(payload.name, payload.institution, payload.type, dollarsToCents(payload.balance), payload.asOfDate, optionalString(payload.notes), liabilityId)
    .run();

  return { ok: result.meta.changes > 0 };
}

async function listNetWorthHistory(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT snapshot_month, assets_cents, liabilities_cents
       FROM net_worth_snapshots
       ORDER BY snapshot_month`,
    )
    .all<NetWorthSnapshotRow>();

  return result.results.map((row) => ({
    month: row.snapshot_month,
    assets: centsToDollars(row.assets_cents),
    liabilities: centsToDollars(row.liabilities_cents),
  }));
}

async function listImportBatches(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT import_batches.id, import_batches.account_id, accounts.name AS account_name,
        import_batches.source, import_batches.imported_at, import_batches.row_count,
        import_batches.duplicate_count, import_batches.invalid_count, import_batches.status
       FROM import_batches
       JOIN accounts ON accounts.id = import_batches.account_id
       ORDER BY imported_at DESC`,
    )
    .all<ImportBatchRow>();

  return result.results.map(mapImportBatch);
}

async function listCategoryRules(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT category_rules.id, category_rules.name, category_rules.category_id, categories.name AS category_name,
        category_rules.match_type, category_rules.pattern, category_rules.priority, category_rules.tax_tag,
        category_rules.business_use_percent, category_rules.is_active
       FROM category_rules
       JOIN categories ON categories.id = category_rules.category_id
       ORDER BY category_rules.priority, category_rules.name`,
    )
    .all<CategoryRuleRow>();

  return result.results.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    matchType: row.match_type,
    pattern: row.pattern,
    priority: row.priority,
    taxTag: row.tax_tag ?? undefined,
    businessUsePercent: row.business_use_percent ?? undefined,
    isActive: row.is_active === 1,
  }));
}

async function createCategoryRule(db: D1Database, payload: z.infer<typeof categoryRuleSchema>) {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO category_rules (
        id, name, category_id, match_type, pattern, priority, tax_tag, business_use_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      payload.name,
      payload.categoryId,
      payload.matchType,
      payload.pattern,
      payload.priority,
      payload.taxTag ?? null,
      payload.businessUsePercent ?? null,
    )
    .run();

  return { id };
}

async function updateCategoryRule(db: D1Database, ruleId: string, payload: z.infer<typeof categoryRuleUpdateSchema>) {
  const result = await db
    .prepare(
      `UPDATE category_rules
       SET name = ?, category_id = ?, match_type = ?, pattern = ?, priority = ?,
        tax_tag = ?, business_use_percent = ?, is_active = ?
       WHERE id = ?`,
    )
    .bind(
      payload.name,
      payload.categoryId,
      payload.matchType,
      payload.pattern,
      payload.priority,
      payload.taxTag ?? null,
      payload.businessUsePercent ?? null,
      payload.isActive ? 1 : 0,
      ruleId,
    )
    .run();

  return { ok: result.meta.changes > 0 };
}

async function deleteCategoryRule(db: D1Database, ruleId: string) {
  const result = await db.prepare('DELETE FROM category_rules WHERE id = ?').bind(ruleId).run();
  return { ok: result.meta.changes > 0 };
}

async function listTaxTags(db: D1Database) {
  const result = await db.prepare('SELECT id, name, description FROM tax_tags ORDER BY name').all<TaxTagRow>();
  return result.results;
}

async function createTaxTag(db: D1Database, payload: z.infer<typeof taxTagSchema>) {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO tax_tags (id, name, description) VALUES (?, ?, ?)')
    .bind(id, payload.name.trim(), payload.description?.trim() ?? '')
    .run();
  return { id };
}

async function deleteTaxTag(db: D1Database, tagId: string) {
  const tag = await db.prepare('SELECT name FROM tax_tags WHERE id = ?').bind(tagId).first<{ name: string }>();

  if (!tag) {
    return { ok: false };
  }

  const linked = await countRows(db, 'SELECT COUNT(*) AS count FROM transactions WHERE tax_tag = ?', tag.name);
  if (linked > 0) {
    return { ok: false, error: 'Tax tag is used by transactions and cannot be deleted.' };
  }

  const result = await db.prepare('DELETE FROM tax_tags WHERE id = ?').bind(tagId).run();
  return { ok: result.meta.changes > 0 };
}

async function listTransactionAuditEvents(db: D1Database, transactionId: string) {
  const result = await db
    .prepare(
      `SELECT id, transaction_id, event_type, notes, created_at
       FROM reconciliation_events
       WHERE transaction_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(transactionId)
    .all<TransactionAuditEventRow>();

  return result.results.map((row) => ({
    id: row.id,
    transactionId: row.transaction_id,
    eventType: row.event_type,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }));
}

async function listRecurringTransactions(db: D1Database, from: string | null, to: string | null) {
  const conditions = ["kind != 'transfer'"];
  const bindings: D1Value[] = [];

  if (from) {
    conditions.push('transaction_date >= ?');
    bindings.push(from);
  }

  if (to) {
    conditions.push('transaction_date <= ?');
    bindings.push(to);
  }

  const result = await db
    .prepare(
      `SELECT lower(description) AS normalized_description, description, merchant, amount_cents,
        category_id, COUNT(*) AS count, MIN(transaction_date) AS first_date, MAX(transaction_date) AS last_date
       FROM transactions
       WHERE ${conditions.join(' AND ')}
       GROUP BY lower(description), merchant, amount_cents, category_id
       HAVING COUNT(*) >= 2
       ORDER BY count DESC, last_date DESC
       LIMIT 50`,
    )
    .bind(...bindings)
    .all<{
      description: string;
      merchant: string;
      amount_cents: number;
      category_id: string;
      count: number;
      first_date: string;
      last_date: string;
    }>();

  return result.results.map((row) => ({
    description: row.description,
    merchant: row.merchant,
    amount: centsToDollars(row.amount_cents),
    count: row.count,
    firstDate: row.first_date,
    lastDate: row.last_date,
    categoryId: row.category_id,
  }));
}

async function exportFullBackup(db: D1Database) {
  const [
    institutions,
    accounts,
    categories,
    categoryRules,
    taxTags,
    transactions,
    importBatches,
    loans,
    assets,
    liabilities,
    netWorthSnapshots,
  ] = await Promise.all([
    db.prepare('SELECT * FROM institutions ORDER BY name').all(),
    db.prepare('SELECT * FROM accounts ORDER BY name').all(),
    db.prepare('SELECT * FROM categories ORDER BY category_group, name').all(),
    db.prepare('SELECT * FROM category_rules ORDER BY priority, name').all(),
    db.prepare('SELECT * FROM tax_tags ORDER BY name').all(),
    db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC').all(),
    db.prepare('SELECT * FROM import_batches ORDER BY imported_at DESC').all(),
    db.prepare('SELECT * FROM loans ORDER BY name').all(),
    db.prepare('SELECT * FROM assets ORDER BY name').all(),
    db.prepare('SELECT * FROM liabilities ORDER BY name').all(),
    db.prepare('SELECT * FROM net_worth_snapshots ORDER BY snapshot_month').all(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schema: 'southern-ledger-full-export-v1',
    tables: {
      institutions: institutions.results,
      accounts: accounts.results,
      categories: categories.results,
      categoryRules: categoryRules.results,
      taxTags: taxTags.results,
      transactions: transactions.results,
      importBatches: importBatches.results,
      loans: loans.results,
      assets: assets.results,
      liabilities: liabilities.results,
      netWorthSnapshots: netWorthSnapshots.results,
    },
  };
}

async function getReconciliationSuggestions(db: D1Database, from: string | null, to: string | null) {
  const [rules, transactions] = await Promise.all([
    listActiveRules(db),
    listTransactionsForSuggestions(db, from, to),
  ]);
  const transferCandidates = await listTransactionsForTransferSuggestions(db, from, to);
  const ruleSuggestions = transactions
    .map((transaction) => {
      const matchedRule = rules.find((rule) => matchesRule(transaction.description, rule));

      if (!matchedRule || transaction.category_id === matchedRule.category_id) {
        return null;
      }

      return {
        transactionId: transaction.id,
        description: transaction.description,
        date: transaction.transaction_date,
        amount: centsToDollars(transaction.amount_cents),
        currentCategoryId: transaction.category_id,
        suggestedCategoryId: matchedRule.category_id,
        suggestedCategoryName: matchedRule.category_name,
        taxTag: matchedRule.tax_tag ?? undefined,
        confidence: Math.max(70, 100 - matchedRule.priority),
        reason: `Matched rule "${matchedRule.name}"`,
      };
    })
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => suggestion !== null);

  const transferMatches = await createTransferSuggestions(db, transferCandidates);
  const loanSplitSuggestions = await createLoanSplitSuggestions(db, transactions);

  return {
    categorySuggestions: ruleSuggestions,
    transferMatches,
    loanSplitSuggestions,
  };
}

async function applyCategory(db: D1Database, payload: z.infer<typeof applyCategorySchema>) {
  const status = payload.status ?? 'reconciled';
  await db.batch([
    db
      .prepare('UPDATE transactions SET category_id = ?, tax_tag = ?, status = ? WHERE id = ?')
      .bind(payload.categoryId, payload.taxTag ?? null, status, payload.transactionId),
    db
      .prepare('INSERT INTO reconciliation_events (id, transaction_id, event_type, notes) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), payload.transactionId, 'category_applied', `Applied category ${payload.categoryId}`),
  ]);

  return { ok: true };
}

async function confirmTransfer(db: D1Database, matchId: string) {
  const match = await db
    .prepare('SELECT outflow_transaction_id, inflow_transaction_id FROM transfer_matches WHERE id = ?')
    .bind(matchId)
    .first<Pick<TransferMatchRow, 'outflow_transaction_id' | 'inflow_transaction_id'>>();

  if (!match) {
    return { ok: false, error: 'Transfer match not found' };
  }

  await db.batch([
    db.prepare("UPDATE transfer_matches SET status = 'confirmed' WHERE id = ?").bind(matchId),
    db.prepare("UPDATE transactions SET category_id = 'cat-transfer', kind = 'transfer', status = 'reconciled' WHERE id IN (?, ?)").bind(match.outflow_transaction_id, match.inflow_transaction_id),
    db.prepare('INSERT INTO reconciliation_events (id, transaction_id, event_type, notes) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), match.outflow_transaction_id, 'transfer_confirmed', `Confirmed transfer match ${matchId}`),
    db.prepare('INSERT INTO reconciliation_events (id, transaction_id, event_type, notes) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), match.inflow_transaction_id, 'transfer_confirmed', `Confirmed transfer match ${matchId}`),
  ]);

  return { ok: true };
}

async function confirmLoanSplit(db: D1Database, payload: z.infer<typeof confirmLoanSplitSchema>) {
  await db.batch([
    db
      .prepare(
        `INSERT INTO loan_payment_splits (id, transaction_id, principal_cents, interest_cents, status)
         VALUES (?, ?, ?, ?, 'confirmed')
         ON CONFLICT(transaction_id) DO UPDATE SET principal_cents = excluded.principal_cents,
           interest_cents = excluded.interest_cents, status = 'confirmed'`,
      )
      .bind(crypto.randomUUID(), payload.transactionId, dollarsToCents(payload.principal), dollarsToCents(payload.interest)),
    db
      .prepare("UPDATE transactions SET category_id = 'cat-interest', tax_tag = 'Investment property', status = 'reconciled' WHERE id = ?")
      .bind(payload.transactionId),
    db
      .prepare('INSERT INTO reconciliation_events (id, transaction_id, event_type, notes) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), payload.transactionId, 'tax_tag_applied', 'Confirmed loan split and investment property tax tag'),
  ]);

  return { ok: true };
}

async function listStagingTransactions(db: D1Database, batchId: string) {
  const result = await db
    .prepare(
      `SELECT id, batch_id, account_id, row_number, raw_json, transaction_date, description,
        amount_cents, debit_cents, credit_cents, balance_cents, fingerprint, status, issues_json
       FROM staging_transactions
       WHERE batch_id = ?
       ORDER BY row_number`,
    )
    .bind(batchId)
    .all<StagingTransactionRow>();

  return result.results.map(mapStagingTransaction);
}

async function stageImport(db: D1Database, payload: z.infer<typeof stageImportSchema>) {
  const batchId = crypto.randomUUID();
  const staged = payload.rows.map((row) => {
    const issues = [...validateStagedRow(row)];
    const fingerprint = row.date && row.description && row.amount !== null ? createFingerprint(row.date, row.description, row.amount) : null;
    return { ...row, issues, fingerprint };
  });

  const existingFingerprints = await findExistingFingerprints(
    db,
    staged.map((row) => row.fingerprint).filter((fingerprint): fingerprint is string => fingerprint !== null),
  );

  const rows = staged.map((row) => {
    const status = row.issues.length > 0 ? 'invalid' : row.fingerprint && existingFingerprints.has(row.fingerprint) ? 'duplicate' : 'ready';
    return { ...row, status };
  });
  const duplicateCount = rows.filter((row) => row.status === 'duplicate').length;
  const invalidCount = rows.filter((row) => row.status === 'invalid').length;
  const batchStatus = duplicateCount > 0 || invalidCount > 0 ? 'review' : 'staged';

  const statements = [
    db
      .prepare(
        `INSERT INTO import_batches (id, account_id, source, row_count, duplicate_count, invalid_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(batchId, payload.accountId, payload.source, rows.length, duplicateCount, invalidCount, batchStatus),
    ...rows.map((row) =>
      db
        .prepare(
          `INSERT INTO staging_transactions (
            id, batch_id, account_id, row_number, raw_json, transaction_date, description,
            amount_cents, debit_cents, credit_cents, balance_cents, fingerprint, status, issues_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          batchId,
          payload.accountId,
          row.rowNumber,
          JSON.stringify(row.raw),
          row.date,
          row.description,
          dollarsToCents(row.amount),
          dollarsToCents(row.debit),
          dollarsToCents(row.credit),
          dollarsToCents(row.balance),
          row.fingerprint,
          row.status,
          JSON.stringify(row.issues),
        ),
    ),
  ];

  await db.batch(statements);

  return {
    batch: {
      id: batchId,
      accountId: payload.accountId,
      source: payload.source,
      rows: rows.length,
      duplicates: duplicateCount,
      invalid: invalidCount,
      status: batchStatus,
    },
    rows,
  };
}

async function commitImportBatch(db: D1Database, batchId: string) {
  const staged = await db
    .prepare(
      `SELECT id, account_id, transaction_date, description, amount_cents, fingerprint
       FROM staging_transactions
       WHERE batch_id = ? AND status = 'ready'`,
    )
    .bind(batchId)
    .all<Pick<StagingTransactionRow, 'id' | 'account_id' | 'transaction_date' | 'description' | 'amount_cents' | 'fingerprint'>>();

  const statements: D1PreparedStatement[] = [];

  for (const row of staged.results) {
    if (!row.transaction_date || row.amount_cents === null || !row.fingerprint) {
      continue;
    }

    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO transactions (
            id, account_id, category_id, source_staging_id, transaction_date, description,
            merchant, amount_cents, kind, status, fingerprint
          ) VALUES (?, ?, 'cat-uncategorised', ?, ?, ?, ?, ?, ?, 'cleared', ?)`,
        )
        .bind(
          crypto.randomUUID(),
          row.account_id,
          row.id,
          row.transaction_date,
          row.description,
          row.description,
          row.amount_cents,
          row.amount_cents >= 0 ? 'income' : 'expense',
          row.fingerprint,
        ),
      db.prepare("UPDATE staging_transactions SET status = 'committed' WHERE id = ?").bind(row.id),
    );
  }

  statements.push(db.prepare("UPDATE import_batches SET status = 'complete' WHERE id = ?").bind(batchId));

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return { committed: staged.results.length };
}

async function listActiveRules(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT category_rules.id, category_rules.name, category_rules.category_id, categories.name AS category_name,
        category_rules.match_type, category_rules.pattern, category_rules.priority, category_rules.tax_tag,
        category_rules.business_use_percent, category_rules.is_active
       FROM category_rules
       JOIN categories ON categories.id = category_rules.category_id
       WHERE category_rules.is_active = 1
       ORDER BY category_rules.priority, category_rules.name`,
    )
    .all<CategoryRuleRow>();

  return result.results;
}

async function listTransactionsForSuggestions(db: D1Database, from: string | null, to: string | null) {
  const conditions = ["status != 'reconciled'"];
  const bindings: D1Value[] = [];

  if (from) {
    conditions.push('transaction_date >= ?');
    bindings.push(from);
  }

  if (to) {
    conditions.push('transaction_date <= ?');
    bindings.push(to);
  }

  const result = await db
    .prepare(
      `SELECT id, account_id, category_id, transaction_date, description, merchant,
        amount_cents, kind, status, tax_tag
       FROM transactions
       WHERE ${conditions.join(' AND ')}
       ORDER BY transaction_date DESC`,
    )
    .bind(...bindings)
    .all<TransactionRow>();

  return result.results;
}

async function listTransactionsForTransferSuggestions(db: D1Database, from: string | null, to: string | null) {
  const conditions = ["status != 'reconciled' OR kind = 'transfer'"];
  const bindings: D1Value[] = [];

  if (from) {
    conditions.push('transaction_date >= ?');
    bindings.push(from);
  }

  if (to) {
    conditions.push('transaction_date <= ?');
    bindings.push(to);
  }

  const result = await db
    .prepare(
      `SELECT id, account_id, category_id, transaction_date, description, merchant,
        amount_cents, kind, status, tax_tag
       FROM transactions
       WHERE ${conditions.map((condition) => `(${condition})`).join(' AND ')}
       ORDER BY transaction_date DESC`,
    )
    .bind(...bindings)
    .all<TransactionRow>();

  return result.results;
}

async function createTransferSuggestions(db: D1Database, transactions: TransactionRow[]) {
  const suggestions: Array<{
    id: string;
    outflowTransactionId: string;
    inflowTransactionId: string;
    outflowDescription: string;
    inflowDescription: string;
    outflowDate: string;
    inflowDate: string;
    amount: number;
    confidence: number;
    status: string;
    reason: string;
  }> = [];

  const outflows = transactions.filter((transaction) => transaction.amount_cents < 0);
  const inflows = transactions.filter((transaction) => transaction.amount_cents > 0);

  for (const outflow of outflows) {
    for (const inflow of inflows) {
      if (outflow.account_id === inflow.account_id) {
        continue;
      }

      const sameAmount = Math.abs(outflow.amount_cents + inflow.amount_cents) <= 1;
      const daysApart = Math.abs((Date.parse(outflow.transaction_date) - Date.parse(inflow.transaction_date)) / 86_400_000);
      const transferText = `${outflow.description} ${inflow.description}`.toLowerCase().includes('transfer');

      if (!sameAmount || daysApart > 3) {
        continue;
      }

      const confidence = transferText ? 95 : 80;
      const reason = transferText ? 'Equal and opposite amounts with transfer description' : 'Equal and opposite amounts within 3 days';
      const matchId = await upsertTransferSuggestion(db, outflow.id, inflow.id, confidence, reason);

      suggestions.push({
        id: matchId,
        outflowTransactionId: outflow.id,
        inflowTransactionId: inflow.id,
        outflowDescription: outflow.description,
        inflowDescription: inflow.description,
        outflowDate: outflow.transaction_date,
        inflowDate: inflow.transaction_date,
        amount: centsToDollars(inflow.amount_cents),
        confidence,
        status: 'suggested',
        reason,
      });
    }
  }

  const persisted = await db
    .prepare(
      `SELECT transfer_matches.id, transfer_matches.outflow_transaction_id, transfer_matches.inflow_transaction_id,
        transfer_matches.confidence, transfer_matches.status, transfer_matches.reason,
        outflow.transaction_date AS outflow_date, inflow.transaction_date AS inflow_date,
        outflow.description AS outflow_description, inflow.description AS inflow_description,
        outflow.amount_cents AS outflow_amount_cents, inflow.amount_cents AS inflow_amount_cents
       FROM transfer_matches
       JOIN transactions AS outflow ON outflow.id = transfer_matches.outflow_transaction_id
       JOIN transactions AS inflow ON inflow.id = transfer_matches.inflow_transaction_id
       WHERE transfer_matches.status = 'suggested'
       ORDER BY transfer_matches.confidence DESC, transfer_matches.created_at DESC`,
    )
    .all<TransferMatchRow>();

  return persisted.results.map((row) => ({
    id: row.id,
    outflowTransactionId: row.outflow_transaction_id,
    inflowTransactionId: row.inflow_transaction_id,
    outflowDescription: row.outflow_description,
    inflowDescription: row.inflow_description,
    outflowDate: row.outflow_date,
    inflowDate: row.inflow_date,
    amount: centsToDollars(row.inflow_amount_cents),
    confidence: row.confidence,
    status: row.status,
    reason: row.reason,
  }));
}

async function createLoanSplitSuggestions(db: D1Database, transactions: TransactionRow[]) {
  const suggestions = transactions.filter((transaction) => {
    const description = normalizeDescription(transaction.description);
    return transaction.amount_cents < 0 && description.includes('loan') && description.includes('repayment');
  });

  for (const transaction of suggestions) {
    const existing = await db
      .prepare('SELECT id FROM loan_payment_splits WHERE transaction_id = ?')
      .bind(transaction.id)
      .first<{ id: string }>();

    if (existing?.id) {
      continue;
    }

    const total = Math.abs(transaction.amount_cents);
    const interest = Math.round(total * 0.72);
    const principal = total - interest;

    await db
      .prepare(
        `INSERT INTO loan_payment_splits (id, transaction_id, principal_cents, interest_cents, status)
         VALUES (?, ?, ?, ?, 'suggested')`,
      )
      .bind(crypto.randomUUID(), transaction.id, principal, interest)
      .run();
  }

  const result = await db
    .prepare(
      `SELECT loan_payment_splits.id, loan_payment_splits.transaction_id, transactions.transaction_date,
        transactions.description, transactions.amount_cents, loan_payment_splits.principal_cents,
        loan_payment_splits.interest_cents, loan_payment_splits.status
       FROM loan_payment_splits
       JOIN transactions ON transactions.id = loan_payment_splits.transaction_id
       WHERE loan_payment_splits.status = 'suggested'
       ORDER BY transactions.transaction_date DESC`,
    )
    .all<LoanSplitRow>();

  return result.results.map((row) => ({
    id: row.id,
    transactionId: row.transaction_id,
    date: row.transaction_date,
    description: row.description,
    amount: centsToDollars(row.amount_cents),
    principal: centsToDollars(row.principal_cents),
    interest: centsToDollars(row.interest_cents),
    taxTag: 'Investment property',
    confidence: 72,
    reason: 'Loan repayment description; split is a placeholder estimate for review',
  }));
}

async function upsertTransferSuggestion(db: D1Database, outflowTransactionId: string, inflowTransactionId: string, confidence: number, reason: string) {
  const existing = await db
    .prepare('SELECT id FROM transfer_matches WHERE outflow_transaction_id = ? AND inflow_transaction_id = ?')
    .bind(outflowTransactionId, inflowTransactionId)
    .first<{ id: string }>();

  if (existing?.id) {
    return existing.id;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO transfer_matches (id, outflow_transaction_id, inflow_transaction_id, confidence, reason)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, outflowTransactionId, inflowTransactionId, confidence, reason)
    .run();

  return id;
}

function matchesRule(description: string, rule: CategoryRuleRow) {
  const haystack = normalizeDescription(description);
  const pattern = normalizeDescription(rule.pattern);

  if (rule.match_type === 'exact') {
    return haystack === pattern;
  }

  if (rule.match_type === 'starts_with') {
    return haystack.startsWith(pattern);
  }

  return haystack.includes(pattern);
}

async function findExistingFingerprints(db: D1Database, fingerprints: string[]) {
  const existing = new Set<string>();

  for (const fingerprint of fingerprints) {
    const found = await db.prepare('SELECT fingerprint FROM transactions WHERE fingerprint = ?').bind(fingerprint).first<{ fingerprint: string }>();
    if (found?.fingerprint) {
      existing.add(found.fingerprint);
    }
  }

  return existing;
}

function validateStagedRow(row: z.infer<typeof stagedRowSchema>) {
  const issues: string[] = [];

  if (!row.date) {
    issues.push('Missing or invalid date');
  }

  if (!row.description.trim()) {
    issues.push('Missing description');
  }

  if (row.amount === null) {
    issues.push('Missing amount');
  }

  return issues;
}

function mapImportBatch(row: ImportBatchRow) {
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.account_name,
    source: row.source,
    importedAt: row.imported_at,
    rows: row.row_count,
    duplicates: row.duplicate_count,
    invalid: row.invalid_count,
    status: row.status,
  };
}

function mapStagingTransaction(row: StagingTransactionRow) {
  return {
    id: row.id,
    batchId: row.batch_id,
    accountId: row.account_id,
    rowNumber: row.row_number,
    raw: JSON.parse(row.raw_json) as Record<string, string>,
    date: row.transaction_date,
    description: row.description,
    amount: row.amount_cents === null ? null : centsToDollars(row.amount_cents),
    debit: row.debit_cents === null ? null : centsToDollars(row.debit_cents),
    credit: row.credit_cents === null ? null : centsToDollars(row.credit_cents),
    balance: row.balance_cents === null ? null : centsToDollars(row.balance_cents),
    fingerprint: row.fingerprint,
    status: row.status,
    issues: JSON.parse(row.issues_json) as string[],
  };
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: apiHeaders() });
}

function apiHeaders() {
  return {
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
}

function dollarsToCents(value: number | null) {
  return value === null ? null : Math.round(value * 100);
}

function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function countRows(db: D1Database, query: string, ...bindings: D1Value[]) {
  const row = await db.prepare(query).bind(...bindings).first<{ count: number }>();
  return row?.count ?? 0;
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function centsToDollars(value: number) {
  return value / 100;
}

function createFingerprint(date: string, description: string, amount: number) {
  return [date, normalizeDescription(description), amount.toFixed(2)].join('|');
}

function normalizeDescription(description: string) {
  return description.toLowerCase().replace(/\s+/g, ' ').trim();
}
