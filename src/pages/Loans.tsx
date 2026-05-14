import { useCallback, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useApiData } from '../hooks/useApiData';
import { accounts as mockAccounts, loans as mockLoans } from '../mock/finance';
import { createLoan, listAccounts, listLoans, updateLoan } from '../services/api';
import type { Loan } from '../types/finance';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

const loanPurposes: NonNullable<Loan['purpose']>[] = ['personal', 'investment-property', 'business'];

const emptyLoanForm = {
  accountId: '',
  name: '',
  institution: '',
  balance: '',
  rate: '',
  repayment: '',
  offsetAccountId: '',
  nextPaymentDate: new Date().toISOString().slice(0, 10),
  purpose: 'personal' as NonNullable<Loan['purpose']>,
  interestDeductible: false,
};

export default function Loans() {
  const loadLoans = useCallback(() => listLoans(), []);
  const loadAccounts = useCallback(() => listAccounts(), []);
  const { data: loans, reload } = useApiData(loadLoans, mockLoans);
  const { data: accounts } = useApiData(loadAccounts, mockAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLoanForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalLoanBalance = loans.reduce((sum, loan) => sum + loan.balance, 0);
  const deductibleInterestLoans = loans.filter((loan) => loan.interestDeductible).length;

  function startEdit(loan: Loan) {
    setEditingId(loan.id);
    setForm({
      accountId: loan.accountId ?? '',
      name: loan.name,
      institution: loan.institution,
      balance: String(loan.balance),
      rate: String(loan.rate),
      repayment: String(loan.repayment),
      offsetAccountId: loan.offsetAccountId ?? '',
      nextPaymentDate: loan.nextPaymentDate,
      purpose: loan.purpose ?? 'personal',
      interestDeductible: Boolean(loan.interestDeductible),
    });
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const balance = Number(form.balance);
    const rate = Number(form.rate);
    const repayment = Number(form.repayment);

    if (![balance, rate, repayment].every((value) => Number.isFinite(value) && value >= 0)) {
      setError('Balance, rate, and repayment must be valid positive numbers.');
      return;
    }

    try {
      const payload = {
        accountId: form.accountId || undefined,
        name: form.name,
        institution: form.institution,
        balance,
        rate,
        repayment,
        offsetAccountId: form.offsetAccountId || undefined,
        nextPaymentDate: form.nextPaymentDate,
        purpose: form.purpose,
        interestDeductible: form.interestDeductible,
      };

      if (editingId) {
        await updateLoan(editingId, payload);
        setMessage(`Updated ${form.name}.`);
      } else {
        await createLoan(payload);
        setMessage(`Added ${form.name}.`);
      }

      setEditingId(null);
      setForm(emptyLoanForm);
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save loan');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="mt-1 text-sm text-slate-500">Loan summary for repayments, interest rates, offset context, and tax treatment.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-slate-500">Total loan balance</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(totalLoanBalance)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Monthly repayments</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(loans.reduce((sum, loan) => sum + loan.repayment, 0))}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-500">Deductible interest loans</p><p className="mt-2 text-2xl font-semibold">{deductibleInterestLoans}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">{editingId ? 'Edit loan' : 'Add loan'}</h2></CardHeader>
        <form className="grid gap-3 p-5 md:grid-cols-3" onSubmit={handleSubmit}>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Loan name" required />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" value={form.institution} onChange={(event) => setForm((value) => ({ ...value, institution: event.target.value }))} placeholder="Institution" required />
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.purpose} onChange={(event) => setForm((value) => ({ ...value, purpose: event.target.value as NonNullable<Loan['purpose']> }))}>
            {loanPurposes.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" inputMode="decimal" value={form.balance} onChange={(event) => setForm((value) => ({ ...value, balance: event.target.value }))} placeholder="Balance" required />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" inputMode="decimal" value={form.rate} onChange={(event) => setForm((value) => ({ ...value, rate: event.target.value }))} placeholder="Interest rate %" required />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" inputMode="decimal" value={form.repayment} onChange={(event) => setForm((value) => ({ ...value, repayment: event.target.value }))} placeholder="Repayment" required />
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.accountId} onChange={(event) => setForm((value) => ({ ...value, accountId: event.target.value }))}>
            <option value="">No linked account</option>
            {accounts.filter((account) => account.type === 'loan').map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.offsetAccountId} onChange={(event) => setForm((value) => ({ ...value, offsetAccountId: event.target.value }))}>
            <option value="">No offset account</option>
            {accounts.filter((account) => account.type === 'offset').map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" type="date" value={form.nextPaymentDate} onChange={(event) => setForm((value) => ({ ...value, nextPaymentDate: event.target.value }))} required />
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.interestDeductible} onChange={(event) => setForm((value) => ({ ...value, interestDeductible: event.target.checked }))} />
            Interest deductible
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="submit">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => { setEditingId(null); setForm(emptyLoanForm); }}>Cancel</button>}
          </div>
          {message && <p className="text-sm font-medium text-emerald-700 md:col-span-3">{message}</p>}
          {error && <p className="text-sm font-medium text-rose-700 md:col-span-3">{error}</p>}
        </form>
      </Card>
      <Card>
        <CardHeader><h2 className="text-base font-semibold">Loan register</h2></CardHeader>
        <DataTable<Loan>
          rows={loans}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Loan', render: (row) => <span className="font-medium text-ink">{row.name}</span> },
            { key: 'institution', header: 'Institution', render: (row) => row.institution },
            { key: 'rate', header: 'Rate', align: 'right', render: (row) => formatPercent(row.rate) },
            { key: 'repayment', header: 'Repayment', align: 'right', render: (row) => formatCurrency(row.repayment) },
            { key: 'next', header: 'Next payment', render: (row) => formatDate(row.nextPaymentDate) },
            { key: 'purpose', header: 'Purpose', render: (row) => row.purpose ? <Badge tone={row.interestDeductible ? 'success' : 'neutral'}>{row.purpose}</Badge> : '-' },
            { key: 'balance', header: 'Balance', align: 'right', render: (row) => formatCurrency(row.balance) },
            { key: 'action', header: 'Action', render: (row) => <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700" type="button" onClick={() => startEdit(row)}>Edit</button> },
          ]}
        />
      </Card>
    </div>
  );
}
