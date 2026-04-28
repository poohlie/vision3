import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip, Legend } from 'recharts';

const COMPARE_COLORS = [
  'hsl(212, 72%, 42%)',
  'hsl(185, 58%, 38%)',
  'hsl(38, 90%, 50%)',
];

interface SingleProps {
  data: { name: string; value: number; limit?: number }[];
  datasets?: never;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  colorByValue?: boolean;
  barColor?: string;
  preserveOrder?: boolean;
  showLimit?: boolean;
}

interface MultiProps {
  data?: never;
  datasets: { label: string; data: { name: string; value: number }[] }[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  colorByValue?: boolean;
  barColor?: string;
  preserveOrder?: boolean;
  showLimit?: never;
}

type Props = SingleProps | MultiProps;

export default function FinancialBarChart({ data: rawData, datasets, height = 250, layout = 'vertical', colorByValue = true, barColor, preserveOrder = false, showLimit = false }: Props) {
  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    fontSize: 11,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
  };

  // Multi-dataset grouped mode
  if (datasets && datasets.length > 1) {
    const names = datasets[0].data.map(d => d.name);
    const chartData = names.map(name => {
      const row: Record<string, any> = { name };
      datasets.forEach(ds => {
        const item = ds.data.find(d => d.name === name);
        row[ds.label] = item?.value || 0;
      });
      return row;
    });
    // Sort by first dataset value descending
    chartData.sort((a, b) => (b[datasets[0].label] || 0) - (a[datasets[0].label] || 0));

    if (layout === 'vertical') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" interval={0} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
            <ReferenceLine x={0} stroke="hsl(var(--border))" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, undefined]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {datasets.map((ds, i) => (
              <Bar key={ds.label} dataKey={ds.label} fill={COMPARE_COLORS[i]} radius={[0, 3, 3, 0]} barSize={10} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, undefined]} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {datasets.map((ds, i) => (
            <Bar key={ds.label} dataKey={ds.label} fill={COMPARE_COLORS[i]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Single dataset mode (original behavior)
  const singleData = rawData || (datasets ? datasets[0].data : []);
  const data = preserveOrder ? singleData : [...singleData].sort((a, b) => b.value - a.value);
  const totalSet = new Set(singleData.filter((d: any) => d.isTotal).map((d: any) => d.name));

  const CustomYTick = ({ x, y, payload }: any) => {
    const isTotal = totalSet.has(payload.value);
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fontSize={isTotal ? 11 : 10} fontWeight={isTotal ? 700 : 400} fill={isTotal ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}>
        {payload.value}
      </text>
    );
  };

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" interval={0} tick={totalSet.size > 0 ? <CustomYTick /> : { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Value']} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
            {data.map((d: any, i: number) => {
              const isTotal = totalSet.has(d.name);
              const fill = colorByValue ? (d.value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-negative))') : (barColor || 'hsl(var(--chart-1))');
              return <Cell key={i} fill={fill} fillOpacity={isTotal ? 1 : 0.65} stroke={isTotal ? fill : 'none'} strokeWidth={isTotal ? 1.5 : 0} />;
            })}
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
