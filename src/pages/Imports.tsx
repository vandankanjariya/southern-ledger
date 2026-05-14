import { FileText, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { parseTransactionsCsv, type CsvColumnMapping, type CsvImportField } from '../features/imports/csvImport';
import { accounts, importBatches, transactions } from '../mock/finance';
import { commitImportBatch, listAccounts, listImportBatches, listTransactions, stageImport } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import type { ImportBatch, StagedTransaction } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/format';

const mappingFields: Array<{ key: CsvImportField; label: string }> = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Signed amount' },
  { key: 'debit', label: 'Debit' },
  { key: 'credit', label: 'Credit' },
  { key: 'balance', label: 'Balance' },
];

export default function Imports() {
  const loadAccounts = useCallback(() => listAccounts(), []);
  const loadTransactions = useCallback(() => listTransactions(), []);
  const { data: accountRows } = useApiData(loadAccounts, accounts);
  const { data: existingTransactions } = useApiData(loadTransactions, transactions);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? '');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [stagedRows, setStagedRows] = useState<StagedTransaction[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<CsvColumnMapping>({});
  const [batchRows, setBatchRows] = useState<ImportBatch[]>(importBatches);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const stagedSummary = useMemo(
    () => ({
      ready: stagedRows.filter((row) => row.status === 'ready').length,
      duplicate: stagedRows.filter((row) => row.status === 'duplicate').length,
      invalid: stagedRows.filter((row) => row.status === 'invalid').length,
    }),
    [stagedRows],
  );

  useEffect(() => {
    void refreshBatches();
  }, []);

  useEffect(() => {
    if (!accountRows.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(accountRows[0]?.id ?? '');
    }
  }, [accountRows, selectedAccountId]);

  async function refreshBatches() {
    try {
      const batches = await listImportBatches();
      setBatchRows(batches);
    } catch {
      setBatchRows(importBatches);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsParsing(true);
    setApiMessage(null);
    setApiError(null);
    setActiveBatchId(null);
    const result = await parseTransactionsCsv(file, existingTransactions);
    setCurrentFile(file);
    setSourceHeaders(result.sourceHeaders);
    setColumnMapping(result.detectedMapping);
    setStagedRows(result.stagedTransactions);
    setParseErrors(result.parseErrors);
    setIsParsing(false);
  }

  async function handleApplyMapping() {
    if (!currentFile) {
      return;
    }

    setIsParsing(true);
    setApiMessage(null);
    setApiError(null);
    setActiveBatchId(null);

    const result = await parseTransactionsCsv(currentFile, existingTransactions, columnMapping);
    setSourceHeaders(result.sourceHeaders);
    setStagedRows(result.stagedTransactions);
    setParseErrors(result.parseErrors);
    setIsParsing(false);
  }

  function updateMapping(field: CsvImportField, header: string) {
    setColumnMapping((mapping) => ({ ...mapping, [field]: header }));
  }

  function updateStagedRow(rowId: string, updates: Partial<Pick<StagedTransaction, 'date' | 'description' | 'amount' | 'balance'>>) {
    setStagedRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const next = { ...row, ...updates };
        const issues: string[] = [];

        if (!next.date) {
          issues.push('Missing or invalid date');
        }

        if (!next.description.trim()) {
          issues.push('Missing description');
        }

        if (next.amount === null) {
          issues.push('Missing amount');
        }

        return {
          ...next,
          fingerprint: next.date && next.description && next.amount !== null ? [next.date, next.description.toLowerCase().replace(/\s+/g, ' ').trim(), next.amount.toFixed(2)].join('|') : null,
          status: issues.length > 0 ? 'invalid' : next.status === 'committed' ? 'committed' : 'ready',
          issues,
        };
      }),
    );
  }

  async function handleStageImport() {
    if (stagedRows.length === 0) {
      return;
    }

    setIsSaving(true);
    setApiError(null);
    setApiMessage(null);

    try {
      const source = stagedRows[0]?.sourceFile ?? 'CSV statement';
      const result = await stageImport(selectedAccountId, source, stagedRows);
      setActiveBatchId(result.batch.id);
      setStagedRows((rows) =>
        rows.map((row) => {
          const serverRow = result.rows.find((item) => item.rowNumber === row.rowNumber);
          return serverRow ? { ...row, ...serverRow } : row;
        }),
      );
      setApiMessage(`Staged ${result.batch.rows} rows. ${result.batch.duplicates} duplicates and ${result.batch.invalid} invalid rows require review.`);
      await refreshBatches();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to stage import');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCommitReadyRows() {
    if (!activeBatchId) {
      return;
    }

    setIsCommitting(true);
    setApiError(null);
    setApiMessage(null);

    try {
      const result = await commitImportBatch(activeBatchId);
      setApiMessage(`Committed ${result.committed} ready rows to transactions.`);
      setStagedRows((rows) => rows.map((row) => (row.status === 'ready' ? { ...row, status: 'committed' } : row)));
      await refreshBatches();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to commit staged rows');
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Imports</h1>
        <p className="mt-1 text-sm text-slate-500">Manual CSV import staging with validation, duplicate detection, and audited D1 commits.</p>
      </header>
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div><p className="text-sm text-slate-500">Imported rows</p><p className="mt-2 text-2xl font-semibold">{batchRows.reduce((sum, batch) => sum + batch.rows, 0)}</p></div>
          <div><p className="text-sm text-slate-500">Possible duplicates</p><p className="mt-2 text-2xl font-semibold">{batchRows.reduce((sum, batch) => sum + batch.duplicates, 0)}</p></div>
          <div><p className="text-sm text-slate-500">Batches needing review</p><p className="mt-2 text-2xl font-semibold">{batchRows.filter((batch) => batch.status === 'review').length}</p></div>
          <div><p className="text-sm text-slate-500">Rows staged now</p><p className="mt-2 text-2xl font-semibold">{stagedRows.length}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Stage CSV file</h2>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Destination account</span>
              <select
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-700"
                value={selectedAccountId}
                onChange={(event) => setSelectedAccountId(event.target.value)}
              >
                {accountRows.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-brand-500 hover:bg-brand-50">
              <UploadCloud className="h-8 w-8 text-brand-700" />
              <span className="mt-3 text-sm font-semibold text-ink">Choose CSV statement</span>
              <span className="mt-1 text-xs leading-5 text-slate-500">Supports common CommBank, NAB, Westpac, and generic CSV date, description, amount, debit, credit, and balance columns.</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFileChange} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm text-slate-500">Ready to stage</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{stagedSummary.ready}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm text-slate-500">Duplicates</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{stagedSummary.duplicate}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm text-slate-500">Invalid rows</p>
              <p className="mt-2 text-2xl font-semibold text-rose-700">{stagedSummary.invalid}</p>
            </div>
            <div className="sm:col-span-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
                <p>
                  Raw CSV values are kept on each staged row for auditability. Committing ready rows creates transaction records while preserving the immutable staging data.
                </p>
              </div>
            </div>
            {isParsing && <p className="sm:col-span-3 text-sm font-medium text-brand-700">Parsing statement...</p>}
            {apiMessage && <p className="sm:col-span-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{apiMessage}</p>}
            {apiError && <p className="sm:col-span-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{apiError}</p>}
            {parseErrors.length > 0 && (
              <div className="sm:col-span-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Parse warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {parseErrors.slice(0, 4).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {sourceHeaders.length > 0 && (
              <div className="sm:col-span-3 rounded-lg border border-line bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-ink">Column mapping</h3>
                  <button
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    type="button"
                    disabled={isParsing}
                    onClick={handleApplyMapping}
                  >
                    Apply mapping
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {mappingFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">{field.label}</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-700"
                        value={columnMapping[field.key] ?? ''}
                        onChange={(event) => updateMapping(field.key, event.target.value)}
                      >
                        <option value="">Not used</option>
                        {sourceHeaders.map((header) => (
                          <option key={`${field.key}-${header}`} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={stagedRows.length === 0 || isSaving}
                onClick={handleStageImport}
              >
                {isSaving ? 'Staging rows...' : 'Stage rows to D1'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!activeBatchId || stagedSummary.ready === 0 || isCommitting}
                onClick={handleCommitReadyRows}
              >
                {isCommitting ? 'Committing rows...' : 'Commit ready rows'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">Staged transaction preview</h2></CardHeader>
        <DataTable<StagedTransaction>
          rows={stagedRows}
          getRowKey={(row) => row.id}
          emptyMessage="Upload a CSV statement to preview staged rows."
          columns={[
            { key: 'row', header: 'Row', render: (row) => row.rowNumber },
            {
              key: 'date',
              header: 'Date',
              render: (row) => (
                <input className="w-36 rounded-lg border border-line px-2 py-1.5 text-xs" type="date" value={row.date ?? ''} onChange={(event) => updateStagedRow(row.id, { date: event.target.value || null })} />
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (row) => (
                <input className="min-w-64 rounded-lg border border-line px-2 py-1.5 text-xs" value={row.description} onChange={(event) => updateStagedRow(row.id, { description: event.target.value })} />
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              render: (row) => (
                <input
                  className="w-28 rounded-lg border border-line px-2 py-1.5 text-right text-xs"
                  inputMode="decimal"
                  value={row.amount === null ? '' : String(row.amount)}
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    const amount = Number(value);
                    updateStagedRow(row.id, { amount: value === '' || !Number.isFinite(amount) ? null : amount });
                  }}
                />
              ),
            },
            { key: 'balance', header: 'Balance', align: 'right', render: (row) => row.balance === null ? '-' : formatCurrency(row.balance, true) },
            { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'ready' ? 'success' : row.status === 'duplicate' ? 'warning' : 'danger'}>{row.status}</Badge> },
            { key: 'issues', header: 'Issues', render: (row) => row.issues.length > 0 ? row.issues.join(', ') : '-' },
          ]}
          clientPagination
          initialRowsPerPage={10}
        />
      </Card>

      <Card>
        <CardHeader><h2 className="text-base font-semibold">Import batches</h2></CardHeader>
        <DataTable<ImportBatch>
          rows={batchRows}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'source', header: 'Source', render: (row) => <span className="font-medium text-ink">{row.source}</span> },
            { key: 'account', header: 'Account', render: (row) => row.accountName ?? '-' },
            { key: 'date', header: 'Imported', render: (row) => formatDate(row.importedAt) },
            { key: 'rows', header: 'Rows', align: 'right', render: (row) => row.rows },
            { key: 'duplicates', header: 'Duplicates', align: 'right', render: (row) => row.duplicates },
            { key: 'invalid', header: 'Invalid', align: 'right', render: (row) => row.invalid ?? 0 },
            { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'review' ? 'warning' : 'success'}>{row.status}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
