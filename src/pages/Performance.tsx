import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ChartCard from '@/components/shared/ChartCard';
import FilterPill from '@/components/shared/FilterPill';
import ToggleBar from '@/components/shared/ToggleBar';
import TimespanMultiSelect from '@/components/shared/TimespanMultiSelect';
import TopNSelect from '@/components/shared/TopNSelect';
import CompareWaterfallChart from '@/components/charts/CompareWaterfallChart';
import FinancialBarChart from '@/components/charts/FinancialBarChart';
import StackedTimeChart from '@/components/charts/StackedTimeChart';
import TrendChart from '@/components/charts/TrendChart';
import ScatterPlot from '@/components/charts/ScatterChart';
import CompareBarPanel from '@/components/charts/CompareBarPanel';
import {
  perfWaterfallData, activeStrategies, perfTimeSeries, cumulativePerfSeries, contributionTimeSeries,
  equityCountryPerf, equitySectorPerf, fiPerf, commodityPerf, currencyPerf, marketTimeSeries, marketRollingTimeSeries,
  realReturnWaterfall, eltrrorData, inflationByCountry,
  peersData, peerReturnSeries, peerAssetMix, peerCountryMix, timespans, currencies,
  generatePerfTimeSeries, generateCumulativePerfSeries, generateContributionTimeSeries, generateRollingPerfSeries,
} from '@/data/mockData';

const breakdowns = ['Active Strategies', 'Country', 'Sector'] as const;
const returnTypes = ['Portfolio', 'Benchmark', 'Active'] as const;

const subTabsConfig = [
  { key: 'Nominal Return' as const, metric: '+10.5%', label: 'Total Return', subtitle: '1Y USD basis' },
  { key: 'Real Return' as const, metric: '+7.3%', label: 'Real Return', subtitle: 'Inflation adjusted' },
  { key: 'Market Performance' as const, metric: '+6.1%', label: 'MSCI ACWI', subtitle: 'Equity benchmark' },
  
];
const subTabs = subTabsConfig.map(t => t.key);
type SubTab = typeof subTabs[number];
const cumRoll = ['Cumulative', 'Rolling'] as const;

export interface PerfFilters {
  timespans: string[];
  currency: string;
  breakdown: string;
  topN: number;
}

// Helper: get the longest timespan from a list
const timespanOrder = ['1Y', '3Y', '5Y', '10Y', '20Y'];
function longestTimespan(ts: string[]): string {
  return ts.reduce((a, b) => timespanOrder.indexOf(a) >= timespanOrder.indexOf(b) ? a : b, ts[0]);
}

export default function Performance() {
  const [searchParams] = useSearchParams();
  const initialTab = subTabs.find(t => t === searchParams.get('tab')) || 'Nominal Return';
  const [sub, setSub] = useState<SubTab>(initialTab);
  const [filters, setFilters] = useState<PerfFilters>({
    timespans: ['1Y'], currency: 'USD', breakdown: 'Active Strategies', topN: 8,
  });

  const set = (partial: Partial<PerfFilters>) => setFilters(prev => ({ ...prev, ...partial }));
  const isNominal = sub === 'Nominal Return';

  return (
    <div className="p-6 space-y-4">
      {/* Sub-tab cards */}
      <div className="grid grid-cols-3 gap-3">
        {subTabsConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              'rounded-lg border p-4 text-left transition-all',
              sub === t.key ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card hover:bg-muted/50'
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider">{t.key}</p>
            <p className={cn(
              'text-2xl font-bold tracking-tight mt-2',
              sub === t.key ? 'text-primary-foreground' : 'text-accent'
            )}>{t.metric}</p>
            <p className={cn(
              'text-[11px] mt-1',
              sub === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>{t.label} · {t.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Global parameters */}
      <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/30 px-4 py-3 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-muted-foreground/50" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Period</span>
                <p className="text-[9px] text-muted-foreground">Select up to 3 · right charts use longest</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <TimespanMultiSelect selected={filters.timespans} onChange={v => set({ timespans: v })} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-muted-foreground/50" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Currency</span>
                <p className="text-[9px] text-muted-foreground">All charts</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={currencies} value={filters.currency as any} onChange={v => set({ currency: v })} size="xs" />
          </div>
        </div>
      </div>

      {sub === 'Nominal Return' && <PortfolioPerformance filters={filters} />}
      {sub === 'Market Performance' && <MarketPerformance filters={filters} />}
      {sub === 'Real Return' && <RealReturn filters={filters} />}
      
    </div>
  );
}

// ─── Shared helpers ───

function getSourceData(breakdown: string) {
  const countryContrib = [
    { name: 'United States', contribution: 0.32, ownReturn: 12.5, bmkContribution: 0.28, bmkReturn: 10.2 },
    { name: 'Japan', contribution: 0.12, ownReturn: 8.2, bmkContribution: 0.10, bmkReturn: 7.5 },
    { name: 'United Kingdom', contribution: 0.08, ownReturn: 5.8, bmkContribution: 0.07, bmkReturn: 5.1 },
    { name: 'Germany', contribution: 0.06, ownReturn: 6.1, bmkContribution: 0.05, bmkReturn: 5.8 },
    { name: 'China', contribution: 0.15, ownReturn: 9.4, bmkContribution: 0.12, bmkReturn: 8.1 },
    { name: 'France', contribution: 0.05, ownReturn: 4.2, bmkContribution: 0.04, bmkReturn: 3.9 },
    { name: 'Canada', contribution: 0.04, ownReturn: 3.8, bmkContribution: 0.03, bmkReturn: 3.5 },
    { name: 'Australia', contribution: 0.03, ownReturn: 5.1, bmkContribution: 0.02, bmkReturn: 4.8 },
    { name: 'South Korea', contribution: 0.07, ownReturn: 7.6, bmkContribution: 0.06, bmkReturn: 6.9 },
    { name: 'India', contribution: 0.08, ownReturn: 11.2, bmkContribution: 0.05, bmkReturn: 9.8 },
  ];
  const sectorContrib = [
    { name: 'Information Technology', contribution: 0.28, ownReturn: 18.5, bmkContribution: 0.22, bmkReturn: 15.2 },
    { name: 'Healthcare', contribution: 0.10, ownReturn: 8.2, bmkContribution: 0.08, bmkReturn: 7.1 },
    { name: 'Financials', contribution: 0.14, ownReturn: 10.1, bmkContribution: 0.12, bmkReturn: 9.0 },
    { name: 'Consumer Disc.', contribution: 0.06, ownReturn: 5.5, bmkContribution: 0.05, bmkReturn: 4.8 },
    { name: 'Industrials', contribution: 0.08, ownReturn: 7.8, bmkContribution: 0.07, bmkReturn: 7.2 },
    { name: 'Energy', contribution: -0.05, ownReturn: -3.2, bmkContribution: -0.03, bmkReturn: -2.1 },
    { name: 'Materials', contribution: 0.04, ownReturn: 4.1, bmkContribution: 0.03, bmkReturn: 3.5 },
    { name: 'Real Estate', contribution: 0.03, ownReturn: 6.2, bmkContribution: 0.02, bmkReturn: 5.5 },
    { name: 'Utilities', contribution: 0.02, ownReturn: 3.5, bmkContribution: 0.01, bmkReturn: 2.8 },
    { name: 'Comm. Services', contribution: 0.09, ownReturn: 9.8, bmkContribution: 0.07, bmkReturn: 8.5 },
  ];
  const activeStrats = activeStrategies.map(s => ({
    ...s,
    bmkContribution: +(s.contribution * 0.8).toFixed(3),
    bmkReturn: +(s.ownReturn * 0.85).toFixed(1),
  }));
  return breakdown === 'Country' ? countryContrib : breakdown === 'Sector' ? sectorContrib : activeStrats;
}

type SourceItem = { name: string; contribution: number; ownReturn: number; bmkContribution: number; bmkReturn: number };

function buildContribData(sourceData: SourceItem[], topN: number, returnType: string) {
  const stratData = sourceData.slice(0, topN);
  const others = sourceData.slice(topN);

  const getContrib = (s: SourceItem) => {
    if (returnType === 'Benchmark') return s.bmkContribution;
    if (returnType === 'Active') return +(s.contribution - s.bmkContribution).toFixed(3);
    return s.contribution;
  };
  const getReturn = (s: SourceItem) => {
    if (returnType === 'Benchmark') return s.bmkReturn;
    if (returnType === 'Active') return +(s.ownReturn - s.bmkReturn).toFixed(1);
    return s.ownReturn;
  };

  const contribData = [...stratData.map(s => ({ name: s.name, value: getContrib(s) })),
    ...(others.length ? [{ name: 'Others', value: +others.reduce((sum, o) => sum + getContrib(o), 0).toFixed(3) }] : [])];
  const ownData = [...stratData.map(s => ({ name: s.name, value: getReturn(s) })),
    ...(others.length ? [{ name: 'Others', value: +(others.reduce((sum, o) => sum + getReturn(o), 0) / (others.length || 1)).toFixed(1) }] : [])];
  return { stratData, contribData, ownData };
}

// Timespan scale factors for mock variation
const tsScales: Record<string, number> = { '1Y': 1.0, '3Y': 0.75, '5Y': 0.85, '10Y': 0.65, '20Y': 0.55 };

// ─── Sub-tab components ───

function PortfolioPerformance({ filters }: { filters: PerfFilters }) {
  const [target, setTarget] = useState('Total Portfolio');
  const [mode, setMode] = useState('Cumulative');
  const [breakdown, setBreakdown] = useState('Active Strategies');
  const [topN, setTopN] = useState(8);
  const [returnType, setReturnType] = useState<string>('Portfolio');

  const sourceData = getSourceData(breakdown);
  const { stratData, contribData, ownData } = buildContribData(sourceData, topN, returnType);

  const primaryTimespan = longestTimespan(filters.timespans);

  const waterfallDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: perfWaterfallData[ts] || perfWaterfallData['1Y'],
  }));

  // Build multi-timespan datasets for contribution and own-return charts
  const contribDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: contribData.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(2) })),
  }));
  const ownDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: ownData.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(1) })),
  }));

  const isComparing = filters.timespans.length > 1;

  // Timespan-aware time series — use longest timespan for right-side charts
  const tsPerf = generatePerfTimeSeries(primaryTimespan);
  const adjustedStrats = stratData.slice(0, 6).map(s => {
    const contrib = returnType === 'Benchmark' ? s.bmkContribution
      : returnType === 'Active' ? +(s.contribution - s.bmkContribution).toFixed(3)
      : s.contribution;
    const ownRet = returnType === 'Benchmark' ? s.bmkReturn
      : returnType === 'Active' ? +(s.ownReturn - s.bmkReturn).toFixed(1)
      : s.ownReturn;
    return { name: s.name, contribution: contrib, ownReturn: ownRet };
  });
  const tsContrib = generateContributionTimeSeries(primaryTimespan, adjustedStrats);
  const tsCumulative = generateCumulativePerfSeries(primaryTimespan, adjustedStrats.map(s => ({ name: s.name, ownReturn: s.ownReturn })));
  const tsRolling = generateRollingPerfSeries(primaryTimespan, adjustedStrats.map(s => ({ name: s.name, ownReturn: s.ownReturn })));

  // Annual data: each year as a category, each strategy as a bar
  const annualData = useMemo(() => {
    const numYears = primaryTimespan === '1Y' ? 1 : primaryTimespan === '3Y' ? 3 : primaryTimespan === '5Y' ? 5 : primaryTimespan === '10Y' ? 10 : 20;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: numYears }, (_, i) => currentYear - numYears + 1 + i);
    const seed = (y: number, s: number) => { const x = Math.sin(y * 127 + s * 311) * 10000; return x - Math.floor(x); };
    return years.map(year => {
      const row: Record<string, any> = { year: String(year) };
      adjustedStrats.forEach((s, j) => {
        row[s.name] = +(s.ownReturn * (0.6 + seed(year, j) * 0.8)).toFixed(1);
      });
      return row;
    });
  }, [primaryTimespan, adjustedStrats]);

  return (
    <div className="space-y-4">
      {/* Row 1: Top charts — left bordered primary (compare), right bordered accent (breakdown) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-l-2 border-primary/30 pl-3 min-h-[320px]">
          <ChartCard id="perf-1" title="Nominal Return Decomposition" className="h-full" footer={
            <><FilterPill label="Currency" value={filters.currency} variant="currency" /></>
          }>
            {isComparing ? (
              <CompareWaterfallChart datasets={waterfallDatasets} onBarClick={setTarget} colorMap={{
                'Strategic Portfolio': 'hsl(145, 52%, 42%)',
                'MTS': 'hsl(220, 10%, 58%)',
                'Active Strategies': 'hsl(270, 55%, 50%)',
                'Total Portfolio': 'hsl(212, 72%, 42%)',
              }} />
            ) : (
              <CompareWaterfallChart datasets={waterfallDatasets} onBarClick={setTarget} colorMap={{
                'Strategic Portfolio': 'hsl(145, 52%, 42%)',
                'MTS': 'hsl(220, 10%, 58%)',
                'Active Strategies': 'hsl(270, 55%, 50%)',
                'Total Portfolio': 'hsl(212, 72%, 42%)',
              }} />
            )}
          </ChartCard>
        </div>
        <div className="border-l-2 border-primary/30 pl-3 min-h-[320px]">
          <ChartCard id="perf-2" title="Return Attribution (Time Series)" className="h-full" footer={
            <>
              <FilterPill label="Period" value={primaryTimespan} variant="period" />
              <FilterPill label="Currency" value={filters.currency} variant="currency" />
            </>
          }>
            <StackedTimeChart
              data={tsPerf}
              categories={['strategicPortfolio', 'mts', 'activeStrategies']}
              overlayLine="totalPortfolio"
              colorMap={{
                strategicPortfolio: 'hsl(145, 52%, 42%)',
                mts: 'hsl(220, 10%, 58%)',
                activeStrategies: 'hsl(270, 55%, 50%)',
              }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Breakdown filter bar — between row 1 and bottom charts, like Exposure filter */}
      <div className="rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-3 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-accent" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Breakdown</span>
                <p className="text-[9px] text-muted-foreground">Applies to charts below ↓</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={breakdowns} value={breakdown as any} onChange={setBreakdown} size="xs" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Return</span>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={returnTypes} value={returnType as any} onChange={setReturnType} size="xs" />
          </div>
          <div className="flex items-center gap-3">
            <TopNSelect value={topN} onChange={setTopN} />
          </div>
        </div>
      </div>

      {/* Row 2 & 3: Bottom 4 charts — accent border (breakdown + TopN) */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/30 pl-3 ml-1">
        <ChartCard id="perf-3" title={`Contribution to ${target}`} className="min-h-[280px]" footer={
          <>
            <FilterPill label="Currency" value={filters.currency} variant="currency" />
            <FilterPill label="Breakdown" value={breakdown} variant="breakdown" />
            <FilterPill label="Return" value={returnType} variant="breakdown" />
          </>
        }>
          {isComparing ? (
            <CompareBarPanel datasets={contribDatasets} />
          ) : (
            <FinancialBarChart data={contribData} />
          )}
        </ChartCard>
        <ChartCard id="perf-4" title="Contribution (Time Series)" className="min-h-[280px]" footer={
          <>
            <FilterPill label="Period" value={primaryTimespan} variant="period" />
            <FilterPill label="Currency" value={filters.currency} variant="currency" />
            <FilterPill label="Breakdown" value={breakdown} variant="breakdown" />
            <FilterPill label="Return" value={returnType} variant="breakdown" />
          </>
        }>
          <StackedTimeChart
            data={tsContrib}
            categories={stratData.slice(0, 6).map(s => s.name)}
            overlayLine="Total Portfolio"
          />
        </ChartCard>
        <ChartCard id="perf-5" title={`Own-Based Return (${target})`} className="min-h-[280px]" footer={
          <>
            <FilterPill label="Currency" value={filters.currency} variant="currency" />
            <FilterPill label="Breakdown" value={breakdown} variant="breakdown" />
            <FilterPill label="Return" value={returnType} variant="breakdown" />
          </>
        }>
          {isComparing ? (
            <CompareBarPanel datasets={ownDatasets} />
          ) : (
            <FinancialBarChart data={ownData} />
          )}
        </ChartCard>
        <ChartCard id="perf-6" title="Cumulative Strategy Performance" className="min-h-[280px]" footer={
          <>
            <FilterPill label="Period" value={primaryTimespan} variant="period" />
            <FilterPill label="Currency" value={filters.currency} variant="currency" />
            <FilterPill label="Breakdown" value={breakdown} variant="breakdown" />
            <FilterPill label="Return" value={returnType} variant="breakdown" />
          </>
        }>
          <TrendChart data={tsCumulative} lines={stratData.slice(0, 6).map(s => s.name)} />
        </ChartCard>
      </div>
    </div>
  );
}
// ActiveReturn removed — no longer a sub-tab

function MarketPerformance({ filters }: { filters: PerfFilters }) {
  const [eqBd, setEqBd] = useState<string>('Country');
  const [mode, setMode] = useState('Cumulative');

  const primaryTimespan = longestTimespan(filters.timespans);
  const isComparing = filters.timespans.length > 1;
  const compareColors = ['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'];

  const eqData = eqBd === 'Country' ? equityCountryPerf : equitySectorPerf;

  // Per-timespan datasets for left-side bar charts
  const scaleData = (data: { name: string; value: number; isTotal?: boolean }[]) =>
    filters.timespans.map(ts => ({
      label: ts,
      data: data.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(1), ...(d.isTotal ? { isTotal: true } : {}) })),
    }));

  const eqDatasets = scaleData(eqData);
  const fiDatasets = scaleData(fiPerf.map(f => ({ name: f.name, value: f.yield })));
  const comDatasets = scaleData(commodityPerf);
  const curDatasets = scaleData(currencyPerf.map(c => ({ name: c.name, value: c.value })));

  const renderCompareOrSingle = (
    datasets: { label: string; data: { name: string; value: number }[] }[],
    singleContent: React.ReactNode,
  ) => isComparing ? (
    <CompareBarPanel datasets={datasets} />
  ) : singleContent;

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="mkt-1" title="Equity Performance" toolbar={
        <ToggleBar options={['Country', 'Sector'] as const} value={eqBd} onChange={setEqBd} size="xs" />
      } footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {isComparing ? <CompareBarPanel datasets={eqDatasets} preserveOrder /> : <FinancialBarChart data={eqData} preserveOrder />}
      </ChartCard>
      <ChartCard id="mkt-2" title={`Equity ${mode} Performance`} toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      } footer={<><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>}>
        <TrendChart data={(mode === 'Rolling' ? marketRollingTimeSeries : marketTimeSeries)(eqData, primaryTimespan)} lines={eqData.map(d => d.name)} />
      </ChartCard>
      <ChartCard id="mkt-3" title="Fixed Income Performance (BBGA)" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {renderCompareOrSingle(fiDatasets, <FinancialBarChart data={fiPerf.map(f => ({ name: f.name, value: f.yield }))} colorByValue={false} barColor="hsl(185, 58%, 38%)" />)}
      </ChartCard>
      <ChartCard id="mkt-4" title={`Fixed Income ${mode}`} toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      } footer={<><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>}>
        <TrendChart data={(mode === 'Rolling' ? marketRollingTimeSeries : marketTimeSeries)(fiPerf, primaryTimespan)} lines={fiPerf.map(f => f.name)} />
      </ChartCard>
      <ChartCard id="mkt-5" title="Commodities Performance (BCOM)" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {renderCompareOrSingle(comDatasets, <FinancialBarChart data={commodityPerf} />)}
      </ChartCard>
      <ChartCard id="mkt-6" title={`Commodities ${mode}`} toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      } footer={<><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>}>
        <TrendChart data={(mode === 'Rolling' ? marketRollingTimeSeries : marketTimeSeries)(commodityPerf, primaryTimespan)} lines={commodityPerf.map(d => d.name)} />
      </ChartCard>
      <ChartCard id="mkt-7" title="Currency Performance" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {renderCompareOrSingle(curDatasets, <FinancialBarChart data={currencyPerf.map(c => ({ name: c.name, value: c.value }))} />)}
      </ChartCard>
      <ChartCard id="mkt-8" title={`Currency ${mode}`} toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      } footer={<><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>}>
        <TrendChart data={(mode === 'Rolling' ? marketRollingTimeSeries : marketTimeSeries)(currencyPerf, primaryTimespan)} lines={currencyPerf.map(c => c.name)} />
      </ChartCard>
    </div>
  );
}

function RealReturn({ filters }: { filters: PerfFilters }) {
  const primaryTimespan = longestTimespan(filters.timespans);
  const isComparing = filters.timespans.length > 1;

  // Per-timespan waterfall datasets
  const wfDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: realReturnWaterfall[ts as keyof typeof realReturnWaterfall] || realReturnWaterfall['1Y'],
  }));

  // Per-timespan ELTRROR datasets (scale by tsScales)
  const eltrrorDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: eltrrorData.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(1) })),
  }));

  // Per-timespan inflation datasets
  const inflationDatasets = filters.timespans.map(ts => ({
    label: ts,
    data: inflationByCountry.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(1) })),
  }));

  const compareColors = ['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'];

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="rr-1" title="Real Return Decomposition" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {isComparing ? (
          <CompareBarPanel datasets={wfDatasets} preserveOrder />
        ) : (
          <CompareWaterfallChart datasets={wfDatasets} />
        )}
      </ChartCard>
      <ChartCard id="rr-2" title="Cumulative Nominal & Projected Real Return" footer={
        <><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>
      }>
        <TrendChart
          data={generateCumulativePerfSeries(primaryTimespan, activeStrategies.slice(0, 6).map(s => ({ name: s.name, ownReturn: s.ownReturn }))).map((d, i, arr) => ({
            month: d.month as string,
            'Nominal Return': i <= Math.floor(arr.length * 0.7) ? +((i + 1) / arr.length * 8.5).toFixed(2) : null,
            'Projected Real': i >= Math.floor(arr.length * 0.7) ? +((i + 1) / arr.length * 5.5).toFixed(2) : null,
          }))}
          lines={['Nominal Return', 'Projected Real']}
          lineColors={{ 'Projected Real': 'hsl(0, 72%, 51%)' }}
          connectNulls={false}
        />
      </ChartCard>
      <ChartCard id="rr-3" title="Expected Long-Term Rate of Return (ELTRROR)" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {isComparing ? (
          <CompareBarPanel datasets={eltrrorDatasets} />
        ) : (
          <FinancialBarChart data={eltrrorData} colorByValue={false} barColor="hsl(145, 52%, 42%)" />
        )}
      </ChartCard>
      <ChartCard id="rr-4" title="ELTRROR Cone Charts" footer={
        <><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>
      }>
        <div className="grid grid-cols-3 grid-rows-2 gap-2 h-full">
          {eltrrorData.map(ac => (
            <div key={ac.name} className="rounded-md border bg-muted/20 p-2 flex flex-col items-center justify-center">
              <p className="text-[9px] font-medium text-muted-foreground mb-1">{ac.name}</p>
              <div className="w-full h-12 relative">
                <svg viewBox="0 0 100 40" className="w-full h-full">
                  <polygon points="10,35 50,5 90,35" fill="hsl(145, 52%, 42%)" opacity="0.15" />
                  <polyline points="10,30 30,22 50,15 70,12 90,10" fill="none" stroke="hsl(145, 52%, 42%)" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-[10px] font-bold">{ac.value}%</p>
            </div>
          ))}
        </div>
      </ChartCard>
      <ChartCard id="rr-5" title="Inflation by Country" footer={<FilterPill label="Currency" value={filters.currency} variant="currency" />}>
        {isComparing ? (
          <CompareBarPanel datasets={inflationDatasets} />
        ) : (
          <FinancialBarChart data={inflationByCountry} colorByValue={false} barColor="hsl(38, 90%, 50%)" />
        )}
      </ChartCard>
      <ChartCard id="rr-6" title="Cumulative Inflation by Country" footer={
        <><FilterPill label="Period" value={primaryTimespan} variant="period" /><FilterPill label="Currency" value={filters.currency} variant="currency" /></>
      }>
        <StackedTimeChart
          data={marketTimeSeries(inflationByCountry, primaryTimespan)}
          categories={inflationByCountry.map(c => c.name)}
        />
      </ChartCard>
    </div>
  );
}

function PeersComparison({ filters }: { filters: PerfFilters }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="peer-1" title="Peer Performance Metrics">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 px-2 font-medium">Fund</th>
                <th className="text-right py-1.5 px-2 font-medium">Return</th>
                <th className="text-right py-1.5 px-2 font-medium">Volatility</th>
                <th className="text-right py-1.5 px-2 font-medium">Sharpe</th>
                <th className="text-right py-1.5 px-2 font-medium">IR</th>
              </tr>
            </thead>
            <tbody>
              {peersData.map(p => (
                <tr key={p.name} className={cn('border-b border-border/50', p.name === 'Our Portfolio' && 'bg-accent/10 font-semibold')}>
                  <td className="py-1.5 px-2">{p.name}</td>
                  <td className="py-1.5 px-2 text-right">{p.returns}%</td>
                  <td className="py-1.5 px-2 text-right">{p.volatility}%</td>
                  <td className="py-1.5 px-2 text-right">{p.sharpe}</td>
                  <td className="py-1.5 px-2 text-right">{p.ir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
      <ChartCard id="peer-2" title="Cumulative Returns">
        <TrendChart data={marketTimeSeries(peersData.map(p => ({ name: p.name })), longestTimespan(filters.timespans))} lines={peersData.map(p => p.name)} />
      </ChartCard>
      <ChartCard id="peer-3" title="Asset Mix Comparison">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 px-2 font-medium">Fund</th>
                <th className="text-right py-1.5 px-2 font-medium">EQ</th>
                <th className="text-right py-1.5 px-2 font-medium">FI</th>
                <th className="text-right py-1.5 px-2 font-medium">RE</th>
                <th className="text-right py-1.5 px-2 font-medium">Infra</th>
                <th className="text-right py-1.5 px-2 font-medium">PE</th>
                <th className="text-right py-1.5 px-2 font-medium">Other</th>
              </tr>
            </thead>
            <tbody>
              {peerAssetMix.map(p => (
                <tr key={p.peer} className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-medium">{p.peer}</td>
                  <td className="py-1.5 px-2 text-right">{p.equities}%</td>
                  <td className="py-1.5 px-2 text-right">{p.fi}%</td>
                  <td className="py-1.5 px-2 text-right">{p.re}%</td>
                  <td className="py-1.5 px-2 text-right">{p.infra}%</td>
                  <td className="py-1.5 px-2 text-right">{p.pe}%</td>
                  <td className="py-1.5 px-2 text-right">{p.other}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
      <ChartCard id="peer-4" title="Country Mix Comparison">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 px-2 font-medium">Fund</th>
                <th className="text-right py-1.5 px-2 font-medium">US</th>
                <th className="text-right py-1.5 px-2 font-medium">Europe</th>
                <th className="text-right py-1.5 px-2 font-medium">Asia</th>
                <th className="text-right py-1.5 px-2 font-medium">Other</th>
              </tr>
            </thead>
            <tbody>
              {peerCountryMix.map(p => (
                <tr key={p.peer} className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-medium">{p.peer}</td>
                  <td className="py-1.5 px-2 text-right">{p.us}%</td>
                  <td className="py-1.5 px-2 text-right">{p.europe}%</td>
                  <td className="py-1.5 px-2 text-right">{p.asia}%</td>
                  <td className="py-1.5 px-2 text-right">{p.other}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
      <ChartCard id="peer-5" title="Return vs Volatility">
        <ScatterPlot
          data={peersData.map(p => ({ name: p.name, x: p.volatility, y: p.returns }))}
          xLabel="Volatility (%)"
          yLabel="Returns (%)"
        />
      </ChartCard>
      <ChartCard id="peer-6" title="Return vs EQ Beta">
        <ScatterPlot
          data={peersData.map(p => ({ name: p.name, x: p.eqBeta, y: p.returns }))}
          xLabel="EQ Beta"
          yLabel="Returns (%)"
        />
      </ChartCard>
    </div>
  );
}

// ─── Annual Cluster Bar Chart ───
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';

const ANNUAL_COLORS = [
  'hsl(212, 72%, 55%)', 'hsl(32, 80%, 55%)', 'hsl(145, 52%, 48%)',
  'hsl(0, 62%, 55%)', 'hsl(270, 50%, 55%)', 'hsl(185, 58%, 45%)',
];

function AnnualClusterChart({ data, strategies }: { data: Record<string, any>[]; strategies: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barCategoryGap="18%">
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: 11,
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
          }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, undefined]}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {strategies.map((name, i) => (
          <Bar key={name} dataKey={name} fill={ANNUAL_COLORS[i % ANNUAL_COLORS.length]} radius={[2, 2, 0, 0]}>
            <LabelList dataKey={name} position="top" fontSize={9} fill="hsl(var(--muted-foreground))" formatter={(v: number) => `${v.toFixed(1)}%`} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
