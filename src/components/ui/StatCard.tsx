import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from './Card';
import { cx } from '../../utils/format';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: LucideIcon;
}

export function StatCard({ label, value, change, trend, icon: Icon }: StatCardProps) {
  const positive = trend === 'up';
  const negative = trend === 'down';

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
          <p
            className={cx(
              'mt-3 inline-flex items-center gap-1 text-sm font-medium',
              positive && 'text-emerald-700',
              negative && 'text-rose-700',
              trend === 'flat' && 'text-slate-500',
            )}
          >
            {positive && <ArrowUpRight className="h-4 w-4" />}
            {negative && <ArrowDownRight className="h-4 w-4" />}
            {change}
          </p>
        </div>
        <div className="rounded-lg bg-brand-50 p-3 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
