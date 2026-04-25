import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ChartCard from '@/components/shared/ChartCard';
import FilterPill from '@/components/shared/FilterPill';
import ToggleBar from '@/components/shared/ToggleBar';
import TopNSelect from '@/components/shared/TopNSelect';
import FinancialBarChart from '@/components/charts/FinancialBarChart';
import StackedTimeChart from '@/components/charts/StackedTimeChart';
import TrendChart from '@/components/charts/TrendChart';
import {
  riskContribution, assetClassExposureData, getTimeLabels,
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

const periodToggles = ['1Y', '5Y', '10Y'] as const;
const periodDescriptions: Record<string, string> = { '1Y': 'Monthly', '5Y': 'Quarterly', '10Y': 'Yearly' };

function AbsoluteRiskSection() {
  const [contribView, setContribView] = useState<View>('Portfolio');
  const [ownView, setOwnView] = useState<View>('Portfolio');
  const [topN, setTopN] = useState(5);
  const [period, setPeriod] = useState<string>('1Y');

  const portfolioVol = 11.5;
  const benchmarkVol = 10.2;

  // Period labels: 1Y monthly, 5Y quarterly, 10Y yearly (matches Exposure)
  const xKey = 'label';
  const labels = useMemo(() => {
    if (period === '1Y') return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (period === '5Y') return ['Q1 22','Q2 22','Q3 22','Q4 22','Q1 23','Q2 23','Q3 23','Q4 23','Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26','Q3 26','Q4 26'];
    return ['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];
  }, [period]);

  // Source list, sorted desc, with Top N + Others
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

  // Trend: vol comparison (Portfolio vs Benchmark)
  const volTrend = useMemo(() => labels.map((m, i) => ({
    [xKey]: m,
    Portfolio: +(portfolioVol + Math.sin(i / 2) * 0.6 + ((i * 13) % 7) / 50).toFixed(2),
    Benchmark: +(benchmarkVol + Math.sin(i / 2.5) * 0.5 + ((i * 7) % 5) / 50).toFixed(2),
  })), [labels]);

  // Stacked contribution-over-time trend (chart iv)
  const contribTrend = useMemo(() => {
    const totalLine = contribView === 'Portfolio' ? portfolioVol : benchmarkVol;
    return labels.map((m, i) => {
      const row: Record<string, string | number> = { [xKey]: m };
      contribBars.forEach((b, j) => {
        const wobble = 1 + Math.sin((i + j) / 2) * 0.15;
        row[b.name] = +(b.contribution * wobble).toFixed(2);
      });
      row['Total'] = +(totalLine + Math.sin(i / 2) * 0.5).toFixed(2);
      return row;
    });
  }, [contribBars, contribView, labels]);

  // Own-based trend (chart vi)
  const ownTrend = useMemo(() => labels.map((m, i) => {
    const row: Record<string, string | number> = { [xKey]: m };
    ownBars.forEach((b, j) => {
      row[b.name] = +(b.vol + Math.sin((i + j * 1.3) / 2) * 0.4).toFixed(2);
    });
    return row;
  }), [ownBars, labels]);

  return (
    <div className="space-y-4">
      {/* Period control — muted, scoped to right-column trend charts (mirrors Exposure) */}
      <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/30 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-8 rounded-full bg-muted-foreground/50" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Period</span>
              <p className="text-[9px] text-muted-foreground">Trend charts only (right column) →</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />
          <ToggleBar options={periodToggles} value={period} onChange={setPeriod} size="sm" />
          <span className="text-[9px] text-muted-foreground font-medium">({periodDescriptions[period]})</span>
        </div>
      </div>

      {/* Row 1: Vol comparison + trend */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          id="ar-1"
          title="Ex-Ante Volatility: Portfolio vs Benchmark"
          subtitle="Annualised, current snapshot"
        >
          <VolGaugeCompare portfolio={portfolioVol} benchmark={benchmarkVol} />
        </ChartCard>
        <div className="border-l-2 border-muted-foreground/30 pl-3">
          <ChartCard
            id="ar-2"
            title="Ex-Ante Volatility Trend"
            subtitle="Portfolio vs Benchmark"
            footer={<FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />}
          >
            <TrendChart
              data={volTrend}
              xKey={xKey}
              lines={['Portfolio', 'Benchmark']}
              lineColors={{ Portfolio: 'hsl(212, 72%, 42%)', Benchmark: 'hsl(215, 15%, 55%)' }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Breakdown filter bar — accent, scoped to rows 2 & 3 (mirrors Performance) */}
      <div className="rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-3 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-accent" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">View</span>
                <p className="text-[9px] text-muted-foreground">Applies to rows 2 &amp; 3 below ↓</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar
              options={['Portfolio', 'Benchmark'] as const}
              value={contribView}
              onChange={(v) => { setContribView(v); setOwnView(v); }}
              size="sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <TopNSelect value={topN} onChange={setTopN} />
          </div>
        </div>
      </div>

      {/* Rows 2 & 3: bordered accent (controls applied) + muted on right column trends */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/30 pl-3 ml-1">
        {/* iii) Contribution */}
        <ChartCard
          id="ar-3"
          title="Volatility Contribution"
          subtitle={contribView === 'Portfolio' ? 'Active strategies → Portfolio vol' : 'Asset classes → Benchmark vol'}
          footer={
            <>
              <FilterPill label="View" value={contribView} variant="breakdown" />
              <FilterPill label="Top" value={String(topN)} variant="breakdown" />
            </>
          }
        >
          <FinancialBarChart
            data={contribBars.map(b => ({ name: b.name, value: b.contribution }))}
            colorByValue={false}
            barColor="hsl(212, 72%, 42%)"
          />
        </ChartCard>

        {/* iv) Contribution trend */}
        <div className="border-l-2 border-muted-foreground/30 pl-3 -ml-3">
          <ChartCard
            id="ar-4"
            title="Contribution to Volatility — Trend"
            subtitle="Stacked contributions with total vol overlay"
            footer={
              <>
                <FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />
                <FilterPill label="View" value={contribView} variant="breakdown" />
                <FilterPill label="Top" value={String(topN)} variant="breakdown" />
              </>
            }
          >
            <StackedTimeChart
              data={contribTrend}
              categories={contribBars.map(b => b.name)}
              overlayLine="Total"
              xKey={xKey}
            />
          </ChartCard>
        </div>

        {/* v) Own-based vol */}
        <ChartCard
          id="ar-5"
          title="Own-Based Volatility"
          subtitle={ownView === 'Portfolio' ? 'Active strategies, standalone vol' : 'Asset classes, standalone vol'}
          footer={
            <>
              <FilterPill label="View" value={ownView} variant="breakdown" />
              <FilterPill label="Top" value={String(topN)} variant="breakdown" />
            </>
          }
        >
          <FinancialBarChart
            data={ownBars.map(b => ({ name: b.name, value: b.vol }))}
            colorByValue={false}
            barColor="hsl(32, 80%, 50%)"
          />
        </ChartCard>

        {/* vi) Own-based trend */}
        <div className="border-l-2 border-muted-foreground/30 pl-3 -ml-3">
          <ChartCard
            id="ar-6"
            title="Own-Based Volatility — Trend"
            subtitle="Per-component standalone vol"
            footer={
              <>
                <FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />
                <FilterPill label="View" value={ownView} variant="breakdown" />
                <FilterPill label="Top" value={String(topN)} variant="breakdown" />
              </>
            }
          >
            <TrendChart data={ownTrend} lines={ownBars.map(b => b.name)} xKey={xKey} />
          </ChartCard>
        </div>
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
