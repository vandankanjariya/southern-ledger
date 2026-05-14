import { LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { navigationItems } from '../constants/navigation';
import { DateRangeProvider } from '../hooks/DateRangeProvider';
import { useDateRange } from '../hooks/useDateRange';
import { type DateRangeId, formatDateRange } from '../utils/dateFilters';
import { cx } from '../utils/format';

export default function AppLayout() {
  return (
    <DateRangeProvider>
      <AppShell />
    </DateRangeProvider>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { rangeOptions, selectedRange, selectedRangeId, setSelectedRangeId } = useDateRange();

  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      {sidebarOpen && <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-semibold">PF</div>
            <div>
              <p className="text-sm font-semibold">Finance Dashboard</p>
              <p className="text-xs text-slate-400">Private AU finance</p>
            </div>
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-white text-sidebar shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/8 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-brand-100" />
              Private local mode
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Local Worker and D1 data with mock fallback records.</p>
            <a
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-sidebar transition hover:bg-slate-100"
              href="/cdn-cgi/access/logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </a>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" className="rounded-lg border border-line p-2 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden min-w-0 flex-1 items-center rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
              <Search className="mr-2 h-4 w-4" />
              Search transactions, accounts, categories
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium uppercase text-slate-500">Current filter</p>
                <p className="text-sm font-semibold text-ink">{selectedRange.label}: {formatDateRange(selectedRange)}</p>
              </div>
              <select
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700"
                value={selectedRangeId}
                onChange={(event) => setSelectedRangeId(event.target.value as DateRangeId)}
                aria-label="Date range"
              >
                {rangeOptions.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
