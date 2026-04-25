import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ChartCard from '@/components/shared/ChartCard';
import ToggleBar from '@/components/shared/ToggleBar';
import TopNSelect from '@/components/shared/TopNSelect';
import FinancialBarChart from '@/components/charts/FinancialBarChart';
import StackedTimeChart from '@/components/charts/StackedTimeChart';
import TrendChart from '@/components/charts/TrendChart';
import {
  riskContribution, trackingErrorSeries, contributionTimeSeries,
  assetClassExposureData, timespans,
} from '@/data/mockData';

const riskTabsConfig = [
  { key: 'Absolute Risk' as const, metric: '11.5%', label: 'Total Vol (P)', subtitle: 'vs 10.2% Benchmark' },
  { key: 'Active Risk' as const, metric: '—', label: 'Active Risk', subtitle: 'Placeholder' },
  { key: 'Other Risk Metrics' as const, metric: '—', label: 'Other Risk Metrics', subtitle: 'Placeholder' },
];
const riskTabs = riskTabsConfig.map(t => t.key);
type RiskTab = typeof riskTabs[number];

export default function Risk() {
  const [searchParams] = useSearchParams();
  const initialTab = riskTabs.find(t => t === searchParams.get('tab')) || 'Absolute Risk';
  const [tab, setTab] = useState<RiskTab>(initialTab);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {riskTabsConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg border p-4 text-left transition-all',
              tab === t.key ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card hover:bg-muted/50'
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider">{t.key}</p>
            </div>
            <p className={cn(
              'text-2xl font-bold tracking-tight mt-2',
              tab === t.key ? 'text-primary-foreground' : 'text-accent'
            )}>{t.metric}</p>
            <p className={cn(
              'text-[11px] mt-1',
              tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>{t.label} · {t.subtitle}</p>
          </button>
        ))}
      </div>
      {tab === 'Absolute Risk' && <AbsoluteRiskSection />}
      {tab === 'Active Risk' && <PlaceholderSection title="Active Risk" />}
      {tab === 'Other Risk Metrics' && <PlaceholderSection title="Other Risk Metrics" />}
    </div>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id={`ph-${title}`} title={title}>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
          {title} — Placeholder
        </div>
      </ChartCard>
    </div>
  );
}

// ============ ABSOLUTE RISK ============
type View = 'Portfolio' | 'Benchmark';

// Components aligned with Performance/Exposure tabs
const PORTFOLIO_COMPONENTS = riskContribution.map(s => ({
  name: s.name,
  vol: +(s.ownTE * 1.6).toFixed(2),       // own-based vol
  contribution: +(s.contribution * 4).toFixed(2), // contribution to portfolio vol
}));

const BENCHMARK_COMPONENTS = assetClassExposureData.map((a, i) => {
  const seed = (i + 1) * 1.7;
  const vol = +(6 + Math.sin(seed) * 4 + a.benchmark / 12).toFixed(2);
  const contribution = +(a.benchmark / 100 * vol * 0.85).toFixed(2);
  return { name: a.name, vol, contribution };
});

function AbsoluteRiskSection() {
  const [contribView, setContribView] = useState<View>('Portfolio');
  const [ownView, setOwnView] = useState<View>('Portfolio');
  const [topN, setTopN] = useState(5);
  const [period, setPeriod] = useState<string>('1Y');

  const portfolioVol = 11.5;
  const benchmarkVol = 10.2;

  // Source list, sorted desc, with Top N + Others (only for portfolio; benchmark fully shown if small)
  const buildBars = (view: View) => {
    const src = view === 'Portfolio' ? PORTFOLIO_COMPONENTS : BENCHMARK_COMPONENTS;
    const sorted = [...src].sort((a, b) => b.contribution - a.contribution);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const restContrib = rest.reduce((s, r) => s + r.contribution, 0);
    const restVol = rest.length ? rest.reduce((s, r) => s + r.vol, 0) / rest.length : 0;
    const items = [...top];
    if (rest.length) items.push({ name: 'Others', vol: +restVol.toFixed(2), contribution: +restContrib.toFixed(2) });
    return items;
  };

  const contribBars = useMemo(() => buildBars(contribView), [contribView, topN]);
  const ownBars = useMemo(() => buildBars(ownView), [ownView, topN]);

  // Trend data: scale trackingErrorSeries to vol levels
  const volTrend = useMemo(() => trackingErrorSeries.map((d, i) => ({
    month: d.month,
    Portfolio: +(portfolioVol + Math.sin(i / 2) * 0.6 + (Math.random() - 0.5) * 0.2).toFixed(2),
    Benchmark: +(benchmarkVol + Math.sin(i / 2.5) * 0.5 + (Math.random() - 0.5) * 0.2).toFixed(2),
  })), []);

  // Stacked contribution-over-time trend (chart iv)
  const contribTrend = useMemo(() => {
    const totals = contribBars.reduce((s, b) => s + b.contribution, 0);
    const totalLine = contribView === 'Portfolio' ? portfolioVol : benchmarkVol;
    return trackingErrorSeries.map((d, i) => {
      const row: Record<string, string | number> = { month: d.month };
      contribBars.forEach((b, j) => {
        const wobble = 1 + Math.sin((i + j) / 2) * 0.15;
        row[b.name] = +(b.contribution * wobble).toFixed(2);
      });
      row['Total'] = +(totalLine + Math.sin(i / 2) * 0.5).toFixed(2);
      return row;
    });
  }, [contribBars, contribView]);

  // Own-based trend (chart vi) - one line per component
  const ownTrend = useMemo(() => trackingErrorSeries.map((d, i) => {
    const row: Record<string, string | number> = { month: d.month };
    ownBars.forEach((b, j) => {
      row[b.name] = +(b.vol + Math.sin((i + j * 1.3) / 2) * 0.4).toFixed(2);
    });
    return row;
  }), [ownBars]);

  return (
    <div className="space-y-4">
      {/* Period filter aligned with Performance/Exposure */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Period</span>
        <ToggleBar options={timespans as unknown as readonly string[]} value={period} onChange={setPeriod} size="xs" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* i) Vol comparison */}
        <ChartCard id="ar-1" title="Ex-Ante Volatility: Portfolio vs Benchmark" subtitle="Annualised, current snapshot">
          <VolGaugeCompare portfolio={portfolioVol} benchmark={benchmarkVol} />
        </ChartCard>

        {/* ii) Vol trend */}
        <ChartCard id="ar-2" title="Ex-Ante Volatility Trend" subtitle="Portfolio vs Benchmark, rolling">
          <TrendChart
            data={volTrend}
            lines={['Portfolio', 'Benchmark']}
            lineColors={{ Portfolio: 'hsl(212, 72%, 42%)', Benchmark: 'hsl(215, 15%, 55%)' }}
          />
        </ChartCard>

        {/* iii) Contribution */}
        <ChartCard
          id="ar-3"
          title="Volatility Contribution"
          subtitle={contribView === 'Portfolio' ? 'Active strategies → Portfolio vol' : 'Asset classes → Benchmark vol'}
          toolbar={
            <div className="flex items-center gap-2">
              <ToggleBar options={['Portfolio', 'Benchmark'] as const} value={contribView} onChange={setContribView} size="xs" />
              <TopNSelect value={topN} onChange={setTopN} />
            </div>
          }
        >
          <FinancialBarChart
            data={contribBars.map(b => ({ name: b.name, value: b.contribution }))}
            colorByValue={false}
            barColor="hsl(212, 72%, 42%)"
          />
        </ChartCard>

        {/* iv) Contribution trend - stacked + total line */}
        <ChartCard
          id="ar-4"
          title="Contribution to Volatility — Trend"
          subtitle={`Stacked contributions with ${contribView} total vol overlay`}
        >
          <StackedTimeChart
            data={contribTrend}
            categories={contribBars.map(b => b.name)}
            overlayLine="Total"
          />
        </ChartCard>

        {/* v) Own-based vol */}
        <ChartCard
          id="ar-5"
          title="Own-Based Volatility"
          subtitle={ownView === 'Portfolio' ? 'Active strategies, standalone vol' : 'Asset classes, standalone vol'}
          toolbar={
            <div className="flex items-center gap-2">
              <ToggleBar options={['Portfolio', 'Benchmark'] as const} value={ownView} onChange={setOwnView} size="xs" />
              <TopNSelect value={topN} onChange={setTopN} />
            </div>
          }
        >
          <FinancialBarChart
            data={ownBars.map(b => ({ name: b.name, value: b.vol }))}
            colorByValue={false}
            barColor="hsl(32, 80%, 50%)"
          />
        </ChartCard>

        {/* vi) Own-based trend */}
        <ChartCard
          id="ar-6"
          title="Own-Based Volatility — Trend"
          subtitle={`Per-component standalone vol, ${ownView}`}
        >
          <TrendChart data={ownTrend} lines={ownBars.map(b => b.name)} />
        </ChartCard>
      </div>
    </div>
  );
}

// Creative comparison: side-by-side vertical "vol bars" with delta callout
function VolGaugeCompare({ portfolio, benchmark }: { portfolio: number; benchmark: number }) {
  const max = Math.max(portfolio, benchmark) * 1.25;
  const pPct = (portfolio / max) * 100;
  const bPct = (benchmark / max) * 100;
  const delta = +(portfolio - benchmark).toFixed(2);
  const deltaPositive = delta >= 0;

  return (
    <div className="flex items-end justify-around h-[250px] gap-6 px-4 pb-2 relative">
      {/* Portfolio column */}
      <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[120px]">
        <div className="text-xs font-semibold text-foreground mb-1">{portfolio.toFixed(2)}%</div>
        <div className="w-full bg-muted/40 rounded-md relative" style={{ height: '85%' }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-md transition-all"
            style={{
              height: `${pPct}%`,
              background: 'linear-gradient(180deg, hsl(212, 72%, 52%) 0%, hsl(212, 72%, 35%) 100%)',
            }}
          />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-foreground">Portfolio</div>
      </div>

      {/* Delta badge */}
      <div className="flex flex-col items-center justify-center pb-12">
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-bold border',
          deltaPositive
            ? 'bg-accent/10 text-accent border-accent/30'
            : 'bg-primary/10 text-primary border-primary/30'
        )}>
          {deltaPositive ? '+' : ''}{delta}%
        </div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">Δ vs BM</div>
      </div>

      {/* Benchmark column */}
      <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[120px]">
        <div className="text-xs font-semibold text-foreground mb-1">{benchmark.toFixed(2)}%</div>
        <div className="w-full bg-muted/40 rounded-md relative" style={{ height: '85%' }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-md transition-all"
            style={{
              height: `${bPct}%`,
              background: 'linear-gradient(180deg, hsl(215, 15%, 65%) 0%, hsl(215, 15%, 45%) 100%)',
            }}
          />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Benchmark</div>
      </div>
    </div>
  );
}
