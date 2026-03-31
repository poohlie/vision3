import { ScatterChart as RScatter, Scatter, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell, Label as RLabel, Tooltip } from 'recharts';
import { CHART_COLORS } from '@/data/mockData';

interface Point { name: string; x: number; y: number; }

interface Props {
  data: Point[];
  xLabel: string;
  yLabel: string;
  height?: number;
}

export default function ScatterPlot({ data, xLabel, yLabel, height = 250 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RScatter>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis type="number" dataKey="x" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`}>
          <RLabel value={xLabel} position="bottom" style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        </XAxis>
        <YAxis type="number" dataKey="y" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`}>
          <RLabel value={yLabel} angle={-90} position="insideLeft" style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        </YAxis>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: 11,
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, undefined]}
        />
        <Scatter data={data} fill="hsl(var(--chart-1))">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} r={6} />
          ))}
        </Scatter>
      </RScatter>
    </ResponsiveContainer>
  );
}
