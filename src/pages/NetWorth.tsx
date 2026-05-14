import { Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { AreaTrendChart } from '../components/charts/AreaTrendChart';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { accounts as mockAccounts, assets as mockAssets, liabilities as mockLiabilities, netWorthHistory as mockNetWorthHistory } from '../mock/finance';
import { createAsset, createLiability, listAccounts, listAssets, listLiabilities, listNetWorthHistory, updateAsset, updateLiability } from '../services/api';
import type { Asset, Liability } from '../types/finance';
import { downloadCsv } from '../utils/exportCsv';
import { formatCurrency, formatDate } from '../utils/format';

const assetTypes: Asset['type'][] = ['property', 'investment', 'vehicle', 'cash', 'other'];
const liabilityTypes: Liability['type'][] = ['loan', 'mortgage', 'credit-card', 'tax', 'other'];

const emptyAssetForm = {
  name: '',
  institution: '',
  type: 'property' as Asset['type'],
  value: '',
  valuationDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

const emptyLiabilityForm = {
  name: '',
  institution: '',
  type: 'loan' as Liability['type'],
  balance: '',
  asOfDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function NetWorth() {
  const loadAccounts = useCallback(() => listAccounts(), []);
  const loadAssets = useCallback(() => listAssets(), []);
  const loadLiabilities = useCallback(() => listLiabilities(), []);
  const loadNetWorthHistory = useCallback(() => listNetWorthHistory(), []);
  const { data: accounts } = useApiData(loadAccounts, mockAccounts);
  const { data: assets, reload: reloadAssets } = useApiData(loadAssets, mockAssets);
  const { data: liabilities, reload: reloadLiabilities } = useApiData(loadLiabilities, mockLiabilities);
  const { data: netWorthHistory } = useApiData(loadNetWorthHistory, mockNetWorthHistory);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const [liabilityForm, setLiabilityForm] = useState(emptyLiabilityForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cashAssets = useMemo(
    () =>
      accounts
        .filter((account) => account.balance > 0 && account.type !== 'loan' && account.type !== 'credit-card')
        .reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );
  const manualAssets = useMemo(() => assets.reduce((sum, asset) => sum + asset.value, 0), [assets]);
  const accountLiabilities = useMemo(
    () => Math.abs(accounts.filter((account) => account.balance < 0).reduce((sum, account) => sum + account.balance, 0)),
    [accounts],
  );
  const manualLiabilities = useMemo(() => liabilities.reduce((sum, liability) => sum + liability.balance, 0), [liabilities]);
  const totalAssets = cashAssets + manualAssets;
  const totalLiabilities = accountLiabilities + manualLiabilities;
  const currentNetWorth = totalAssets - totalLiabilities;
  const previous = netWorthHistory[netWorthHistory.length - 2];
  const previousNetWorth = previous ? previous.assets - previous.liabilities : currentNetWorth;

  const chartData = netWorthHistory.map((point) => ({
    month: point.month,
    netWorth: point.assets - point.liabilities,
  }));
  const positionRows = [
    ...accounts.map((account) => ({
      id: account.id,
      name: account.name,
      institution: account.institution,
      type: account.type,
      value: account.balance,
    })),
    ...assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      institution: asset.institution,
      type: asset.type,
      value: asset.value,
    })),
    ...liabilities.map((liability) => ({
      id: liability.id,
      name: liability.name,
      institution: liability.institution,
      type: liability.type,
      value: -liability.balance,
    })),
  ];

  function exportPositions() {
    downloadCsv('net-worth-positions.csv', positionRows.map((row) => ({
      name: row.name,
      institution: row.institution,
      type: row.type,
      value: row.value,
    })));
  }

  function startEditAsset(asset: Asset) {
    setEditingAssetId(asset.id);
    setAssetForm({
      name: asset.name,
      institution: asset.institution,
      type: asset.type,
      value: String(asset.value),
      valuationDate: asset.valuationDate,
      notes: asset.notes ?? '',
    });
    setMessage(null);
    setError(null);
  }

  function startEditLiability(liability: Liability) {
    setEditingLiabilityId(liability.id);
    setLiabilityForm({
      name: liability.name,
      institution: liability.institution,
      type: liability.type,
      balance: String(liability.balance),
      asOfDate: liability.asOfDate,
      notes: liability.notes ?? '',
    });
    setMessage(null);
    setError(null);
  }

  async function handleAssetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const value = Number(assetForm.value);
    if (!Number.isFinite(value) || value < 0) {
      setError('Asset value must be a valid positive number.');
      return;
    }

    try {
      const payload = { ...assetForm, value, notes: assetForm.notes || undefined };
      if (editingAssetId) {
        await updateAsset(editingAssetId, payload);
        setMessage(`Updated ${assetForm.name}.`);
      } else {
        await createAsset(payload);
        setMessage(`Added ${assetForm.name}.`);
      }
      setEditingAssetId(null);
      setAssetForm(emptyAssetForm);
      reloadAssets();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save asset');
    }
  }

  async function handleLiabilitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const balance = Number(liabilityForm.balance);
    if (!Number.isFinite(balance) || balance < 0) {
      setError('Liability balance must be a valid positive number.');
      return;
    }

    try {
      const payload = { ...liabilityForm, balance, notes: liabilityForm.notes || undefined };
      if (editingLiabilityId) {
        await updateLiability(editingLiabilityId, payload);
        setMessage(`Updated ${liabilityForm.name}.`);
      } else {
        await createLiability(payload);
        setMessage(`Added ${liabilityForm.name}.`);
      }
      setEditingLiabilityId(null);
      setLiabilityForm(emptyLiabilityForm);
      reloadLiabilities();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save liability');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Net Worth</h1>
        <p className="mt-1 text-sm text-slate-500">Current asset and liability position using account balances and manual valuation records.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-slate-500">Current net worth</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(currentNetWorth)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Monthly movement</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(currentNetWorth - previousNetWorth)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Tracked positions</p><p className="mt-2 text-2xl font-semibold">{positionRows.length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Net worth trend</h2></CardHeader>
        <CardContent><AreaTrendChart data={chartData} dataKey="netWorth" xKey="month" /></CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-base font-semibold">{editingAssetId ? 'Edit asset' : 'Add asset'}</h2></CardHeader>
          <AssetForm
            mode="asset"
            form={assetForm}
            types={assetTypes}
            onSubmit={handleAssetSubmit}
            onCancel={() => {
              setEditingAssetId(null);
              setAssetForm(emptyAssetForm);
            }}
            onChange={setAssetForm}
            isEditing={Boolean(editingAssetId)}
          />
        </Card>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">{editingLiabilityId ? 'Edit liability' : 'Add liability'}</h2></CardHeader>
          <LiabilityForm
            mode="liability"
            form={liabilityForm}
            types={liabilityTypes}
            onSubmit={handleLiabilitySubmit}
            onCancel={() => {
              setEditingLiabilityId(null);
              setLiabilityForm(emptyLiabilityForm);
            }}
            onChange={setLiabilityForm}
            isEditing={Boolean(editingLiabilityId)}
          />
        </Card>
      </div>
      {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Position register</h2>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-700" onClick={exportPositions}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </CardHeader>
        <DataTable<(typeof positionRows)[number]>
          rows={positionRows}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Position', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'institution', header: 'Institution', render: (row) => row.institution },
            { key: 'type', header: 'Type', render: (row) => row.type },
            { key: 'value', header: 'Value', align: 'right', render: (row) => formatCurrency(row.value, true) },
          ]}
        />
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Manual assets</h2></CardHeader>
          <DataTable<Asset>
            rows={assets}
            getRowKey={(row) => row.id}
            columns={[
              { key: 'name', header: 'Asset', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
              { key: 'institution', header: 'Institution', render: (row) => row.institution },
              { key: 'type', header: 'Type', render: (row) => row.type },
              { key: 'date', header: 'Valuation', render: (row) => formatDate(row.valuationDate) },
              { key: 'value', header: 'Value', align: 'right', render: (row) => formatCurrency(row.value, true) },
              { key: 'action', header: 'Action', render: (row) => <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEditAsset(row)}>Edit</button> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Manual liabilities</h2></CardHeader>
          <DataTable<Liability>
            rows={liabilities}
            getRowKey={(row) => row.id}
            columns={[
              { key: 'name', header: 'Liability', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
              { key: 'institution', header: 'Institution', render: (row) => row.institution },
              { key: 'type', header: 'Type', render: (row) => row.type },
              { key: 'date', header: 'As of', render: (row) => formatDate(row.asOfDate) },
              { key: 'balance', header: 'Balance', align: 'right', render: (row) => formatCurrency(row.balance, true) },
              { key: 'action', header: 'Action', render: (row) => <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEditLiability(row)}>Edit</button> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

function AssetForm({
  mode,
  form,
  types,
  isEditing,
  onCancel,
  onChange,
  onSubmit,
}: {
  mode: 'asset';
  form: typeof emptyAssetForm;
  types: string[];
  isEditing: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<typeof emptyAssetForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-3 p-5 md:grid-cols-2" onSubmit={onSubmit}>
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.name} onChange={(event) => onChange((value) => ({ ...value, name: event.target.value }))} placeholder="Name" required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.institution} onChange={(event) => onChange((value) => ({ ...value, institution: event.target.value }))} placeholder="Institution or source" required />
      <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.type} onChange={(event) => onChange((value) => ({ ...value, type: event.target.value as Asset['type'] }))}>
        {types.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <input className="rounded-lg border border-line px-3 py-2 text-sm" inputMode="decimal" value={form.value} onChange={(event) => onChange((value) => ({ ...value, value: event.target.value }))} placeholder="Value" required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" type="date" value={form.valuationDate} onChange={(event) => onChange((value) => ({ ...value, valuationDate: event.target.value }))} required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.notes} onChange={(event) => onChange((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes" />
      <div className="flex gap-2 md:col-span-2">
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">{isEditing ? 'Update' : `Add ${mode}`}</button>
        {isEditing && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function LiabilityForm({
  mode,
  form,
  types,
  isEditing,
  onCancel,
  onChange,
  onSubmit,
}: {
  mode: 'liability';
  form: typeof emptyLiabilityForm;
  types: string[];
  isEditing: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<typeof emptyLiabilityForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-3 p-5 md:grid-cols-2" onSubmit={onSubmit}>
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.name} onChange={(event) => onChange((value) => ({ ...value, name: event.target.value }))} placeholder="Name" required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.institution} onChange={(event) => onChange((value) => ({ ...value, institution: event.target.value }))} placeholder="Institution or source" required />
      <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.type} onChange={(event) => onChange((value) => ({ ...value, type: event.target.value as Liability['type'] }))}>
        {types.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <input className="rounded-lg border border-line px-3 py-2 text-sm" inputMode="decimal" value={form.balance} onChange={(event) => onChange((value) => ({ ...value, balance: event.target.value }))} placeholder="Balance" required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" type="date" value={form.asOfDate} onChange={(event) => onChange((value) => ({ ...value, asOfDate: event.target.value }))} required />
      <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.notes} onChange={(event) => onChange((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes" />
      <div className="flex gap-2 md:col-span-2">
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">{isEditing ? 'Update' : `Add ${mode}`}</button>
        {isEditing && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
