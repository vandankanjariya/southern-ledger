import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { BarBreakdownChart } from '../components/charts/BarBreakdownChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { useDateRange } from '../hooks/useDateRange';
import { categories as mockCategories, transactions as mockTransactions } from '../mock/finance';
import { listCategories, listRecurringTransactions, listTransactions } from '../services/api';
import type { RecurringTransaction, Transaction } from '../types/finance';
import { filterByDateRange } from '../utils/dateFilters';
import { downloadCsv } from '../utils/exportCsv';
import { formatCurrency, formatDate } from '../utils/format';

export default function Reports() {
  const { selectedRange } = useDateRange();
  const from = format(selectedRange.start, 'yyyy-MM-dd');
  const to = format(selectedRange.end, 'yyyy-MM-dd');
  const fallbackTransactions = useMemo(() => filterByDateRange(mockTransactions, selectedRange), [selectedRange]);
  const loadTransactions = useCallback(() => listTransactions(from, to), [from, to]);
  const loadCategories = useCallback(() => listCategories(), []);
  const loadRecurring = useCallback(() => listRecurringTransactions(from, to), [from, to]);
  const { data: transactions } = useApiData(loadTransactions, fallbackTransactions);
  const { data: categories } = useApiData(loadCategories, mockCategories);
  const { data: recurringRows } = useApiData<RecurringTransaction[]>(loadRecurring, []);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const businessRows = transactions.filter((txn) => categoryById.get(txn.categoryId)?.group === 'Business');
  const propertyRows = transactions.filter((txn) => categoryById.get(txn.categoryId)?.group === 'Investment Property' || txn.taxTag === 'Investment property');
  const taxRows = transactions.filter((txn) => txn.taxTag || categoryById.get(txn.categoryId)?.taxDeductible);
  const income = transactions.filter((txn) => txn.kind === 'income').reduce((sum, txn) => sum + txn.amount, 0);
  const expenses = Math.abs(transactions.filter((txn) => txn.kind === 'expense').reduce((sum, txn) => sum + txn.amount, 0));
  const deductible = Math.abs(taxRows.reduce((sum, txn) => sum + txn.amount, 0));
  const monthlyCashFlow = useMemo(() => {
    const months = new Map<string, number>();
    for (const txn of transactions) {
      if (txn.kind !== 'transfer') {
        const month = format(new Date(txn.date), 'MMM');
        months.set(month, (months.get(month) ?? 0) + txn.amount);
      }
    }
    return Array.from(months.entries()).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);
  const expenseMix = useMemo(
    () =>
      categories
        .map((category) => ({
          name: category.name,
          value: Math.abs(transactions.filter((txn) => txn.kind === 'expense' && txn.categoryId === category.id).reduce((sum, txn) => sum + txn.amount, 0)),
        }))
        .filter((item) => item.value > 0),
    [categories, transactions],
  );

  function exportRows(filename: string, rows: Transaction[]) {
    downloadCsv(filename, rows.map((row) => ({
      date: row.date,
      description: row.description,
      category: categoryById.get(row.categoryId)?.name,
      taxTag: row.taxTag,
      amount: row.amount,
      status: row.status,
    })));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Cash flow, property, business, and accountant-ready summaries for {selectedRange.label}.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><p className="text-sm text-slate-500">Income</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(income)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Expenses</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(expenses)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Deductible review</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(deductible)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Net cash flow</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(income - expenses)}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card><CardHeader><h2 className="text-base font-semibold">Cash flow</h2></CardHeader><CardContent><BarBreakdownChart data={monthlyCashFlow} xKey="month" dataKey="amount" /></CardContent></Card>
        <Card><CardHeader><h2 className="text-base font-semibold">Expense mix</h2></CardHeader><CardContent><DonutChart data={expenseMix} /></CardContent></Card>
      </div>
      <ReportTable title="Investment property" rows={propertyRows} onExport={() => exportRows(`investment-property-${selectedRange.label}.csv`, propertyRows)} categoryById={categoryById} />
      <ReportTable title="Business expenses" rows={businessRows} onExport={() => exportRows(`business-expenses-${selectedRange.label}.csv`, businessRows)} categoryById={categoryById} />
      <ReportTable title="Accountant summary export" rows={taxRows} onExport={() => exportRows(`accountant-summary-${selectedRange.label}.csv`, taxRows)} categoryById={categoryById} />
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Recurring transaction candidates</h2></CardHeader>
        <DataTable<RecurringTransaction>
          rows={recurringRows}
          getRowKey={(row) => `${row.description}-${row.amount}-${row.firstDate}`}
          emptyMessage="No recurring transaction candidates found for this range."
          clientPagination
          columns={[
            { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
            { key: 'merchant', header: 'Merchant', render: (row) => row.merchant || '-' },
            { key: 'count', header: 'Count', align: 'right', render: (row) => row.count },
            { key: 'date', header: 'Range', render: (row) => `${formatDate(row.firstDate)} - ${formatDate(row.lastDate)}` },
            { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
          ]}
        />
      </Card>
    </div>
  );
}

function ReportTable({ title, rows, onExport, categoryById }: {
  title: string;
  rows: Transaction[];
  onExport: () => void;
  categoryById: Map<string, { name: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-700" onClick={onExport} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </CardHeader>
      <DataTable<Transaction>
        rows={rows}
        getRowKey={(row) => row.id}
        clientPagination
        columns={[
          { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
          { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
          { key: 'category', header: 'Category', render: (row) => categoryById.get(row.categoryId)?.name ?? '-' },
          { key: 'tag', header: 'Tax tag', render: (row) => row.taxTag ? <Badge tone="brand">{row.taxTag}</Badge> : '-' },
          { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
        ]}
      />
    </Card>
  );
}
