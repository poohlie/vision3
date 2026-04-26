import { useMemo } from 'react';

interface Props {
  /** Benchmark/baseline risk at TE=0 (e.g. benchmark volatility, in %) */
  benchmarkRisk: number;
  /** Portfolio's current tracking error (%) */
  portfolioTE: number;
  /** Correlation between active return and benchmark return */
  rho: number;
  /** Y-axis label, depends on selected risk measure */
  yLabel: string;
  /** Short symbol for portfolio risk callout (e.g. "σ_p", "ETL_p") */
  portfolioSymbol: string;
  /** Max tracking error to plot on x-axis (%). Default 32. */
  maxTE?: number;
  /** Display values as negative (for ETL). Default false. */
  negative?: boolean;
}

const COLORS = {
  primary: 'hsl(212, 72%, 42%)',
  bandStroke: 'hsl(212, 60%, 70%)',
  bandFill: 'hsl(212, 60%, 70%)',
  rhoLine: 'hsl(212, 50%, 80%)',
  text: 'hsl(215, 15%, 30%)',
  axis: 'hsl(215, 15%, 48%)',
  grid: 'hsl(215, 20%, 90%)',
  bench: 'hsl(40, 70%, 50%)',
};

/**
 * Portfolio risk as a function of tracking error, given:
 *   risk_p² = risk_b² + TE² + 2·ρ·risk_b·TE
 * Bounded above by ρ=+1 and below by ρ=-1 (with floor at 0).
 */
function curveAt(riskB: number, te: number, rho: number) {
  const v2 = riskB * riskB + te * te + 2 * rho * riskB * te;
  return Math.sqrt(Math.max(0, v2));
}

export default function RiskFrontierChart({
  benchmarkRisk,
  portfolioTE,
  rho,
  yLabel,
  portfolioSymbol,
  maxTE = 32,
  negative = false,
}: Props) {
  const sign = negative ? -1 : 1;

  // Build sample points along x-axis
  const samples = 80;
  const teValues = useMemo(
    () => Array.from({ length: samples + 1 }, (_, i) => (i / samples) * maxTE),
    [maxTE]
  );

  const upperPoints = teValues.map(te => ({ x: te, y: curveAt(benchmarkRisk, te, 1) }));
  const lowerPoints = teValues.map(te => ({ x: te, y: curveAt(benchmarkRisk, te, -1) }));
  const actualPoints = teValues.map(te => ({ x: te, y: curveAt(benchmarkRisk, te, rho) }));
  const rhoHalfUp = teValues.map(te => ({ x: te, y: curveAt(benchmarkRisk, te, 0.5) }));
  const rhoHalfDn = teValues.map(te => ({ x: te, y: curveAt(benchmarkRisk, te, -0.5) }));

  const yMaxData = curveAt(benchmarkRisk, maxTE, 1);
  const yMax = Math.ceil(yMaxData / 5) * 5; // nearest 5

  // SVG layout
  const W = 640;
  const H = 360;
  const pad = { l: 60, r: 70, t: 16, b: 44 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const sx = (x: number) => pad.l + (x / maxTE) * plotW;
  const sy = (y: number) => pad.t + (1 - y / yMax) * plotH;

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ');

  // Filled band between ρ=+1 and ρ=-1
  const bandPath =
    upperPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ') +
    ' ' +
    [...lowerPoints].reverse().map(p => `L ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ') +
    ' Z';

  // Portfolio marker on actual ρ curve
  const portfolioRisk = curveAt(benchmarkRisk, portfolioTE, rho);
  const px = sx(portfolioTE);
  const py = sy(portfolioRisk);

  // Ticks
  const xTickCount = 7;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => (i * maxTE) / (xTickCount - 1));
  const yTickCount = 6;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => (i * yMax) / (yTickCount - 1));

  const fmtPct = (v: number) => `${(sign * v).toFixed(v < 10 && v > 0 ? 1 : 0)}%`;

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {xTicks.map((v, i) => (
          <line key={`gx-${i}`} x1={sx(v)} x2={sx(v)} y1={pad.t} y2={H - pad.b}
                stroke={COLORS.grid} strokeWidth={0.5} />
        ))}
        {yTicks.map((v, i) => (
          <line key={`gy-${i}`} x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)}
                stroke={COLORS.grid} strokeWidth={0.5} />
        ))}

        {/* Feasible band */}
        <path d={bandPath} fill={COLORS.bandFill} fillOpacity={0.15} stroke="none" />

        {/* Bounding curves ρ=+1, ρ=-1 */}
        <path d={toPath(upperPoints)} fill="none" stroke={COLORS.bandStroke} strokeWidth={1.2} />
        <path d={toPath(lowerPoints)} fill="none" stroke={COLORS.bandStroke} strokeWidth={1.2} />

        {/* Intermediate ρ guides */}
        <path d={toPath(rhoHalfUp)} fill="none" stroke={COLORS.rhoLine} strokeWidth={0.8} />
        <path d={toPath(rhoHalfDn)} fill="none" stroke={COLORS.rhoLine} strokeWidth={0.8} />

        {/* Actual ρ curve (highlighted) */}
        <path d={toPath(actualPoints)} fill="none" stroke={COLORS.primary} strokeWidth={2.4} />

        {/* Curve right-edge labels */}
        <text x={W - pad.r + 6} y={sy(upperPoints[upperPoints.length - 1].y) + 3}
              fontSize={10} fill={COLORS.axis}>ρ = +1</text>
        <text x={W - pad.r + 6} y={sy(actualPoints[actualPoints.length - 1].y) + 3}
              fontSize={10} fontWeight={700} fill={COLORS.primary}>ρ = {rho.toFixed(2)}</text>
        <text x={W - pad.r + 6} y={sy(lowerPoints[lowerPoints.length - 1].y) + 3}
              fontSize={10} fill={COLORS.axis}>ρ = −1</text>

        {/* Benchmark point at TE=0 */}
        <circle cx={sx(0)} cy={sy(benchmarkRisk)} r={5} fill={COLORS.bench} stroke="white" strokeWidth={1.5} />
        <text x={sx(0) - 8} y={sy(benchmarkRisk) + 3} textAnchor="end"
              fontSize={10} fontWeight={600} fill={COLORS.bench}>{fmtPct(benchmarkRisk)}</text>

        {/* Portfolio point */}
        <circle cx={px} cy={py} r={9} fill={COLORS.primary} fillOpacity={0.2} />
        <circle cx={px} cy={py} r={5.5} fill={COLORS.primary} stroke="white" strokeWidth={1.5} />
        <g>
          <rect
            x={px + 8} y={py - 18} rx={3} ry={3}
            width={110} height={16}
            fill="white" fillOpacity={0.92} stroke={COLORS.grid} strokeWidth={0.5}
          />
          <text x={px + 14} y={py - 6} fontSize={10} fontWeight={700} fill={COLORS.text}>
            {portfolioSymbol} = {fmtPct(portfolioRisk)}
          </text>
        </g>

        {/* X axis ticks/labels */}
        {xTicks.map((v, i) => (
          <text key={`xl-${i}`} x={sx(v)} y={H - pad.b + 14} textAnchor="middle"
                fontSize={10} fill={COLORS.axis}>{v.toFixed(1)}%</text>
        ))}
        {/* Y axis ticks/labels */}
        {yTicks.map((v, i) => (
          <text key={`yl-${i}`} x={pad.l - 8} y={sy(v) + 3} textAnchor="end"
                fontSize={10} fill={COLORS.axis}>{fmtPct(v)}</text>
        ))}

        {/* Axis titles */}
        <text x={pad.l + plotW / 2} y={H - 6} textAnchor="middle"
              fontSize={11} fill={COLORS.axis}>Tracking error (%)</text>
        <text x={14} y={pad.t + plotH / 2} textAnchor="middle"
              fontSize={11} fill={COLORS.axis}
              transform={`rotate(-90, 14, ${pad.t + plotH / 2})`}>{yLabel}</text>
      </svg>
    </div>
  );
}
