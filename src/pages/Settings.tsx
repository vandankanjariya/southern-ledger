import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useDateRange } from '../hooks/useDateRange';
import { exportFullBackup } from '../services/api';
import { formatDateRange } from '../utils/dateFilters';

const settings = [
  { label: 'Financial year basis', value: 'Australia, 1 July to 30 June' },
  { label: 'Privacy mode', value: 'Local D1 with mock fallback' },
  { label: 'Currency', value: 'AUD' },
  { label: 'Backend', value: 'Cloudflare Worker + D1 local API' },
];

export default function Settings() {
  const { rangeOptions, selectedRangeId } = useDateRange();

  async function handleExportBackup() {
    const backup = await exportFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `southern-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Application preferences, financial year defaults, and local data mode.</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Application</h2></CardHeader>
          <CardContent className="divide-y divide-line">
            {settings.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-right text-sm font-semibold text-ink">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Backup</h2></CardHeader>
          <CardContent>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void handleExportBackup()}>
              Export full JSON backup
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-base font-semibold">Date filters</h2></CardHeader>
          <CardContent className="space-y-4">
            {rangeOptions.map((range) => (
              <div key={range.id} className="rounded-lg border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{range.label}</p>
                  {selectedRangeId === range.id && <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Active</span>}
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatDateRange(range)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
