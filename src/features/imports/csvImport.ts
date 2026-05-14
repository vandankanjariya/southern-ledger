import Papa from 'papaparse';
import { format, isValid, parse } from 'date-fns';
import type { StagedTransaction, Transaction } from '../../types/finance';

type RawCsvRow = Record<string, string | undefined>;
export type CsvImportField = 'date' | 'description' | 'amount' | 'debit' | 'credit' | 'balance';
export type CsvColumnMapping = Partial<Record<CsvImportField, string>>;

const DATE_FORMATS = ['yyyy-MM-dd', 'dd/MM/yyyy', 'd/MM/yyyy', 'dd-MM-yyyy', 'd-MM-yyyy', 'dd MMM yyyy', 'd MMM yyyy'];

const headerAliases = {
  date: ['date', 'transaction date', 'processed date', 'posted date', 'effective date', 'value date'],
  description: ['description', 'details', 'transaction description', 'transaction details', 'narrative', 'particulars', 'merchant', 'payee', 'memo'],
  amount: ['amount', 'transaction amount', 'value', 'debit credit amount', 'signed amount'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'withdrawal amount', 'debits'],
  credit: ['credit', 'deposit', 'deposits', 'credit amount', 'deposit amount', 'credits'],
  balance: ['balance', 'running balance', 'closing balance', 'available balance', 'account balance'],
};

export interface CsvImportResult {
  stagedTransactions: StagedTransaction[];
  parseErrors: string[];
  sourceHeaders: string[];
  detectedMapping: CsvColumnMapping;
}

export async function parseTransactionsCsv(file: File, existingTransactions: Transaction[], mapping?: CsvColumnMapping): Promise<CsvImportResult> {
  const existingFingerprints = new Set(existingTransactions.map(createTransactionFingerprint));

  return new Promise((resolve) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const parseErrors = result.errors.map((error) => `Row ${error.row ?? 'unknown'}: ${error.message}`);
        const sourceHeaders = result.meta.fields ?? [];
        const detectedMapping = detectColumnMapping(sourceHeaders);
        const columnMapping = mapping ?? detectedMapping;
        const stagedTransactions = result.data.map((row, index) => stageCsvRow(row, index + 2, file.name, existingFingerprints, columnMapping));
        resolve({ stagedTransactions, parseErrors, sourceHeaders, detectedMapping });
      },
      error: (error) => {
        resolve({ stagedTransactions: [], parseErrors: [error.message], sourceHeaders: [], detectedMapping: {} });
      },
    });
  });
}

function stageCsvRow(row: RawCsvRow, rowNumber: number, sourceFile: string, existingFingerprints: Set<string>, mapping: CsvColumnMapping): StagedTransaction {
  const normalizedRow = normalizeRow(row);
  const date = normalizeDate(getMappedField(row, normalizedRow, mapping, 'date'));
  const description = getMappedField(row, normalizedRow, mapping, 'description')?.trim() ?? '';
  const amountField = parseMoney(getMappedField(row, normalizedRow, mapping, 'amount'));
  const debit = parseMoney(getMappedField(row, normalizedRow, mapping, 'debit'));
  const credit = parseMoney(getMappedField(row, normalizedRow, mapping, 'credit'));
  const amount = amountField ?? deriveSignedAmount(debit, credit);
  const balance = parseMoney(getMappedField(row, normalizedRow, mapping, 'balance'));
  const issues: string[] = [];

  if (!date) {
    issues.push('Missing or invalid date');
  }

  if (!description) {
    issues.push('Missing description');
  }

  if (amount === null) {
    issues.push('Missing amount');
  }

  const fingerprint = date && description && amount !== null ? createFingerprint(date, description, amount) : null;
  const isDuplicate = fingerprint ? existingFingerprints.has(fingerprint) : false;
  const status = issues.length > 0 ? 'invalid' : isDuplicate ? 'duplicate' : 'ready';

  return {
    id: `${sourceFile}-${rowNumber}`,
    rowNumber,
    sourceFile,
    raw: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? ''])),
    date,
    description,
    amount,
    debit,
    credit,
    balance,
    fingerprint,
    status,
    issues,
  };
}

function detectColumnMapping(headers: string[]): CsvColumnMapping {
  return {
    date: detectHeader(headers, headerAliases.date),
    description: detectHeader(headers, headerAliases.description),
    amount: detectHeader(headers, headerAliases.amount),
    debit: detectHeader(headers, headerAliases.debit),
    credit: detectHeader(headers, headerAliases.credit),
    balance: detectHeader(headers, headerAliases.balance),
  };
}

function detectHeader(headers: string[], aliases: string[]) {
  const normalizedAliases = new Set(aliases.map(normalizeHeader));
  return headers.find((header) => normalizedAliases.has(normalizeHeader(header)));
}

function normalizeRow(row: RawCsvRow): RawCsvRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value?.trim()]));
}

function getMappedField(row: RawCsvRow, normalizedRow: RawCsvRow, mapping: CsvColumnMapping, field: CsvImportField): string | undefined {
  if (Object.prototype.hasOwnProperty.call(mapping, field)) {
    const mappedHeader = mapping[field];

    if (!mappedHeader) {
      return undefined;
    }

    return row[mappedHeader]?.trim() ?? normalizedRow[normalizeHeader(mappedHeader)]?.trim();
  }

  return getField(normalizedRow, headerAliases[field]);
}

function getField(row: RawCsvRow, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];

    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[$/]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  for (const dateFormat of DATE_FORMATS) {
    const parsed = parse(value, dateFormat, new Date());

    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  }

  const fallback = new Date(value);
  return isValid(fallback) ? format(fallback, 'yyyy-MM-dd') : null;
}

function parseMoney(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const hasDebitMarker = /\bdr\b/i.test(value);
  const hasCreditMarker = /\bcr\b/i.test(value);
  const normalized = value
    .replace(/\b(cr|dr)\b/gi, '')
    .replace(/[$,\s]/g, '')
    .replace(/^\((.*)\)$/, '-$1');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (hasDebitMarker && !hasCreditMarker) {
    return -Math.abs(parsed);
  }

  if (hasCreditMarker && !hasDebitMarker) {
    return Math.abs(parsed);
  }

  return parsed;
}

function deriveSignedAmount(debit: number | null, credit: number | null): number | null {
  if (credit !== null && debit !== null) {
    return credit - debit;
  }

  if (credit !== null) {
    return credit;
  }

  if (debit !== null) {
    return -Math.abs(debit);
  }

  return null;
}

function createTransactionFingerprint(transaction: Transaction): string {
  return createFingerprint(transaction.date, transaction.description, transaction.amount);
}

function createFingerprint(date: string, description: string, amount: number): string {
  return [date, normalizeDescription(description), amount.toFixed(2)].join('|');
}

function normalizeDescription(description: string): string {
  return description.toLowerCase().replace(/\s+/g, ' ').trim();
}
