import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
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
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
        
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
