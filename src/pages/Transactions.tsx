import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { useDateRange } from '../hooks/useDateRange';
import { accounts as mockAccounts, categories as mockCategories, transactions as mockTransactions } from '../mock/finance';
import { applyCategorySuggestion, listAccounts, listCategories, listTransactionAuditEvents, listTransactionsPage } from '../services/api';
import type { PaginatedTransactions, Transaction, TransactionAuditEvent } from '../types/finance';
import { filterByDateRange } from '../utils/dateFilters';
import { formatCurrency, formatDate } from '../utils/format';

export default function Transactions() {
  const { selectedRange } = useDateRange();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Transaction['status']>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const from = format(selectedRange.start, 'yyyy-MM-dd');
  const to = format(selectedRange.end, 'yyyy-MM-dd');
  const fallbackTransactions = useMemo(() => filterByDateRange(mockTransactions, selectedRange), [selectedRange]);
  const fallbackPage = useMemo<PaginatedTransactions>(() => {
    const filtered = fallbackTransactions.filter((transaction) => status === 'all' || transaction.status === status);
    return {
      rows: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }, [fallbackTransactions, page, pageSize, status]);
  const loadTransactions = useCallback(() => listTransactionsPage({ from, to, page, pageSize, query, status }), [from, page, pageSize, query, status, to]);
  const loadAccounts = useCallback(() => listAccounts(), []);
  const loadCategories = useCallback(() => listCategories(), []);
  const { data: transactionsPage, reload: reloadTransactions } = useApiData(loadTransactions, fallbackPage);
  const { data: accounts } = useApiData(loadAccounts, mockAccounts);
  const { data: categories } = useApiData(loadCategories, mockCategories);
  const [categorySelections, setCategorySelections] = useState<Record<string, string>>({});
  const [auditTransaction, setAuditTransaction] = useState<Transaction | null>(null);
  const [auditEvents, setAuditEvents] = useState<TransactionAuditEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(transactionsPage.total / transactionsPage.pageSize));

  useEffect(() => {
    setPage(1);
  }, [from, pageSize, query, status, to]);

  function selectedCategoryId(transaction: Transaction) {
    if (categorySelections[transaction.id]) {
      return categorySelections[transaction.id];
    }

    if (categories.some((category) => category.id === transaction.categoryId)) {
      return transaction.categoryId;
    }

    return categories[0]?.id ?? '';
  }

  async function handleUpdateCategory(transaction: Transaction) {
    const categoryId = selectedCategoryId(transaction);
    const category = categories.find((item) => item.id === categoryId);
    setMessage(null);
    setError(null);

    if (!categoryId) {
      setError('Choose a category before updating the transaction.');
      return;
    }

    try {
      await applyCategorySuggestion(transaction.id, categoryId);
      setMessage(`Updated ${transaction.description}${category ? ` to ${category.name}` : ''}.`);
      reloadTransactions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update category');
    }
  }

  async function handleViewAudit(transaction: Transaction) {
    setAuditTransaction(transaction);
    setAuditEvents([]);
    setError(null);

    try {
      setAuditEvents(await listTransactionAuditEvents(transaction.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load audit trail');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Transaction ledger for {selectedRange.label} with reconciliation status and tax tags.</p>
      </header>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">{selectedRange.label} transactions</h2>
            <Link className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white" to="/reconciliation">Open review queue</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
            <input
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search description, merchant, account, category"
            />
            <select
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              aria-label="Reconciliation status"
            >
              <option value="all">All statuses</option>
              <option value="cleared">Cleared</option>
              <option value="needs-review">Needs review</option>
              <option value="reconciled">Reconciled</option>
            </select>
            <select
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              aria-label="Rows per page"
            >
              {[10, 20, 50, 100].map((option) => (
                <option key={option} value={option}>{option} / page</option>
              ))}
            </select>
          </div>
          {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        </CardHeader>
        <DataTable<Transaction>
          rows={transactionsPage.rows}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
            { key: 'account', header: 'Account', render: (row) => accounts.find((account) => account.id === row.accountId)?.name },
            {
              key: 'category',
              header: 'Category',
              render: (row) => (
                <select
                  className="min-w-44 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-700"
                  value={selectedCategoryId(row)}
                  onChange={(event) => setCategorySelections((value) => ({ ...value, [row.id]: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              ),
            },
            { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'needs-review' ? 'warning' : row.status === 'reconciled' ? 'success' : 'neutral'}>{row.status}</Badge> },
            { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={categories.length === 0 || selectedCategoryId(row) === row.categoryId}
                    onClick={() => void handleUpdateCategory(row)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700"
                    onClick={() => void handleViewAudit(row)}
                  >
                    Audit
                  </button>
                </div>
              ),
            },
          ]}
        />
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, transactionsPage.total)} of {transactionsPage.total}
          </span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:text-slate-400" type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:text-slate-400" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </div>
      </Card>
      {auditTransaction && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Audit trail: {auditTransaction.description}</h2>
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-slate-700" type="button" onClick={() => setAuditTransaction(null)}>Close</button>
          </CardHeader>
          <DataTable<TransactionAuditEvent>
            rows={auditEvents}
            getRowKey={(row) => row.id}
            emptyMessage="No reconciliation events recorded for this transaction."
            columns={[
              { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
              { key: 'event', header: 'Event', render: (row) => row.eventType },
              { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '-' },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
