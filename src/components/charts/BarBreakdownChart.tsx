import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface BarBreakdownChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  dataKey: string;
}

export function BarBreakdownChart({ data, xKey, dataKey }: BarBreakdownChartProps) {
  if (data.length === 0) {
    return <div className="grid h-72 place-items-center rounded-lg bg-slate-50 text-sm text-slate-500">No cash flow activity for the selected range.</div>;
  }

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} width={72} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
          <Bar dataKey={dataKey} fill="#16a085" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
