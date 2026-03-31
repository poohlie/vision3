import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS } from '@/data/mockData';

interface Props {
  data: Record<string, string | number>[];
  lines: string[];
  height?: number;
  xKey?: string;
  projectionStartIdx?: number;
  lineColors?: Record<string, string>;
  connectNulls?: boolean;
}

export default function TrendChart({ data, lines, height = 250, xKey = 'month', lineColors, connectNulls = true }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: 11,
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
          }}
          formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, undefined]}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {lines.map((l, i) => (
          <Line
            key={l}
            type="monotone"
            dataKey={l}
            stroke={lineColors?.[l] || CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            connectNulls={connectNulls}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
