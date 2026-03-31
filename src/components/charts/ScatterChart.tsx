import { ScatterChart as RScatter, Scatter, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell, Label as RLabel } from 'recharts';
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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 89%)" />
        <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`}>
          <RLabel value={xLabel} position="bottom" style={{ fontSize: 10, fill: 'hsl(215, 15%, 48%)' }} />
        </XAxis>
        <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`}>
          <RLabel value={yLabel} angle={-90} position="insideLeft" style={{ fontSize: 10, fill: 'hsl(215, 15%, 48%)' }} />
        </YAxis>
        
        <Scatter data={data} fill="hsl(212, 72%, 42%)">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} r={6} />
          ))}
        </Scatter>
      </RScatter>
    </ResponsiveContainer>
  );
}
