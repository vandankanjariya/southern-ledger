import type {
  Account,
  Asset,
  Category,
  CategoryRule,
  ImportBatch,
  Liability,
  Loan,
  NetWorthPoint,
  PaginatedTransactions,
  ReconciliationSuggestions,
  RecurringTransaction,
  StagedTransaction,
  TaxTag,
  Transaction,
  TransactionAuditEvent,
} from '../types/finance';

interface StageImportResponse {
  batch: {
    id: string;
    accountId: string;
    source: string;
    rows: number;
    duplicates: number;
    invalid: number;
    status: ImportBatch['status'];
  };
  rows: Array<Omit<StagedTransaction, 'id' | 'sourceFile'>>;
}

interface CommitImportResponse {
  committed: number;
}

export async function listImportBatches(): Promise<ImportBatch[]> {
  return apiRequest('/api/import-batches');
}

export async function listAccounts(): Promise<Account[]> {
  return apiRequest('/api/accounts');
}

export async function createAccount(payload: {
  institution: string;
  name: string;
  type: Account['type'];
  balance: number;
  lastUpdated: string;
}): Promise<{ id: string }> {
  return apiRequest('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAccount(accountId: string, payload: {
  institution: string;
  name: string;
  type: Account['type'];
  balance: number;
  lastUpdated: string;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/accounts/${accountId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(accountId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

export async function listCategories(): Promise<Category[]> {
  return apiRequest('/api/categories');
}

export async function createCategory(payload: {
  name: string;
  group: Category['group'];
  taxDeductible: boolean;
  businessUsePercent?: number;
}): Promise<{ id: string }> {
  return apiRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(categoryId: string, payload: {
  name: string;
  group: Category['group'];
  taxDeductible: boolean;
  businessUsePercent?: number;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export async function listTransactions(from?: string, to?: string): Promise<Transaction[]> {
  const params = new URLSearchParams();

  if (from) {
    params.set('from', from);
  }

  if (to) {
    params.set('to', to);
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest(`/api/transactions${query}`);
}

export async function listTransactionsPage(options: {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  status?: Transaction['status'] | 'all';
  taxOnly?: boolean;
}): Promise<PaginatedTransactions> {
  const params = new URLSearchParams();

  if (options.from) {
    params.set('from', options.from);
  }

  if (options.to) {
    params.set('to', options.to);
  }

  params.set('page', String(options.page ?? 1));
  params.set('pageSize', String(options.pageSize ?? 20));

  if (options.query?.trim()) {
    params.set('q', options.query.trim());
  }

  if (options.status && options.status !== 'all') {
    params.set('status', options.status);
  }

  if (options.taxOnly) {
    params.set('taxOnly', 'true');
  }

  return apiRequest(`/api/transactions?${params.toString()}`);
}

export async function listTransactionAuditEvents(transactionId: string): Promise<TransactionAuditEvent[]> {
  return apiRequest(`/api/transactions/${transactionId}/events`);
}

export async function listRecurringTransactions(from?: string, to?: string): Promise<RecurringTransaction[]> {
  const params = new URLSearchParams();

  if (from) {
    params.set('from', from);
  }

  if (to) {
    params.set('to', to);
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest(`/api/recurring-transactions${query}`);
}

export async function listLoans(): Promise<Loan[]> {
  return apiRequest('/api/loans');
}

export async function createLoan(payload: {
  accountId?: string;
  name: string;
  institution: string;
  balance: number;
  rate: number;
  repayment: number;
  offsetAccountId?: string;
  nextPaymentDate: string;
  purpose: NonNullable<Loan['purpose']>;
  interestDeductible: boolean;
}): Promise<{ id: string }> {
  return apiRequest('/api/loans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLoan(loanId: string, payload: {
  accountId?: string;
  name: string;
  institution: string;
  balance: number;
  rate: number;
  repayment: number;
  offsetAccountId?: string;
  nextPaymentDate: string;
  purpose: NonNullable<Loan['purpose']>;
  interestDeductible: boolean;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/loans/${loanId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listAssets(): Promise<Asset[]> {
  return apiRequest('/api/assets');
}

export async function createAsset(payload: {
  name: string;
  institution: string;
  type: Asset['type'];
  value: number;
  valuationDate: string;
  notes?: string;
}): Promise<{ id: string }> {
  return apiRequest('/api/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAsset(assetId: string, payload: {
  name: string;
  institution: string;
  type: Asset['type'];
  value: number;
  valuationDate: string;
  notes?: string;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/assets/${assetId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listLiabilities(): Promise<Liability[]> {
  return apiRequest('/api/liabilities');
}

export async function createLiability(payload: {
  name: string;
  institution: string;
  type: Liability['type'];
  balance: number;
  asOfDate: string;
  notes?: string;
}): Promise<{ id: string }> {
  return apiRequest('/api/liabilities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLiability(liabilityId: string, payload: {
  name: string;
  institution: string;
  type: Liability['type'];
  balance: number;
  asOfDate: string;
  notes?: string;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/liabilities/${liabilityId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listNetWorthHistory(): Promise<NetWorthPoint[]> {
  return apiRequest('/api/net-worth-history');
}

export async function listCategoryRules(): Promise<CategoryRule[]> {
  return apiRequest('/api/category-rules');
}

export async function createCategoryRule(payload: {
  name: string;
  categoryId: string;
  matchType: CategoryRule['matchType'];
  pattern: string;
  priority: number;
  taxTag?: string;
  businessUsePercent?: number;
}): Promise<{ id: string }> {
  return apiRequest('/api/category-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryRule(ruleId: string, payload: {
  name: string;
  categoryId: string;
  matchType: CategoryRule['matchType'];
  pattern: string;
  priority: number;
  taxTag?: string;
  businessUsePercent?: number;
  isActive: boolean;
}): Promise<{ ok: boolean }> {
  return apiRequest(`/api/category-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoryRule(ruleId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/category-rules/${ruleId}`, {
    method: 'DELETE',
  });
}

export async function listTaxTags(): Promise<TaxTag[]> {
  return apiRequest('/api/tax-tags');
}

export async function createTaxTag(payload: { name: string; description: string }): Promise<{ id: string }> {
  return apiRequest('/api/tax-tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteTaxTag(tagId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/tax-tags/${tagId}`, {
    method: 'DELETE',
  });
}

export async function exportFullBackup(): Promise<unknown> {
  return apiRequest('/api/export/full');
}

export async function getReconciliationSuggestions(from?: string, to?: string): Promise<ReconciliationSuggestions> {
  const params = new URLSearchParams();

  if (from) {
    params.set('from', from);
  }

  if (to) {
    params.set('to', to);
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest(`/api/reconciliation/suggestions${query}`);
}

export async function applyCategorySuggestion(transactionId: string, categoryId: string, taxTag?: string): Promise<{ ok: boolean }> {
  return apiRequest('/api/reconciliation/apply-category', {
    method: 'POST',
    body: JSON.stringify({ transactionId, categoryId, taxTag, status: 'reconciled' }),
  });
}

export async function confirmTransferMatch(matchId: string): Promise<{ ok: boolean }> {
  return apiRequest('/api/reconciliation/confirm-transfer', {
    method: 'POST',
    body: JSON.stringify({ matchId }),
  });
}

export async function confirmLoanSplit(transactionId: string, principal: number, interest: number): Promise<{ ok: boolean }> {
  return apiRequest('/api/reconciliation/confirm-loan-split', {
    method: 'POST',
    body: JSON.stringify({ transactionId, principal, interest }),
  });
}

export async function stageImport(accountId: string, source: string, rows: StagedTransaction[]): Promise<StageImportResponse> {
  return apiRequest('/api/imports/stage', {
    method: 'POST',
    body: JSON.stringify({
      accountId,
      source,
      rows: rows.map((row) => ({
        rowNumber: row.rowNumber,
        raw: row.raw,
        date: row.date,
        description: row.description,
        amount: row.amount,
        debit: row.debit,
        credit: row.credit,
        balance: row.balance,
      })),
    }),
  });
}

export async function commitImportBatch(batchId: string): Promise<CommitImportResponse> {
  return apiRequest(`/api/import-batches/${batchId}/commit`, {
    method: 'POST',
  });
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    window.location.reload();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
