import { useCallback, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { accounts as mockAccounts } from '../mock/finance';
import { createAccount, deleteAccount, listAccounts, updateAccount } from '../services/api';
import type { Account, AccountType } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/format';

const accountTypes: AccountType[] = ['transaction', 'savings', 'offset', 'credit-card', 'loan', 'investment', 'business'];

const emptyForm = {
  institution: '',
  name: '',
  type: 'transaction' as AccountType,
  balance: '',
  lastUpdated: new Date().toISOString().slice(0, 10),
};

export default function Accounts() {
  const loadAccounts = useCallback(() => listAccounts(), []);
  const { data: accounts, reload } = useApiData(loadAccounts, mockAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const positiveBalances = accounts.filter((account) => account.balance > 0).reduce((sum, account) => sum + account.balance, 0);
  const debts = Math.abs(accounts.filter((account) => account.balance < 0).reduce((sum, account) => sum + account.balance, 0));
  const selectedAccount = useMemo(() => accounts.find((account) => account.id === editingId), [accounts, editingId]);

  function startEdit(account: Account) {
    setEditingId(account.id);
    setForm({
      institution: account.institution,
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      lastUpdated: account.lastUpdated,
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const balance = Number(form.balance);
    if (!Number.isFinite(balance)) {
      setError('Balance must be a valid number.');
      return;
    }

    try {
      const payload = {
        institution: form.institution,
        name: form.name,
        type: form.type,
        balance,
        lastUpdated: form.lastUpdated,
      };

      if (editingId) {
        await updateAccount(editingId, payload);
        setMessage(`Updated ${form.name}.`);
      } else {
        await createAccount(payload);
        setMessage(`Created ${form.name}.`);
      }

      setEditingId(null);
      setForm(emptyForm);
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save account');
    }
  }

  async function handleDelete(account: Account) {
    if (!window.confirm(`Delete ${account.name}? This is only allowed when the account has no linked transactions, imports, or loans.`)) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      await deleteAccount(account.id);
      if (editingId === account.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setMessage(`Deleted ${account.name}.`);
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete account');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">Manual account snapshot for cash, credit, business, offset, and loan accounts.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent><p className="text-sm text-slate-500">Positive balances</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(positiveBalances)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Liability balances</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(debts)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">{selectedAccount ? `Edit ${selectedAccount.name}` : 'Add account'}</h2></CardHeader>
        <form className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_180px_160px_170px_auto]" onSubmit={handleSubmit}>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={form.institution}
            onChange={(event) => setForm((value) => ({ ...value, institution: event.target.value }))}
            placeholder="Institution"
            required
          />
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Account name"
            required
          />
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={form.type}
            onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as AccountType }))}
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            inputMode="decimal"
            value={form.balance}
            onChange={(event) => setForm((value) => ({ ...value, balance: event.target.value }))}
            placeholder="Balance"
            required
          />
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            type="date"
            value={form.lastUpdated}
            onChange={(event) => setForm((value) => ({ ...value, lastUpdated: event.target.value }))}
            required
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={resetForm}>Cancel</button>}
          </div>
          {message && <p className="text-sm font-medium text-emerald-700 md:col-span-6">{message}</p>}
          {error && <p className="text-sm font-medium text-rose-700 md:col-span-6">{error}</p>}
        </form>
      </Card>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Account register</h2></CardHeader>
        <DataTable<Account>
          rows={accounts}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Account', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'institution', header: 'Institution', render: (row) => row.institution },
            { key: 'type', header: 'Type', render: (row) => <Badge tone="brand">{row.type}</Badge> },
            { key: 'updated', header: 'Last updated', render: (row) => formatDate(row.lastUpdated) },
            { key: 'balance', header: 'Balance', align: 'right', render: (row) => formatCurrency(row.balance) },
            {
              key: 'action',
              header: 'Action',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEdit(row)}>Edit</button>
                  <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" type="button" onClick={() => handleDelete(row)}>Delete</button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
