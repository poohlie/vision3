import { useMemo } from 'react';

export type Imminence = 'Low' | 'Medium' | 'High';

export interface RiskScenario {
  name: string;
  /** Likelihood 0-100 */
  likelihood: number;
  /** Portfolio impact 0-100 (% drawdown / severity) */
  impact: number;
  /** Imminence: Low ≥3y, Medium 1-3y, High ≤1y */
  imminence: Imminence;
  /** Optional bubble size weight 0-1; defaults to 0.5 */
  weight?: number;
}

interface Props {
  data: RiskScenario[];
  height?: number;
  /** Compact mode hides labels and uses smaller bubbles (for overview tile) */
  compact?: boolean;
}

const IMMINENCE_COLOR: Record<Imminence, string> = {
  Low: 'hsl(140, 55%, 45%)',
  Medium: 'hsl(38, 90%, 52%)',
  High: 'hsl(0, 72%, 52%)',
};

const COLORS = {
  axis: 'hsl(215, 15%, 48%)',
  text: 'hsl(215, 15%, 30%)',
  grid: 'hsl(215, 20%, 90%)',
  zoneLow: 'hsl(140, 55%, 45%)',
  zoneMid: 'hsl(38, 90%, 52%)',
  zoneHigh: 'hsl(0, 72%, 52%)',
};

export default function EnterpriseRiskMap({ data, height = 360, compact = false }: Props) {
  const W = 640;
  const H = compact ? 240 : 380;
  const pad = compact
    ? { l: 36, r: 16, t: 12, b: 30 }
    : { l: 56, r: 24, t: 16, b: 44 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const sx = (x: number) => pad.l + (x / 100) * plotW;
  const sy = (y: number) => pad.t + (1 - y / 100) * plotH;

  const ticks = [0, 20, 40, 60, 80, 100];

  // Bubble radii
  const baseR = compact ? 6 : 12;
  const rOf = (w?: number) => baseR + (w ?? 0.5) * (compact ? 4 : 10);

  // Identify highlight scenarios (top impact & top likelihood)
  const { topImpactIdx, topLikIdx } = useMemo(() => {
    let ti = 0, tl = 0;
    data.forEach((d, i) => {
      if (d.impact > data[ti].impact) ti = i;
      if (d.likelihood > data[tl].likelihood) tl = i;
    });
    return { topImpactIdx: ti, topLikIdx: tl };
  }, [data]);

  // Simple label de-overlap: nudge label vertically based on neighbors
  const labels = useMemo(() => {
    if (compact) return [];
    return data.map((d, i) => {
      const cx = sx(d.likelihood);
      const cy = sy(d.impact);
      // place label to the right by default; flip left if near right edge
      const onRight = d.likelihood < 75;
      return {
        idx: i,
        x: onRight ? cx + rOf(d.weight) + 4 : cx - rOf(d.weight) - 4,
        y: cy + 3,
        anchor: onRight ? 'start' : 'end',
        text: `${d.name} (I:${d.impact} · L:${d.likelihood})`,
      } as const;
    });
  }, [data, compact]);

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Soft heat-zone background (low-left → high-right) */}
        <defs>
          <linearGradient id="erm-bg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={COLORS.zoneLow} stopOpacity={0.06} />
            <stop offset="55%" stopColor={COLORS.zoneMid} stopOpacity={0.07} />
            <stop offset="100%" stopColor={COLORS.zoneHigh} stopOpacity={0.10} />
          </linearGradient>
        </defs>
        <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="url(#erm-bg)" />

        {/* Grid */}
        {ticks.map((v, i) => (
          <g key={`g-${i}`}>
            <line x1={sx(v)} x2={sx(v)} y1={pad.t} y2={H - pad.b} stroke={COLORS.grid} strokeWidth={0.5} />
            <line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke={COLORS.grid} strokeWidth={0.5} />
          </g>
        ))}

        {/* Axes */}
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={COLORS.axis} strokeWidth={1} />
        <line x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} stroke={COLORS.axis} strokeWidth={1} />

        {/* Tick labels */}
        {!compact && ticks.map((v, i) => (
          <g key={`tl-${i}`}>
            <text x={sx(v)} y={H - pad.b + 14} textAnchor="middle" fontSize={10} fill={COLORS.axis}>{v}</text>
            <text x={pad.l - 8} y={sy(v) + 3} textAnchor="end" fontSize={10} fill={COLORS.axis}>{v}</text>
          </g>
        ))}

        {/* Axis titles */}
        {!compact && (
          <>
            <text x={pad.l + plotW / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={COLORS.axis}>
              Likelihood →
            </text>
            <text
              x={14}
              y={pad.t + plotH / 2}
              textAnchor="middle"
              fontSize={11}
              fill={COLORS.axis}
              transform={`rotate(-90, 14, ${pad.t + plotH / 2})`}
            >
              Portfolio impact →
            </text>
          </>
        )}

        {/* Bubbles */}
        {data.map((d, i) => {
          const cx = sx(d.likelihood);
          const cy = sy(d.impact);
          const r = rOf(d.weight);
          const color = IMMINENCE_COLOR[d.imminence];
          const isHighlight = i === topImpactIdx || i === topLikIdx;
          return (
            <g key={`b-${i}`}>
              <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.25} />
              <circle cx={cx} cy={cy} r={r * 0.55} fill={color} stroke="white" strokeWidth={1.25} />
              {isHighlight && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + (compact ? 3 : 5)}
                  fill="none"
                  stroke={COLORS.text}
                  strokeWidth={1.25}
                  strokeDasharray="2 2"
                />
              )}
            </g>
          );
        })}

        {/* Compact-mode highlight labels for top impact & top likelihood */}
        {compact && [topImpactIdx, topLikIdx]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((idx) => {
            const d = data[idx];
            const cx = sx(d.likelihood);
            const cy = sy(d.impact);
            const onRight = d.likelihood < 70;
            const role = idx === topImpactIdx && idx === topLikIdx
              ? `${d.name} (top impact & likelihood)`
              : idx === topImpactIdx
                ? `${d.name} (top impact)`
                : `${d.name} (top likelihood)`;
            return (
              <text
                key={`hl-${idx}`}
                x={onRight ? cx + rOf(d.weight) + 5 : cx - rOf(d.weight) - 5}
                y={cy + 3}
                textAnchor={onRight ? 'start' : 'end'}
                fontSize={9}
                fontWeight={700}
                fill={COLORS.text}
                style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round' }}
              >
                {role}
              </text>
            );
          })}

        {/* Labels */}
        {!compact && labels.map(l => (
          <text
            key={`lbl-${l.idx}`}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            fontSize={10}
            fontWeight={600}
            fill={COLORS.text}
            style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round' }}
          >
            {l.text}
          </text>
        ))}

        {/* Legend */}
        {!compact && (
          <g transform={`translate(${W - pad.r - 230}, ${pad.t + 4})`}>
            <rect x={0} y={0} width={230} height={22} rx={4} fill="white" fillOpacity={0.9} stroke={COLORS.grid} strokeWidth={0.5} />
            <text x={10} y={14} fontSize={10} fontWeight={600} fill={COLORS.text}>Imminence:</text>
            <g transform="translate(82, 0)">
              <circle cx={6} cy={11} r={4} fill={IMMINENCE_COLOR.Low} />
              <text x={14} y={14} fontSize={10} fill={COLORS.text}>Low ≥3y</text>
            </g>
            <g transform="translate(140, 0)">
              <circle cx={6} cy={11} r={4} fill={IMMINENCE_COLOR.Medium} />
              <text x={14} y={14} fontSize={10} fill={COLORS.text}>Med 1–3y</text>
            </g>
            <g transform="translate(195, 0)">
              <circle cx={6} cy={11} r={4} fill={IMMINENCE_COLOR.High} />
              <text x={14} y={14} fontSize={10} fill={COLORS.text}>High ≤1y</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export const ENTERPRISE_RISK_SCENARIOS: RiskScenario[] = [
  { name: 'AI software disruption', likelihood: 72, impact: 48, imminence: 'High', weight: 0.7 },
  { name: 'Middle East regional war', likelihood: 55, impact: 62, imminence: 'High', weight: 0.8 },
  { name: 'Disruptive inflation', likelihood: 48, impact: 70, imminence: 'Medium', weight: 0.85 },
  { name: 'China hard landing', likelihood: 38, impact: 78, imminence: 'Medium', weight: 0.9 },
  { name: 'Aggressive physical climate', likelihood: 60, impact: 55, imminence: 'Low', weight: 0.75 },
  { name: 'US fiscal crisis', likelihood: 32, impact: 82, imminence: 'Medium', weight: 0.8 },
  { name: 'Cyber infrastructure attack', likelihood: 65, impact: 40, imminence: 'High', weight: 0.55 },
  { name: 'Sovereign debt contagion', likelihood: 28, impact: 68, imminence: 'Low', weight: 0.6 },
  { name: 'Energy transition shock', likelihood: 45, impact: 50, imminence: 'Low', weight: 0.5 },
  { name: 'Pandemic resurgence', likelihood: 22, impact: 58, imminence: 'Low', weight: 0.45 },
  { name: 'Taiwan Strait conflict', likelihood: 25, impact: 88, imminence: 'Medium', weight: 0.95 },
  { name: 'Private credit blow-up', likelihood: 42, impact: 38, imminence: 'High', weight: 0.5 },
];
