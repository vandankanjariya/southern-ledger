import { cx } from '../../utils/format';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset', tones[tone])}>
      {children}
    </span>
  );
}
