export type AccountType =
  | 'transaction'
  | 'savings'
  | 'offset'
  | 'credit-card'
  | 'loan'
  | 'investment'
  | 'business';

export type TransactionKind = 'income' | 'expense' | 'transfer';

export type CategoryGroup =
  | 'Income'
  | 'Housing'
  | 'Living'
  | 'Transport'
  | 'Business'
  | 'Investment Property'
  | 'Tax'
  | 'Transfers';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  currency: 'AUD';
  lastUpdated: string;
}

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  taxDeductible: boolean;
  businessUsePercent?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  accountId: string;
  categoryId: string;
  amount: number;
  kind: TransactionKind;
  merchant: string;
  status: 'cleared' | 'needs-review' | 'reconciled';
  taxTag?: string;
}

export interface PaginatedTransactions {
  rows: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionAuditEvent {
  id: string;
  transactionId: string;
  eventType: 'category_applied' | 'transfer_confirmed' | 'tax_tag_applied' | 'status_changed';
  notes?: string;
  createdAt: string;
}

export interface RecurringTransaction {
  description: string;
  merchant: string;
  amount: number;
  count: number;
  firstDate: string;
  lastDate: string;
  categoryId: string;
}

export interface TaxTag {
  id: string;
  name: string;
  description: string;
}

export interface Loan {
  id: string;
  accountId?: string;
  name: string;
  institution: string;
  balance: number;
  rate: number;
  repayment: number;
  offsetAccountId?: string;
  nextPaymentDate: string;
  purpose?: 'personal' | 'investment-property' | 'business';
  interestDeductible?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  institution: string;
  type: 'cash' | 'property' | 'investment' | 'vehicle' | 'other';
  value: number;
  valuationDate: string;
  notes?: string;
}

export interface Liability {
  id: string;
  name: string;
  institution: string;
  type: 'credit-card' | 'loan' | 'mortgage' | 'tax' | 'other';
  balance: number;
  asOfDate: string;
  notes?: string;
}

export interface NetWorthPoint {
  month: string;
  assets: number;
  liabilities: number;
}

export interface ImportBatch {
  id: string;
  accountId?: string;
  accountName?: string;
  source: string;
  importedAt: string;
  rows: number;
  duplicates: number;
  invalid?: number;
  status: 'staged' | 'complete' | 'review';
}

export type StagedTransactionStatus = 'ready' | 'duplicate' | 'invalid' | 'committed';

export interface StagedTransaction {
  id: string;
  batchId?: string;
  accountId?: string;
  rowNumber: number;
  sourceFile?: string;
  raw: Record<string, string>;
  date: string | null;
  description: string;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  fingerprint: string | null;
  status: StagedTransactionStatus;
  issues: string[];
}

export interface CategoryRule {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  matchType: 'contains' | 'starts_with' | 'exact';
  pattern: string;
  priority: number;
  taxTag?: string;
  businessUsePercent?: number;
  isActive: boolean;
}

export interface CategorySuggestion {
  transactionId: string;
  description: string;
  date: string;
  amount: number;
  currentCategoryId: string;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  taxTag?: string;
  confidence: number;
  reason: string;
}

export interface TransferMatchSuggestion {
  id: string;
  outflowTransactionId: string;
  inflowTransactionId: string;
  outflowDescription: string;
  inflowDescription: string;
  outflowDate: string;
  inflowDate: string;
  amount: number;
  confidence: number;
  status: 'suggested' | 'confirmed' | 'dismissed';
  reason: string;
}

export interface LoanSplitSuggestion {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  principal: number;
  interest: number;
  taxTag: string;
  confidence: number;
  reason: string;
}

export interface ReconciliationSuggestions {
  categorySuggestions: CategorySuggestion[];
  transferMatches: TransferMatchSuggestion[];
  loanSplitSuggestions: LoanSplitSuggestion[];
}
