import { Banknote, CreditCard, Landmark, TrendingUp, WalletCards } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { BarBreakdownChart } from '../components/charts/BarBreakdownChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { useApiData } from '../hooks/useApiData';
import { useDateRange } from '../hooks/useDateRange';
import { accounts as mockAccounts, assets as mockAssets, categories as mockCategories, netWorthHistory, transactions as mockTransactions } from '../mock/finance';
import { listAccounts, listAssets, listCategories, listTransactions, listTransactionsPage } from '../services/api';
import type { PaginatedTransactions, Transaction } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/format';

export default function Overview() {
  const { selectedRange } = useDateRange();
  const from = format(selectedRange.start, 'yyyy-MM-dd');
  const to = format(selectedRange.end, 'yyyy-MM-dd');
  const loadAccounts = useCallback(() => listAccounts(), []);
  const loadAssets = useCallback(() => listAssets(), []);
  const loadCategories = useCallback(() => listCategories(), []);
  const loadTransactions = useCallback(() => listTransactions(from, to), [from, to]);
  const loadRecentTransactions = useCallback(() => listTransactionsPage({ from, to, page: 1, pageSize: 6 }), [from, to]);
  const fallbackTransactions = useMemo(() => mockTransactions.filter((txn) => txn.date >= from && txn.date <= to), [from, to]);
  const fallbackRecent = useMemo<PaginatedTransactions>(() => ({ rows: fallbackTransactions.slice(0, 6), total: fallbackTransactions.length, page: 1, pageSize: 6 }), [fallbackTransactions]);
  const { data: accounts } = useApiData(loadAccounts, mockAccounts);
  const { data: assets } = useApiData(loadAssets, mockAssets);
  const { data: categories } = useApiData(loadCategories, mockCategories);
  const { data: filteredTransactions } = useApiData(loadTransactions, fallbackTransactions);
  const { data: recentTransactions } = useApiData(loadRecentTransactions, fallbackRecent);
  const income = useMemo(() => filteredTransactions.filter((txn) => txn.kind === 'income').reduce((sum, txn) => sum + txn.amount, 0), [filteredTransactions]);
  const expenses = useMemo(() => Math.abs(filteredTransactions.filter((txn) => txn.kind === 'expense').reduce((sum, txn) => sum + txn.amount, 0)), [filteredTransactions]);
  const cashAssets = accounts.filter((account) => account.balance > 0).reduce((sum, account) => sum + account.balance, 0);
  const totalAssets = cashAssets + assets.reduce((sum, asset) => sum + asset.value, 0);
  const liabilities = Math.abs(accounts.filter((account) => account.balance < 0).reduce((sum, account) => sum + account.balance, 0));
  const latestNetWorth = netWorthHistory[netWorthHistory.length - 1];

  const expenseBreakdown = useMemo(
    () =>
      categories
        .filter((category) => category.group !== 'Income' && category.group !== 'Transfers')
        .map((category) => ({
          name: category.name,
          value: Math.abs(filteredTransactions.filter((txn) => txn.categoryId === category.id && txn.kind === 'expense').reduce((sum, txn) => sum + txn.amount, 0)),
        }))
        .filter((item) => item.value > 0),
    [categories, filteredTransactions],
  );

  const monthlyCashFlow = useMemo(() => {
    const totals = new Map<string, number>();

    for (const txn of filteredTransactions) {
      if (txn.kind === 'transfer') {
        continue;
      }

      const month = format(parseISO(txn.date), 'MMM');
      totals.set(month, (totals.get(month) ?? 0) + txn.amount);
    }

    return Array.from(totals.entries()).map(([month, amount]) => ({ month, amount }));
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">{selectedRange.label} view with transfers excluded from income and expense totals.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Net worth today" value={formatCurrency((latestNetWorth?.assets ?? totalAssets) - (latestNetWorth?.liabilities ?? liabilities))} change="Latest position snapshot" trend="up" icon={TrendingUp} />
        <StatCard label="Income" value={formatCurrency(income)} change="Salary and rental income" trend="up" icon={Banknote} />
        <StatCard label="Expenses" value={formatCurrency(expenses)} change="Transfers excluded" trend="down" icon={CreditCard} />
        <StatCard label="Period cash flow" value={formatCurrency(income - expenses)} change={selectedRange.label} trend={income - expenses >= 0 ? 'up' : 'down'} icon={WalletCards} />
        <StatCard label="Cash assets today" value={formatCurrency(cashAssets)} change="Latest account snapshot" trend="flat" icon={Landmark} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Cash flow by month</h2>
          </CardHeader>
          <CardContent>
            <BarBreakdownChart data={monthlyCashFlow} xKey="month" dataKey="amount" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Expense mix</h2>
          </CardHeader>
          <CardContent>
            <DonutChart data={expenseBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Recent transactions</h2>
        </CardHeader>
        <DataTable<Transaction>
          rows={recentTransactions.rows}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'description', header: 'Description', render: (row) => row.description },
            { key: 'merchant', header: 'Merchant', render: (row) => row.merchant },
            { key: 'kind', header: 'Type', render: (row) => row.kind },
            { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
          ]}
        />
      </Card>
    </div>
  );
}
