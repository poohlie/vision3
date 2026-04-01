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
  horizontal?: boolean;
}

export default function CompareWaterfallChart({ datasets, onBarClick, horizontal }: Props) {
  if (datasets.length === 1) {
    return <SingleWaterfall data={datasets[0].data} onBarClick={onBarClick} horizontal={horizontal} />;
  }

  // Grouped comparison mode
  const categories = datasets[0].data.map(d => d.name);
  const chartData = categories.map(cat => {
    const row: Record<string, any> = { name: cat };
    datasets.forEach((ds, i) => {
      const item = ds.data.find(d => d.name === cat);
      row[ds.label] = item?.value || 0;
      row[`${ds.label}_isTotal`] = item?.isTotal || false;
    });
    return row;
  });

  // Reverse for horizontal so first category appears at top
  const finalData = horizontal ? [...chartData].reverse() : chartData;

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    fontSize: 11,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
  };

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={finalData} layout="vertical" barCategoryGap="18%">
          <Y

            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={90}
            interval={0}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={v => `${v}%`}
          />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {datasets.map((ds, i) => (
            <Bar
              key={ds.label}
              dataKey={ds.label}
              fill={COMPARE_COLORS[i]}
              radius={[0, 2, 2, 0]}
              onClick={(d) => onBarClick?.(d.name)}
              cursor={onBarClick ? 'pointer' : 'default'}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={finalData} barCategoryGap="18%">
        <XAxis dataKey="name" tick={({ x, y, payload }) => {
          const words = payload.value.split(' ');
          return (
            <text x={x} y={y} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
              {words.length > 1 ? words.map((w: string, i: number) => (
                <tspan key={i} x={x} dy={i === 0 ? 4 : 11}>{w}</tspan>
              )) : <tspan dy={4}>{payload.value}</tspan>}
            </text>
          );
        }} interval={0} height={45} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, undefined]}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {datasets.map((ds, i) => (
          <Bar
            key={ds.label}
            dataKey={ds.label}
            fill={COMPARE_COLORS[i]}
            radius={[2, 2, 0, 0]}
            onClick={(d) => onBarClick?.(d.name)}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SingleWaterfall({ data, onBarClick, horizontal }: { data: WfItem[]; onBarClick?: (name: string) => void; horizontal?: boolean }) {
  let running = 0;
  const processed = data.map(d => {
    if (d.isTotal) {
      const result = { ...d, invisible: 0, visible: d.value, label: d.value };
      running = d.value;
      return result;
    }
    const invisible = d.value >= 0 ? running : running + d.value;
    running += d.value;
    return { ...d, invisible, visible: Math.abs(d.value), label: d.value };
  });

  // For horizontal layout, reverse so top item appears first
  const chartData = horizontal ? [...processed].reverse() : processed;

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    fontSize: 11,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
  };

  const tooltipFormatter = (value: number, name: string) => {
    if (name === 'invisible') return [null, null];
    return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Value'];
  };

  const cellFill = (d: typeof processed[0]) =>
    d.isTotal ? 'hsl(var(--chart-total))' : d.value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-negative))';

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barCategoryGap="10%">
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={90}
            interval={0}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={v => `${v}%`}
          />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Bar dataKey="invisible" stackId="s" fill="transparent" />
          <Bar dataKey="visible" stackId="s" radius={[0, 2, 2, 0]} onClick={(d) => onBarClick?.(d.name)}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={cellFill(d)} cursor={onBarClick ? 'pointer' : 'default'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="10%">
        <XAxis dataKey="name" tick={({ x, y, payload }) => {
          const words = payload.value.split(' ');
          return (
            <text x={x} y={y} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
              {words.length > 1 ? words.map((w: string, i: number) => (
                <tspan key={i} x={x} dy={i === 0 ? 4 : 11}>{w}</tspan>
              )) : <tspan dy={4}>{payload.value}</tspan>}
            </text>
          );
        }} interval={0} height={45} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
        <Bar dataKey="invisible" stackId="s" fill="transparent" />
        <Bar dataKey="visible" stackId="s" radius={[2, 2, 0, 0]} onClick={(d) => onBarClick?.(d.name)}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={cellFill(d)} cursor={onBarClick ? 'pointer' : 'default'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
