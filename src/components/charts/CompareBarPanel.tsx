import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, Cell } from 'recharts';

const COMPARE_COLORS = [
  'hsl(212, 72%, 42%)',
  'hsl(185, 58%, 38%)',
  'hsl(38, 90%, 50%)',
];

interface Dataset {
  label: string;
  data: { name: string; value: number }[];
}

interface Props {
  datasets: Dataset[];
  height?: number;
  preserveOrder?: boolean;
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: 11,
  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
};

/**
 * Renders multiple horizontal bar charts side-by-side with shared y-axis labels.
 * Labels appear only in the leftmost column; subsequent columns show bars only.
 * Inspired by institutional "Target / Exposure / Delta" triple-panel layouts.
 */
export default function CompareBarPanel({ datasets, height = 280, preserveOrder = false }: Props) {
  // Use first dataset's order — optionally sorted descending
  const ordered = preserveOrder ? datasets[0].data : [...datasets[0].data].sort((a, b) => b.value - a.value);
  const names = ordered.map(d => d.name);

  // Align all datasets to same name order
  const aligned = datasets.map(ds => {
    const map = Object.fromEntries(ds.data.map(d => [d.name, d.value]));
    return {
      label: ds.label,
      data: names.map(name => ({ name, value: map[name] ?? 0 })),
    };
  });

  return (
    <div className="flex w-full h-full gap-2" style={{ minHeight: height }}>
      {aligned.map((ds, i) => (
        <div
          key={ds.label}
          className="flex flex-col h-full rounded-md border p-2"
          style={{
            flex: i === 0 ? '1.4 1 0%' : '1 1 0%',
            borderColor: COMPARE_COLORS[i] + '33',
          }}
        >
          <span
            className="text-[10px] font-semibold text-center mb-1 shrink-0"
            style={{ color: COMPARE_COLORS[i] }}
          >
            {ds.label}
          </span>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ds.data}
                layout="vertical"
                margin={i === 0 ? { left: 5, right: 8 } : { left: 0, right: 8 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={v => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={i === 0 ? { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } : false}
                  width={i === 0 ? 100 : 4}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, ds.label]}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={12}>
                  {ds.data.map((_, j) => (
                    <Cell key={j} fill={COMPARE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
