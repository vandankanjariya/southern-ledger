import {
  ArrowLeftRight,
  Banknote,
  FolderInput,
  Gauge,
  Landmark,
  LineChart,
  ListChecks,
  PieChart,
  ReceiptText,
  Settings,
  Tags,
} from 'lucide-react';

export const navigationItems = [
  { label: 'Overview', path: '/', icon: Gauge },
  { label: 'Transactions', path: '/transactions', icon: ListChecks },
  { label: 'Accounts', path: '/accounts', icon: Landmark },
  { label: 'Categories', path: '/categories', icon: Tags },
  { label: 'Imports', path: '/imports', icon: FolderInput },
  { label: 'Reconciliation', path: '/reconciliation', icon: ArrowLeftRight },
  { label: 'Loans', path: '/loans', icon: Banknote },
  { label: 'Net Worth', path: '/net-worth', icon: LineChart },
  { label: 'Tax Summary', path: '/tax-summary', icon: PieChart },
  { label: 'Reports', path: '/reports', icon: ReceiptText },
  { label: 'Settings', path: '/settings', icon: Settings },
] as const;
