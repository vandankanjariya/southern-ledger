import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/format';

const colours = ['#16a085', '#2563eb', '#f59e0b', '#e11d48', '#7c3aed', '#0891b2'];

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
}

export function DonutChart({ data }: DonutChartProps) {
  if (data.length === 0) {
    return <div className="grid min-h-56 place-items-center rounded-lg bg-slate-50 px-4 text-center text-sm text-slate-500">No category activity for the selected range.</div>;
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
      <div className="h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colours[index % colours.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0 space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex min-w-0 items-center justify-between gap-4 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colours[index % colours.length] }} />
              <span className="min-w-0 truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-semibold text-ink">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
