import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  colorByValue?: boolean;
  barColor?: string;
}

export default function FinancialBarChart({ data: rawData, height = 250, layout = 'vertical', colorByValue = true, barColor }: Props) {
  const data = [...rawData].sort((a, b) => b.value - a.value);

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    fontSize: 11,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
  };

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Value']} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorByValue ? (d.value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-negative))') : (barColor || 'hsl(var(--chart-1))')} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Value']} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorByValue ? (d.value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-negative))') : (barColor || 'hsl(var(--chart-1))')} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
