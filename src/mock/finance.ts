import type { Account, Asset, Category, ImportBatch, Liability, Loan, NetWorthPoint, Transaction } from '../types/finance';

export const accounts: Account[] = [
  { id: 'acc-main', name: 'Everyday Account', institution: 'Commonwealth Bank', type: 'transaction', balance: 8420, currency: 'AUD', lastUpdated: '2026-05-12' },
  { id: 'acc-offset', name: 'Home Loan Offset', institution: 'Macquarie', type: 'offset', balance: 48500, currency: 'AUD', lastUpdated: '2026-05-12' },
  { id: 'acc-saver', name: 'High Interest Saver', institution: 'ING', type: 'savings', balance: 22780, currency: 'AUD', lastUpdated: '2026-05-11' },
  { id: 'acc-card', name: 'Rewards Credit Card', institution: 'American Express', type: 'credit-card', balance: -2360, currency: 'AUD', lastUpdated: '2026-05-10' },
  { id: 'acc-business', name: 'Sole Trader Account', institution: 'NAB', type: 'business', balance: 12640, currency: 'AUD', lastUpdated: '2026-05-12' },
  { id: 'acc-loan', name: 'Investment Property Loan', institution: 'Macquarie', type: 'loan', balance: -541200, currency: 'AUD', lastUpdated: '2026-05-12' },
];

export const categories: Category[] = [
  { id: 'cat-salary', name: 'Salary', group: 'Income', taxDeductible: false },
  { id: 'cat-rent', name: 'Rental Income', group: 'Income', taxDeductible: false },
  { id: 'cat-groceries', name: 'Groceries', group: 'Living', taxDeductible: false },
  { id: 'cat-utilities', name: 'Utilities', group: 'Housing', taxDeductible: false },
  { id: 'cat-fuel', name: 'Fuel & Transport', group: 'Transport', taxDeductible: false },
  { id: 'cat-software', name: 'Business Software', group: 'Business', taxDeductible: true, businessUsePercent: 100 },
  { id: 'cat-property', name: 'Investment Property Expenses', group: 'Investment Property', taxDeductible: true },
  { id: 'cat-interest', name: 'Loan Interest', group: 'Investment Property', taxDeductible: true },
  { id: 'cat-transfer', name: 'Own Account Transfer', group: 'Transfers', taxDeductible: false },
  { id: 'cat-tax', name: 'Tax Withheld & BAS', group: 'Tax', taxDeductible: false },
];

export const transactions: Transaction[] = [
  { id: 'txn-001', date: '2026-05-10', description: 'Salary payment', accountId: 'acc-main', categoryId: 'cat-salary', amount: 8200, kind: 'income', merchant: 'Employer Pty Ltd', status: 'reconciled' },
  { id: 'txn-002', date: '2026-05-09', description: 'Woolworths groceries', accountId: 'acc-card', categoryId: 'cat-groceries', amount: -214.2, kind: 'expense', merchant: 'Woolworths', status: 'cleared' },
  { id: 'txn-003', date: '2026-05-07', description: 'Transfer to offset', accountId: 'acc-main', categoryId: 'cat-transfer', amount: -3000, kind: 'transfer', merchant: 'Internal Transfer', status: 'reconciled' },
  { id: 'txn-004', date: '2026-05-06', description: 'Investment loan repayment', accountId: 'acc-main', categoryId: 'cat-interest', amount: -2980, kind: 'expense', merchant: 'Macquarie', status: 'needs-review', taxTag: 'Investment property' },
  { id: 'txn-005', date: '2026-05-05', description: 'Rental income', accountId: 'acc-main', categoryId: 'cat-rent', amount: 3120, kind: 'income', merchant: 'Property Manager', status: 'reconciled' },
  { id: 'txn-006', date: '2026-05-03', description: 'Xero subscription', accountId: 'acc-business', categoryId: 'cat-software', amount: -76, kind: 'expense', merchant: 'Xero', status: 'cleared', taxTag: 'Business' },
  { id: 'txn-007', date: '2026-04-29', description: 'Electricity bill', accountId: 'acc-main', categoryId: 'cat-utilities', amount: -286.8, kind: 'expense', merchant: 'Energy Australia', status: 'cleared' },
  { id: 'txn-008', date: '2026-04-25', description: 'Plumbing repair rental', accountId: 'acc-main', categoryId: 'cat-property', amount: -640, kind: 'expense', merchant: 'Northside Plumbing', status: 'needs-review', taxTag: 'Investment property' },
  { id: 'txn-009', date: '2026-03-18', description: 'Fuel', accountId: 'acc-card', categoryId: 'cat-fuel', amount: -92.7, kind: 'expense', merchant: 'BP', status: 'reconciled' },
  { id: 'txn-010', date: '2025-12-15', description: 'BAS payment', accountId: 'acc-business', categoryId: 'cat-tax', amount: -1850, kind: 'expense', merchant: 'ATO', status: 'reconciled', taxTag: 'BAS' },
  { id: 'txn-011', date: '2025-08-12', description: 'Laptop software bundle', accountId: 'acc-business', categoryId: 'cat-software', amount: -420, kind: 'expense', merchant: 'Adobe', status: 'reconciled', taxTag: 'Business' },
  { id: 'txn-012', date: '2025-07-02', description: 'Opening FY transfer', accountId: 'acc-saver', categoryId: 'cat-transfer', amount: 5000, kind: 'transfer', merchant: 'Internal Transfer', status: 'reconciled' },
];

export const loans: Loan[] = [
  { id: 'loan-investment', accountId: 'acc-loan', name: 'Investment Property Loan', institution: 'Macquarie', balance: 541200, rate: 6.19, repayment: 2980, offsetAccountId: 'acc-offset', nextPaymentDate: '2026-06-04', purpose: 'investment-property', interestDeductible: true },
  { id: 'loan-car', name: 'Vehicle Loan', institution: 'Toyota Finance', balance: 18400, rate: 7.45, repayment: 620, nextPaymentDate: '2026-05-28', purpose: 'personal', interestDeductible: false },
];

export const assets: Asset[] = [
  { id: 'asset-property', name: 'Investment property valuation', institution: 'Manual valuation', type: 'property', value: 775000, valuationDate: '2026-05-12', notes: 'Manual valuation used for net worth reporting' },
  { id: 'asset-super', name: 'Superannuation balance', institution: 'Manual valuation', type: 'investment', value: 89500, valuationDate: '2026-05-12', notes: 'Manual retirement asset placeholder' },
  { id: 'asset-vehicle', name: 'Vehicle estimate', institution: 'Manual valuation', type: 'vehicle', value: 22000, valuationDate: '2026-05-12', notes: 'Conservative resale estimate' },
];

export const liabilities: Liability[] = [
  { id: 'liability-car-loan', name: 'Vehicle Loan', institution: 'Toyota Finance', type: 'loan', balance: 18400, asOfDate: '2026-05-12', notes: 'Manual liability not represented by a bank account' },
];

export const netWorthHistory: NetWorthPoint[] = [
  { month: '2025-07', assets: 878000, liabilities: 590000 },
  { month: '2025-08', assets: 886500, liabilities: 586800 },
  { month: '2025-09', assets: 892300, liabilities: 583600 },
  { month: '2025-10', assets: 901900, liabilities: 580400 },
  { month: '2025-11', assets: 912400, liabilities: 577100 },
  { month: '2025-12', assets: 920100, liabilities: 573900 },
  { month: '2026-01', assets: 926700, liabilities: 570600 },
  { month: '2026-02', assets: 934600, liabilities: 567300 },
  { month: '2026-03', assets: 942900, liabilities: 563900 },
  { month: '2026-04', assets: 965000, liabilities: 566000 },
  { month: '2026-05', assets: 978840, liabilities: 561960 },
];

export const importBatches: ImportBatch[] = [
  { id: 'imp-001', source: 'CBA May CSV', importedAt: '2026-05-12', rows: 186, duplicates: 4, status: 'review' },
  { id: 'imp-002', source: 'AMEX April CSV', importedAt: '2026-05-02', rows: 92, duplicates: 2, status: 'complete' },
  { id: 'imp-003', source: 'NAB Business Q3 CSV', importedAt: '2026-04-20', rows: 74, duplicates: 0, status: 'complete' },
];
