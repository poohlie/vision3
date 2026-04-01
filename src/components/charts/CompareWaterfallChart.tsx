import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface WfItem { name: string; value: number; isTotal: boolean; }

const COMPARE_COLORS = [
  'hsl(212, 72%, 42%)',
  'hsl(185, 58%, 38%)',
  'hsl(38, 90%, 50%)',
];

const COMPARE_COLORS_LIGHT = [
  'hsl(212, 55%, 68%)',
  'hsl(185, 42%, 62%)',
  'hsl(38, 70%, 72%)',
];

interface Props {
  datasets: { label: string; data: WfItem[] }[];
  onBarClick?: (name: string) => void;
  colorMap?: Record<string, string>;
}

export default function CompareWaterfallChart({ datasets, onBarClick }: Props) {
  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    fontSize: 11,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
  };

  if (datasets.length === 1) {
    const data = datasets[0].data;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Value']} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14} onClick={(d) => onBarClick?.(d.name)}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.isTotal ? 'hsl(var(--chart-total))' : d.value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-negative))'}
                cursor={onBarClick ? 'pointer' : 'default'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Grouped comparison mode — horizontal
  const categories = datasets[0].data.map(d => d.name);
  const chartData = categories.map(cat => {
    const row: Record<string, any> = { name: cat };
    datasets.forEach((ds) => {
      const item = ds.data.find(d => d.name === cat);
      row[ds.label] = item?.value || 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }} barCategoryGap="18%">
        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
        <ReferenceLine x={0} stroke="hsl(var(--border))" />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, undefined]} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {datasets.map((ds, i) => (
          <Bar
            key={ds.label}
            dataKey={ds.label}
            fill={COMPARE_COLORS[i]}
            radius={[0, 3, 3, 0]}
            onClick={(d) => onBarClick?.(d.name)}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
