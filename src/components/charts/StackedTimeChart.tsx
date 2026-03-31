import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { CHART_COLORS } from '@/data/mockData';

interface Props {
  data: Record<string, string | number>[];
  categories: string[];
  height?: number;
  xKey?: string;
  overlayLine?: string;
  stacked?: boolean;
  negativeCategories?: string[];
}

export default function StackedTimeChart({ data, categories, height = 250, xKey = 'month', overlayLine, stacked = true, negativeCategories = [] }: Props) {
  if (overlayLine) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {categories.map((c, i) => (
            <Bar
              key={c}
              dataKey={c}
              stackId={stacked ? (negativeCategories.includes(c) ? 'neg' : 's') : undefined}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              barSize={20}
            />
          ))}
          <Line type="monotone" dataKey={overlayLine} stroke="hsl(215, 60%, 18%)" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
        
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {categories.map((c, i) => (
          <Bar key={c} dataKey={c} stackId={stacked ? 's' : undefined} fill={CHART_COLORS[i % CHART_COLORS.length]} barSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
