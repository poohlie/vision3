import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Text, LabelList } from 'recharts';

interface DataItem {
  name: string;
  value: number;
  group: string;
}

interface Props {
  data: DataItem[];
  height?: number;
  colorByValue?: boolean;
  barColor?: string;
  totalBar?: { name: string; value: number };
}

const GROUP_COLORS: Record<string, string> = {
  DM: 'hsl(212, 72%, 42%)',
  EM: 'hsl(32, 80%, 50%)',
};

const GROUP_LABELS: Record<string, string> = {
  DM: 'Developed Markets',
  EM: 'Emerging Markets',
};

const TOP_N_OPTIONS = [3, 5, 8, 10] as const;

export default function GroupedBarChart({ data, height = 250, colorByValue = false, barColor, totalBar }: Props) {
  const [topN, setTopN] = useState(5);
  const groups = Array.from(new Set(data.map(d => d.group)));

  const chartData: (DataItem & { isTotal?: boolean; isGrandTotal?: boolean; displayLabel?: string })[] = [];

  // Optional top-level total bar (e.g. ACWI)
  if (totalBar) {
    chartData.push({
      name: totalBar.name,
      value: +totalBar.value.toFixed(1),
      group: '_total',
      isTotal: true,
      isGrandTotal: true,
      displayLabel: `${totalBar.name} — ${totalBar.value.toFixed(1)}%`,
    });
  }

  groups.forEach(group => {
    const items = data.filter(d => d.group === group).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const groupTotal = items.reduce((s, d) => s + d.value, 0);
    const topItems = items.slice(0, topN);
    const othersValue = items.slice(topN).reduce((s, d) => s + d.value, 0);

    chartData.push({
      name: GROUP_LABELS[group] || group,
      value: +groupTotal.toFixed(1),
      group,
      isTotal: true,
      displayLabel: `${(GROUP_LABELS[group] || group)} — ${groupTotal.toFixed(1)}%`,
    });
    topItems.forEach(item => chartData.push({ ...item, displayLabel: `  ${item.name}` }));
    if (othersValue !== 0 && items.length > topN) {
      chartData.push({ name: `Others (${group})`, value: +othersValue.toFixed(1), group, displayLabel: '  Others' });
    }
  });

  const dynamicHeight = Math.max(height, chartData.length * 28 + 40);

  return (
    <div>
      <div className="flex items-center justify-end gap-1.5 mb-2 px-1">
        <span className="text-[10px] text-muted-foreground">Top</span>
        <div className="flex rounded-md border bg-muted/50 p-0.5">
          {TOP_N_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              className={`px-1.5 py-0.5 text-[10px] rounded-sm font-medium transition-all ${
                topN === n ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={dynamicHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
          <YAxis
            type="category"
            dataKey="displayLabel"
            width={160}
            tick={(props: any) => {
              const item = chartData.find(d => d.displayLabel === props.payload.value);
              const isTotal = item?.isTotal;
              return (
                <Text
                  {...props}
                  fontSize={isTotal ? 11 : 10}
                  fontWeight={isTotal ? 700 : 400}
                  fill={isTotal ? 'hsl(var(--foreground))' : 'hsl(215, 15%, 55%)'}
                >
                  {props.payload.value}
                </Text>
              );
            }}
          />
          <ReferenceLine x={0} stroke="hsl(215, 20%, 80%)" />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={16}>
            <LabelList
              dataKey="value"
              position="right"
              fontSize={9}
              fill="hsl(215, 15%, 55%)"
              formatter={(v: number) => `${v}%`}
            />
            {chartData.map((d, i) => {
              const baseColor = GROUP_COLORS[d.group] || barColor || 'hsl(212, 72%, 42%)';
              let fill: string;
              if (colorByValue) {
                fill = d.value >= 0 ? 'hsl(212, 72%, 42%)' : 'hsl(0, 72%, 51%)';
              } else if (d.isTotal) {
                fill = baseColor;
              } else {
                fill = d.group === 'DM' ? 'hsl(212, 55%, 68%)' : 'hsl(32, 60%, 70%)';
              }
              return <Cell key={i} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
