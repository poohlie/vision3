import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';

interface WfItem { name: string; value: number; isTotal: boolean; }

const renderLabel = (props: any) => {
  const { x, y, width, value, index } = props;
  if (value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill="hsl(215, 50%, 12%)">
      {`${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
    </text>
  );
};

export default function WaterfallChart({ data, height = 250, onBarClick }: { data: WfItem[]; height?: number; onBarClick?: (name: string) => void }) {
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={processed} barCategoryGap="10%">
        <XAxis dataKey="name" tick={({ x, y, payload }) => {
          const words = payload.value.split(' ');
          return (
            <text x={x} y={y} textAnchor="middle" fontSize={10}>
              {words.length > 1 ? words.map((w: string, i: number) => (
                <tspan key={i} x={x} dy={i === 0 ? 4 : 12}>{w}</tspan>
              )) : <tspan dy={4}>{payload.value}</tspan>}
            </text>
          );
        }} interval={0} height={45} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <ReferenceLine y={0} stroke="hsl(215, 20%, 80%)" />
        <Bar dataKey="invisible" stackId="s" fill="transparent" />
        <Bar dataKey="visible" stackId="s" radius={[2, 2, 0, 0]} onClick={(d) => onBarClick?.(d.name)}>
          {processed.map((d, i) => (
            <Cell
              key={i}
              fill={d.isTotal ? 'hsl(215, 60%, 18%)' : d.value >= 0 ? 'hsl(212, 72%, 42%)' : 'hsl(0, 72%, 51%)'}
              cursor={onBarClick ? 'pointer' : 'default'}
            />
          ))}
          <LabelList dataKey="label" content={renderLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
