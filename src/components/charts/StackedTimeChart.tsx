import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Line, ComposedChart, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS } from '@/data/mockData';

interface Props {
  data: Record<string, string | number>[];
  categories: string[];
  height?: number;
  xKey?: string;
  overlayLine?: string;
  stacked?: boolean;
  negativeCategories?: string[];
  colorMap?: Record<string, string>;
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: 11,
  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
};

export default function StackedTimeChart({ data, categories, height = 250, xKey = 'month', overlayLine, stacked = true, negativeCategories = [] }: Props) {
  if (overlayLine) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, undefined]} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {categories.map((c, i) => (
            <Bar
              key={c}
              dataKey={c}
              stackId={stacked ? (negativeCategories.includes(c) ? 'neg' : 's') : undefined}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              barSize={20}
              radius={[1, 1, 0, 0]}
            />
          ))}
          <Line type="monotone" dataKey={overlayLine} stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, undefined]} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {categories.map((c, i) => (
          <Bar key={c} dataKey={c} stackId={stacked ? 's' : undefined} fill={CHART_COLORS[i % CHART_COLORS.length]} barSize={20} radius={[1, 1, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
