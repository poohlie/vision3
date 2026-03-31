import { useMemo } from 'react';

interface RiskTriangleProps {
  volP: number;    // Portfolio volatility
  volB1: number;   // Benchmark 1 volatility
  volB2: number;   // Benchmark 2 volatility
  teP_B1: number;  // Tracking error P vs B1
  teP_B2: number;  // Tracking error P vs B2
}

/**
 * Uses law of cosines to place points such that:
 * - Distance from origin = Volatility
 * - Distance between points = Tracking Error
 * B1 is placed on the x-axis at (volB1, 0).
 */
function computeCoords({ volP, volB1, volB2, teP_B1, teP_B2 }: RiskTriangleProps) {
  // B1 on x-axis
  const b1 = { x: volB1, y: 0 };

  // P relative to B1 using law of cosines: volP² = volB1² + teP_B1² - 2·volB1·teP_B1·cos(angle at B1)
  // Actually: teP_B1² = volP² + volB1² - 2·volP·volB1·cos(angle at origin between P and B1)
  // Place P: distance from origin = volP, distance from B1 = teP_B1
  // cos(theta_P) = (volP² + 0² - teP_B1² + volB1²) ... use triangle with origin, P, B1
  // From origin: |OP|=volP, |OB1|=volB1, |PB1|=teP_B1
  // cos(angle at O) = (volP² + volB1² - teP_B1²) / (2·volP·volB1)
  const cosP = (volP * volP + volB1 * volB1 - teP_B1 * teP_B1) / (2 * volP * volB1);
  const sinP = Math.sqrt(Math.max(0, 1 - cosP * cosP));
  const p = { x: volP * cosP, y: volP * sinP };

  // B2: distance from origin = volB2, distance from P = teP_B2
  // From origin-P-B2 triangle: cos(angle at O between B2 and P direction)
  // But we need angle from x-axis. Use origin, B2, P triangle:
  // |OB2|=volB2, |PB2|=teP_B2, |OP|=volP
  const cosB2_P = (volB2 * volB2 + volP * volP - teP_B2 * teP_B2) / (2 * volB2 * volP);
  // Angle of P from x-axis
  const angleP = Math.atan2(p.y, p.x);
  // Angle of B2 from P direction (try below P first for visual clarity)
  const angleB2fromP = Math.acos(Math.max(-1, Math.min(1, cosB2_P)));
  const angleB2 = angleP - angleB2fromP;
  const b2 = { x: volB2 * Math.cos(angleB2), y: volB2 * Math.sin(angleB2) };

  return { origin: { x: 0, y: 0 }, p, b1, b2 };
}

const COLORS = {
  portfolio: 'hsl(212, 72%, 42%)',
  b1: 'hsl(0, 72%, 51%)',
  b2: 'hsl(145, 52%, 32%)',
  line: 'hsl(215, 50%, 12%)',
  dashed: 'hsl(215, 20%, 70%)',
};

export default function RiskTriangleChart({
  volP = 11.5, volB1 = 14.0, volB2 = 9.5, teP_B1 = 4.5, teP_B2 = 3.2,
}: Partial<RiskTriangleProps>) {
  const coords = useMemo(
    () => computeCoords({ volP, volB1, volB2, teP_B1, teP_B2 }),
    [volP, volB1, volB2, teP_B1, teP_B2]
  );

  // Determine bounds with padding
  const allX = [0, coords.p.x, coords.b1.x, coords.b2.x];
  const allY = [0, coords.p.y, coords.b1.y, coords.b2.y];
  const minX = Math.min(...allX) - 2;
  const maxX = Math.max(...allX) + 2;
  const minY = Math.min(...allY) - 2.5;
  const maxY = Math.max(...allY) + 2.5;

  // SVG viewBox: we'll map data coords to SVG
  const svgW = 600;
  const svgH = 400;
  const pad = { l: 55, r: 30, t: 20, b: 40 };
  const plotW = svgW - pad.l - pad.r;
  const plotH = svgH - pad.t - pad.b;

  const sx = (v: number) => pad.l + ((v - minX) / (maxX - minX)) * plotW;
  const sy = (v: number) => pad.t + ((maxY - v) / (maxY - minY)) * plotH;

  // Grid lines
  const xTicks: number[] = [];
  for (let i = Math.ceil(minX); i <= Math.floor(maxX); i += 2) xTicks.push(i);
  const yTicks: number[] = [];
  for (let i = Math.ceil(minY); i <= Math.floor(maxY); i += 2) yTicks.push(i);

  const midLabel = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const midPB1 = midLabel(coords.p, coords.b1);
  const midPB2 = midLabel(coords.p, coords.b2);

  return (
    <div className="w-full h-full flex flex-col">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {xTicks.map(v => (
          <line key={`gx-${v}`} x1={sx(v)} x2={sx(v)} y1={pad.t} y2={svgH - pad.b} stroke="hsl(215, 20%, 90%)" strokeWidth={0.5} />
        ))}
        {yTicks.map(v => (
          <line key={`gy-${v}`} x1={pad.l} x2={svgW - pad.r} y1={sy(v)} y2={sy(v)} stroke="hsl(215, 20%, 90%)" strokeWidth={0.5} />
        ))}

        {/* Axes */}
        {minX <= 0 && maxX >= 0 && (
          <line x1={sx(0)} x2={sx(0)} y1={pad.t} y2={svgH - pad.b} stroke="hsl(215, 20%, 80%)" strokeWidth={1} />
        )}
        {minY <= 0 && maxY >= 0 && (
          <line x1={pad.l} x2={svgW - pad.r} y1={sy(0)} y2={sy(0)} stroke="hsl(215, 20%, 80%)" strokeWidth={1} />
        )}

        {/* Axis labels */}
        {xTicks.map(v => (
          <text key={`xl-${v}`} x={sx(v)} y={svgH - pad.b + 16} textAnchor="middle" fontSize={9} fill="hsl(215, 15%, 48%)">{v}</text>
        ))}
        {yTicks.map(v => (
          <text key={`yl-${v}`} x={pad.l - 8} y={sy(v) + 3} textAnchor="end" fontSize={9} fill="hsl(215, 15%, 48%)">{v}</text>
        ))}

        {/* Axis titles */}
        <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={10} fill="hsl(215, 15%, 48%)">
          Systematic Risk / Deviation (units of volatility %)
        </text>
        <text x={14} y={svgH / 2} textAnchor="middle" fontSize={10} fill="hsl(215, 15%, 48%)" transform={`rotate(-90, 14, ${svgH / 2})`}>
          Tracking Risk / Deviation (units of volatility %)
        </text>

        {/* Dashed lines from origin to each point (volatility) */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(coords.b1.x)} y2={sy(coords.b1.y)} stroke={COLORS.b1} strokeWidth={1.2} strokeDasharray="6 3" opacity={0.6} />
        <line x1={sx(0)} y1={sy(0)} x2={sx(coords.p.x)} y2={sy(coords.p.y)} stroke={COLORS.portfolio} strokeWidth={1.2} strokeDasharray="6 3" opacity={0.6} />
        <line x1={sx(0)} y1={sy(0)} x2={sx(coords.b2.x)} y2={sy(coords.b2.y)} stroke={COLORS.b2} strokeWidth={1.2} strokeDasharray="6 3" opacity={0.6} />

        {/* Vol labels on dashed lines */}
        <text x={sx(coords.b1.x / 2)} y={sy(coords.b1.y / 2) + 14} textAnchor="middle" fontSize={9} fontWeight={600} fill={COLORS.b1}>
          Vol={volB1}%
        </text>
        <text x={sx(coords.p.x / 2) - 10} y={sy(coords.p.y / 2) - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={COLORS.portfolio}>
          Vol={volP}%
        </text>
        <text x={sx(coords.b2.x / 2)} y={sy(coords.b2.y / 2) - 8} textAnchor="middle" fontSize={9} fontWeight={600} fill={COLORS.b2}>
          Vol={volB2}%
        </text>

        {/* Solid TE lines between points */}
        <line x1={sx(coords.p.x)} y1={sy(coords.p.y)} x2={sx(coords.b1.x)} y2={sy(coords.b1.y)} stroke={COLORS.line} strokeWidth={2} />
        <line x1={sx(coords.p.x)} y1={sy(coords.p.y)} x2={sx(coords.b2.x)} y2={sy(coords.b2.y)} stroke={COLORS.line} strokeWidth={2} />
        <line x1={sx(coords.b1.x)} y1={sy(coords.b1.y)} x2={sx(coords.b2.x)} y2={sy(coords.b2.y)} stroke={COLORS.line} strokeWidth={2} />

        {/* TE labels */}
        <text x={sx(midPB1.x) + 12} y={sy(midPB1.y) + 4} textAnchor="start" fontSize={10} fontWeight={700} fill={COLORS.line}>
          TE={teP_B1}%
        </text>
        <text x={sx(midPB2.x) - 6} y={sy(midPB2.y) - 6} textAnchor="end" fontSize={10} fontWeight={700} fill={COLORS.line}>
          TE={teP_B2}%
        </text>

        {/* Points */}
        {/* Origin */}
        <g>
          <line x1={sx(0) - 5} y1={sy(0) - 5} x2={sx(0) + 5} y2={sy(0) + 5} stroke={COLORS.line} strokeWidth={2} />
          <line x1={sx(0) - 5} y1={sy(0) + 5} x2={sx(0) + 5} y2={sy(0) - 5} stroke={COLORS.line} strokeWidth={2} />
          <text x={sx(0) - 8} y={sy(0) + 16} textAnchor="middle" fontSize={8} fill="hsl(215, 15%, 48%)">Origin</text>
          <text x={sx(0) - 8} y={sy(0) + 24} textAnchor="middle" fontSize={7} fill="hsl(215, 15%, 48%)">(0% Vol)</text>
        </g>

        {/* Portfolio */}
        <circle cx={sx(coords.p.x)} cy={sy(coords.p.y)} r={7} fill={COLORS.portfolio} />
        <text x={sx(coords.p.x)} y={sy(coords.p.y) - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={COLORS.portfolio}>Portfolio</text>

        {/* B1 */}
        <circle cx={sx(coords.b1.x)} cy={sy(coords.b1.y)} r={7} fill={COLORS.b1} />
        <text x={sx(coords.b1.x)} y={sy(coords.b1.y) - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={COLORS.b1}>Benchmark 1</text>

        {/* B2 */}
        <circle cx={sx(coords.b2.x)} cy={sy(coords.b2.y)} r={7} fill={COLORS.b2} />
        <text x={sx(coords.b2.x)} y={sy(coords.b2.y) + 18} textAnchor="middle" fontSize={10} fontWeight={700} fill={COLORS.b2}>Benchmark 2</text>

        {/* Legend */}
        <g transform={`translate(${svgW - pad.r - 150}, ${pad.t + 5})`}>
          <rect x={0} y={0} width={148} height={82} rx={4} fill="white" fillOpacity={0.85} stroke="hsl(215, 20%, 85%)" strokeWidth={0.5} />
          <line x1={10} y1={14} x2={16} y2={8} stroke={COLORS.line} strokeWidth={1.5} />
          <line x1={10} y1={8} x2={16} y2={14} stroke={COLORS.line} strokeWidth={1.5} />
          <text x={24} y={14} fontSize={8} fill="hsl(215, 15%, 30%)">Risk-Free (Cash)</text>
          <circle cx={13} cy={28} r={4} fill={COLORS.portfolio} />
          <text x={24} y={30} fontSize={8} fill="hsl(215, 15%, 30%)">Portfolio (P)</text>
          <circle cx={13} cy={42} r={4} fill={COLORS.b1} />
          <text x={24} y={44} fontSize={8} fill="hsl(215, 15%, 30%)">Benchmark 1 (B1)</text>
          <circle cx={13} cy={56} r={4} fill={COLORS.b2} />
          <text x={24} y={58} fontSize={8} fill="hsl(215, 15%, 30%)">Benchmark 2 (B2)</text>
          <line x1={8} y1={70} x2={20} y2={70} stroke={COLORS.line} strokeWidth={2} />
          <text x={24} y={72} fontSize={8} fill="hsl(215, 15%, 30%)">Tracking Error Paths</text>
        </g>
      </svg>
    </div>
  );
}
