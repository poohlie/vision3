import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  colorByValue?: boolean;
  barColor?: string;
}

export default function FinancialBarChart({ data: rawData, height = 250, layout = 'vertical', colorByValue = true, barColor }: Props) {
  const data = [...rawData].sort((a, b) => b.value - a.value);

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
          <ReferenceLine x={0} stroke="hsl(215, 20%, 80%)" />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorByValue ? (d.value >= 0 ? 'hsl(212, 72%, 42%)' : 'hsl(0, 72%, 51%)') : (barColor || 'hsl(212, 72%, 42%)')} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <ReferenceLine y={0} stroke="hsl(215, 20%, 80%)" />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorByValue ? (d.value >= 0 ? 'hsl(212, 72%, 42%)' : 'hsl(0, 72%, 51%)') : (barColor || 'hsl(212, 72%, 42%)')} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
