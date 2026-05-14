import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface AreaTrendChartProps {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey: string;
}

export function AreaTrendChart({ data, dataKey, xKey }: AreaTrendChartProps) {
  if (data.length === 0) {
    return <div className="grid h-72 place-items-center rounded-lg bg-slate-50 text-sm text-slate-500">No trend data for the selected range.</div>;
  }

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a085" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#16a085" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} width={72} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
          <Area type="monotone" dataKey={dataKey} stroke="#0f8b73" strokeWidth={3} fill="url(#trend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
