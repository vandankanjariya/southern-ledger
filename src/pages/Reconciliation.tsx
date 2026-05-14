import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { useDateRange } from '../hooks/useDateRange';
import { categories as mockCategories, transactions as mockTransactions } from '../mock/finance';
import { applyCategorySuggestion, confirmLoanSplit, confirmTransferMatch, getReconciliationSuggestions, listCategories, listTransactions } from '../services/api';
import type { Category, CategorySuggestion, LoanSplitSuggestion, Transaction, TransferMatchSuggestion } from '../types/finance';
import { filterByDateRange } from '../utils/dateFilters';
import { formatCurrency, formatDate } from '../utils/format';

export default function Reconciliation() {
  const { selectedRange } = useDateRange();
  const from = format(selectedRange.start, 'yyyy-MM-dd');
  const to = format(selectedRange.end, 'yyyy-MM-dd');
  const fallbackTransactions = useMemo(() => filterByDateRange(mockTransactions, selectedRange), [selectedRange]);
  const loadTransactions = useCallback(() => listTransactions(from, to), [from, to]);
  const loadSuggestions = useCallback(() => getReconciliationSuggestions(from, to), [from, to]);
  const loadCategories = useCallback(() => listCategories(), []);
  const { data: rangeTransactions, reload: reloadTransactions } = useApiData(loadTransactions, fallbackTransactions);
  const { data: suggestions, reload: reloadSuggestions } = useApiData(loadSuggestions, { categorySuggestions: [], transferMatches: [], loanSplitSuggestions: [] });
  const { data: categories } = useApiData<Category[]>(loadCategories, mockCategories);
  const [reviewCategoryIds, setReviewCategoryIds] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const reviewRows = useMemo(() => rangeTransactions.filter((txn) => txn.status !== 'reconciled'), [rangeTransactions]);
  const matchedTransfers = useMemo(() => rangeTransactions.filter((txn) => txn.kind === 'transfer').length, [rangeTransactions]);
  const reconciledCount = useMemo(() => rangeTransactions.filter((txn) => txn.status === 'reconciled').length, [rangeTransactions]);

  async function handleApplyCategory(suggestion: CategorySuggestion) {
    setActionMessage(null);
    setActionError(null);

    try {
      await applyCategorySuggestion(suggestion.transactionId, suggestion.suggestedCategoryId, suggestion.taxTag);
      setActionMessage(`Applied ${suggestion.suggestedCategoryName} to ${suggestion.description}.`);
      reloadTransactions();
      reloadSuggestions();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to apply category');
    }
  }

  async function handleConfirmTransfer(suggestion: TransferMatchSuggestion) {
    setActionMessage(null);
    setActionError(null);

    try {
      await confirmTransferMatch(suggestion.id);
      setActionMessage(`Confirmed transfer match for ${formatCurrency(suggestion.amount, true)}.`);
      reloadTransactions();
      reloadSuggestions();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to confirm transfer');
    }
  }

  async function handleConfirmLoanSplit(suggestion: LoanSplitSuggestion) {
    setActionMessage(null);
    setActionError(null);

    try {
      await confirmLoanSplit(suggestion.transactionId, suggestion.principal, suggestion.interest);
      setActionMessage(`Confirmed loan split for ${suggestion.description}.`);
      reloadTransactions();
      reloadSuggestions();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to confirm loan split');
    }
  }

  async function handleReconcileTransaction(transaction: Transaction) {
    const categoryId = getReviewCategoryId(transaction);
    const category = categories.find((item) => item.id === categoryId);
    setActionMessage(null);
    setActionError(null);

    if (!categoryId) {
      setActionError('Choose a category before reconciling.');
      return;
    }

    try {
      await applyCategorySuggestion(transaction.id, categoryId);
      setActionMessage(`Reconciled ${transaction.description}${category ? ` as ${category.name}` : ''}.`);
      reloadTransactions();
      reloadSuggestions();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to reconcile transaction');
    }
  }

  function getReviewCategoryId(transaction: Transaction) {
    if (reviewCategoryIds[transaction.id]) {
      return reviewCategoryIds[transaction.id];
    }

    if (categories.some((category) => category.id === transaction.categoryId)) {
      return transaction.categoryId;
    }

    return categories[0]?.id ?? '';
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reconciliation</h1>
        <p className="mt-1 text-sm text-slate-500">Review queue for {selectedRange.label} transaction classification, transfers, and tax tagging.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-slate-500">Open items</p><p className="mt-2 text-2xl font-semibold">{reviewRows.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Matched transfers</p><p className="mt-2 text-2xl font-semibold">{matchedTransfers}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Reconciled</p><p className="mt-2 text-2xl font-semibold">{reconciledCount}</p></CardContent></Card>
      </div>
      {actionMessage && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{actionMessage}</p>}
      {actionError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Rule suggestions</h2></CardHeader>
          <DataTable<CategorySuggestion>
            rows={suggestions.categorySuggestions}
            getRowKey={(row) => row.transactionId}
            emptyMessage="No category rule suggestions for this range."
            columns={[
              { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
              { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
              { key: 'category', header: 'Suggested', render: (row) => row.suggestedCategoryName },
              { key: 'confidence', header: 'Confidence', align: 'right', render: (row) => `${row.confidence}%` },
              {
                key: 'action',
                header: 'Action',
                render: (row) => (
                  <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => void handleApplyCategory(row)}>
                    Apply
                  </button>
                ),
              },
            ]}
          />
        </Card>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Transfer matches</h2></CardHeader>
          <DataTable<TransferMatchSuggestion>
            rows={suggestions.transferMatches}
            getRowKey={(row) => row.id}
            emptyMessage="No transfer matches suggested for this range."
            columns={[
              { key: 'date', header: 'Dates', render: (row) => `${formatDate(row.outflowDate)} / ${formatDate(row.inflowDate)}` },
              { key: 'description', header: 'Pair', render: (row) => <span className="font-medium text-ink">{row.outflowDescription} / {row.inflowDescription}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
              { key: 'confidence', header: 'Confidence', align: 'right', render: (row) => `${row.confidence}%` },
              {
                key: 'action',
                header: 'Action',
                render: (row) => (
                  <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => void handleConfirmTransfer(row)}>
                    Confirm
                  </button>
                ),
              },
            ]}
          />
        </Card>
      </div>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Loan split suggestions</h2></CardHeader>
        <DataTable<LoanSplitSuggestion>
          rows={suggestions.loanSplitSuggestions}
          getRowKey={(row) => row.id}
          emptyMessage="No loan repayment split suggestions for this range."
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
            { key: 'principal', header: 'Principal', align: 'right', render: (row) => formatCurrency(row.principal, true) },
            { key: 'interest', header: 'Interest', align: 'right', render: (row) => formatCurrency(row.interest, true) },
            { key: 'tax', header: 'Tax tag', render: (row) => <Badge tone="brand">{row.taxTag}</Badge> },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => void handleConfirmLoanSplit(row)}>
                  Confirm
                </button>
              ),
            },
          ]}
        />
      </Card>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Open items</h2></CardHeader>
        <DataTable<Transaction>
          rows={reviewRows}
          getRowKey={(row) => row.id}
          clientPagination
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
            {
              key: 'category',
              header: 'Category',
              render: (row) => (
                <select
                  className="min-w-44 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-700"
                  value={getReviewCategoryId(row)}
                  onChange={(event) => setReviewCategoryIds((value) => ({ ...value, [row.id]: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              ),
            },
            { key: 'tax', header: 'Tax tag', render: (row) => row.taxTag ? <Badge tone="brand">{row.taxTag}</Badge> : '-' },
            { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <button type="button" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={categories.length === 0} onClick={() => void handleReconcileTransaction(row)}>
                  Reconcile
                </button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
