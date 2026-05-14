import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

const Accounts = lazy(() => import('./pages/Accounts'));
const Categories = lazy(() => import('./pages/Categories'));
const Imports = lazy(() => import('./pages/Imports'));
const Loans = lazy(() => import('./pages/Loans'));
const NetWorth = lazy(() => import('./pages/NetWorth'));
const Overview = lazy(() => import('./pages/Overview'));
const Reconciliation = lazy(() => import('./pages/Reconciliation'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const TaxSummary = lazy(() => import('./pages/TaxSummary'));
const Transactions = lazy(() => import('./pages/Transactions'));

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="imports" element={<Imports />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="loans" element={<Loans />} />
          <Route path="net-worth" element={<NetWorth />} />
          <Route path="tax-summary" element={<TaxSummary />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function PageLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 text-sm font-medium text-slate-600">
      Loading dashboard...
    </div>
  );
}
