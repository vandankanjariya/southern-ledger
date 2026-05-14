import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DonutChart } from '../components/charts/DonutChart';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { useDateRange } from '../hooks/useDateRange';
import { categories as mockCategories, transactions as mockTransactions } from '../mock/finance';
import { createTaxTag, deleteTaxTag, listCategories, listTaxTags, listTransactions } from '../services/api';
import type { Category, TaxTag, Transaction } from '../types/finance';
import { filterByDateRange } from '../utils/dateFilters';
import { downloadCsv } from '../utils/exportCsv';
import { formatCurrency, formatDate } from '../utils/format';

export default function TaxSummary() {
  const { selectedRange } = useDateRange();
  const from = format(selectedRange.start, 'yyyy-MM-dd');
  const to = format(selectedRange.end, 'yyyy-MM-dd');
  const fallbackTransactions = useMemo(() => filterByDateRange(mockTransactions, selectedRange), [selectedRange]);
  const loadCategories = useCallback(() => listCategories(), []);
  const loadTransactions = useCallback(() => listTransactions(from, to), [from, to]);
  const loadTaxTags = useCallback(() => listTaxTags(), []);
  const { data: categories } = useApiData(loadCategories, mockCategories);
  const { data: rangeTransactions } = useApiData(loadTransactions, fallbackTransactions);
  const { data: taxTags, reload: reloadTaxTags } = useApiData<TaxTag[]>(loadTaxTags, []);
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [tagMessage, setTagMessage] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const deductibleRows = useMemo(
    () => rangeTransactions.filter((txn) => txn.taxTag || categoryById.get(txn.categoryId)?.taxDeductible),
    [categoryById, rangeTransactions],
  );
  const deductibleTotal = useMemo(() => Math.abs(deductibleRows.reduce((sum, txn) => sum + txn.amount, 0)), [deductibleRows]);
  const businessDeductible = useMemo(
    () => Math.abs(deductibleRows.filter((txn) => categoryById.get(txn.categoryId)?.group === 'Business').reduce((sum, txn) => sum + txn.amount, 0)),
    [categoryById, deductibleRows],
  );
  const propertyDeductible = useMemo(
    () => Math.abs(deductibleRows.filter((txn) => categoryById.get(txn.categoryId)?.group === 'Investment Property' || txn.taxTag === 'Investment property').reduce((sum, txn) => sum + txn.amount, 0)),
    [categoryById, deductibleRows],
  );
  const chartData = useMemo(
    () =>
      categories
        .filter((category) => category.taxDeductible || deductibleRows.some((txn) => txn.categoryId === category.id && txn.taxTag))
        .map((category) => ({
          name: category.name,
          value: Math.abs(deductibleRows.filter((txn) => txn.categoryId === category.id).reduce((sum, txn) => sum + txn.amount, 0)),
        }))
        .filter((item) => item.value > 0),
    [categories, deductibleRows],
  );
  const taxRelevantCategories = useMemo(
    () => categories.filter((category) => category.taxDeductible || category.group === 'Business' || category.group === 'Investment Property' || category.group === 'Tax'),
    [categories],
  );

  function exportTaxRows() {
    downloadCsv(`tax-summary-${selectedRange.label}.csv`, deductibleRows.map((row) => ({
      date: row.date,
      description: row.description,
      category: categoryById.get(row.categoryId)?.name,
      group: categoryById.get(row.categoryId)?.group,
      taxTag: row.taxTag,
      amount: row.amount,
      status: row.status,
    })));
  }

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTagMessage(null);
    setTagError(null);

    try {
      await createTaxTag({ name: tagName, description: tagDescription });
      setTagName('');
      setTagDescription('');
      setTagMessage('Tax section added.');
      reloadTaxTags();
    } catch (caught) {
      setTagError(caught instanceof Error ? caught.message : 'Unable to add tax section');
    }
  }

  async function handleDeleteTag(tag: TaxTag) {
    if (!window.confirm(`Delete tax section ${tag.name}?`)) {
      return;
    }

    setTagMessage(null);
    setTagError(null);

    try {
      const result = await deleteTaxTag(tag.id);
      if (!result.ok) {
        throw new Error('Tax section is in use and cannot be deleted.');
      }
      setTagMessage('Tax section deleted.');
      reloadTaxTags();
    } catch (caught) {
      setTagError(caught instanceof Error ? caught.message : 'Unable to delete tax section');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tax Summary</h1>
        <p className="mt-1 text-sm text-slate-500">Deductible and tax-tagged transaction review for {selectedRange.label}.</p>
      </header>
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Tax category settings</h2>
          <Link className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-700" to="/categories">Manage categories</Link>
        </CardHeader>
        <DataTable<Category>
          rows={taxRelevantCategories}
          getRowKey={(row) => row.id}
          emptyMessage="No tax-relevant categories configured."
          columns={[
            { key: 'name', header: 'Category', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'group', header: 'Group', render: (row) => row.group },
            { key: 'deductible', header: 'Tax deductible', render: (row) => <Badge tone={row.taxDeductible ? 'success' : 'neutral'}>{row.taxDeductible ? 'Yes' : 'No'}</Badge> },
            { key: 'business', header: 'Business use', align: 'right', render: (row) => (row.businessUsePercent === undefined ? '-' : `${row.businessUsePercent}%`) },
          ]}
        />
      </Card>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Tax sections</h2></CardHeader>
        <form className="grid gap-3 p-5 md:grid-cols-[220px_1fr_auto]" onSubmit={handleCreateTag}>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Section name" required />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={tagDescription} onChange={(event) => setTagDescription(event.target.value)} placeholder="Description" />
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">Add</button>
          {tagMessage && <p className="text-sm font-medium text-emerald-700 md:col-span-3">{tagMessage}</p>}
          {tagError && <p className="text-sm font-medium text-rose-700 md:col-span-3">{tagError}</p>}
        </form>
        <DataTable<TaxTag>
          rows={taxTags}
          getRowKey={(row) => row.id}
          emptyMessage="No custom tax sections configured."
          columns={[
            { key: 'name', header: 'Section', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'description', header: 'Description', render: (row) => row.description || '-' },
            { key: 'action', header: 'Action', render: (row) => <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" type="button" onClick={() => handleDeleteTag(row)}>Delete</button> },
          ]}
        />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-slate-500">Deductible review</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(deductibleTotal)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Investment property</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(propertyDeductible)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Business expenses</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(businessDeductible)}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Deductible mix</h2></CardHeader>
          <CardContent>
            <DonutChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Tax tagged transactions</h2>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-700" onClick={exportTaxRows} disabled={deductibleRows.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </CardHeader>
          <DataTable<Transaction>
            rows={deductibleRows}
            getRowKey={(row) => row.id}
            clientPagination
            columns={[
              { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
              { key: 'description', header: 'Description', render: (row) => <span className="font-medium text-ink">{row.description}</span> },
              { key: 'category', header: 'Category', render: (row) => categoryById.get(row.categoryId)?.name ?? '-' },
              { key: 'tag', header: 'Tag', render: (row) => row.taxTag ? <Badge tone="brand">{row.taxTag}</Badge> : '-' },
              { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, true) },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
