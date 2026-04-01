import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ChartCard from '@/components/shared/ChartCard';
import ToggleBar from '@/components/shared/ToggleBar';
import TimespanMultiSelect from '@/components/shared/TimespanMultiSelect';
import TopNSelect from '@/components/shared/TopNSelect';
import CompareWaterfallChart from '@/components/charts/CompareWaterfallChart';
import FinancialBarChart from '@/components/charts/FinancialBarChart';
import StackedTimeChart from '@/components/charts/StackedTimeChart';
import TrendChart from '@/components/charts/TrendChart';
import ScatterPlot from '@/components/charts/ScatterChart';
import {
  perfWaterfallData, activeStrategies, perfTimeSeries, cumulativePerfSeries, contributionTimeSeries,
  equityCountryPerf, equitySectorPerf, fiPerf, commodityPerf, currencyPerf, marketTimeSeries,
  realReturnWaterfall, eltrrorData, inflationByCountry,
  peersData, peerReturnSeries, peerAssetMix, peerCountryMix, timespans, currencies,
} from '@/data/mockData';

const breakdowns = ['Active Strategies', 'Country', 'Sector'] as const;

const subTabsConfig = [
  { key: 'Nominal Return' as const, metric: '+10.5%', label: 'Total Return', subtitle: '1Y USD basis' },
  { key: 'Real Return' as const, metric: '+7.3%', label: 'Real Return', subtitle: 'Inflation adjusted' },
  { key: 'Market Performance' as const, metric: '+6.1%', label: 'MSCI ACWI', subtitle: 'Equity benchmark' },
  { key: 'Comparison' as const, metric: 'P75', label: 'Peer Ranking', subtitle: '75th percentile' },
];
const subTabs = subTabsConfig.map(t => t.key);
type SubTab = typeof subTabs[number];
const cumRoll = ['Cumulative', 'Rolling'] as const;

export interface PerfFilters {
  timespan: string;
  currency: string;
  breakdown: string;
  topN: number;
  compareTimespans: string[];
}

export default function Performance() {
  const [searchParams] = useSearchParams();
  const initialTab = subTabs.find(t => t === searchParams.get('tab')) || 'Nominal Return';
  const [sub, setSub] = useState<SubTab>(initialTab);
  const [filters, setFilters] = useState<PerfFilters>({
    timespan: '1Y', currency: 'USD', breakdown: 'Active Strategies', topN: 8,
    compareTimespans: ['1Y'],
  });

  const set = (partial: Partial<PerfFilters>) => setFilters(prev => ({ ...prev, ...partial }));
  const isNominal = sub === 'Nominal Return';

  return (
    <div className="p-6 space-y-4">
      {/* Sub-tab cards */}
      <div className="grid grid-cols-4 gap-3">
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
                <p className="text-[9px] text-muted-foreground">All charts</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={timespans} value={filters.timespan as any} onChange={v => set({ timespan: v })} size="xs" />
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

        {/* Row 2: Compare + Breakdown (Nominal Return only) */}
        {isNominal && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-1 h-8 rounded-full bg-primary" />
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Compare</span>
                  <p className="text-[9px] text-muted-foreground">Left charts only ←</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border shrink-0" />
              <TimespanMultiSelect selected={filters.compareTimespans} onChange={v => set({ compareTimespans: v })} />
            </div>
          </div>
        )}

      </div>

      {/* Tab content */}
      {sub === 'Nominal Return' && <PortfolioPerformance filters={filters} />}
      {sub === 'Market Performance' && <MarketPerformance filters={filters} />}
      {sub === 'Real Return' && <RealReturn filters={filters} />}
      {sub === 'Comparison' && <PeersComparison filters={filters} />}
    </div>
  );
}

// ─── Shared helpers ───

function getSourceData(breakdown: string) {
  const countryContrib = [
    { name: 'United States', contribution: 0.32, ownReturn: 12.5 },
    { name: 'Japan', contribution: 0.12, ownReturn: 8.2 },
    { name: 'United Kingdom', contribution: 0.08, ownReturn: 5.8 },
    { name: 'Germany', contribution: 0.06, ownReturn: 6.1 },
    { name: 'China', contribution: 0.15, ownReturn: 9.4 },
    { name: 'France', contribution: 0.05, ownReturn: 4.2 },
    { name: 'Canada', contribution: 0.04, ownReturn: 3.8 },
    { name: 'Australia', contribution: 0.03, ownReturn: 5.1 },
    { name: 'South Korea', contribution: 0.07, ownReturn: 7.6 },
    { name: 'India', contribution: 0.08, ownReturn: 11.2 },
  ];
  const sectorContrib = [
    { name: 'Information Technology', contribution: 0.28, ownReturn: 18.5 },
    { name: 'Healthcare', contribution: 0.10, ownReturn: 8.2 },
    { name: 'Financials', contribution: 0.14, ownReturn: 10.1 },
    { name: 'Consumer Disc.', contribution: 0.06, ownReturn: 5.5 },
    { name: 'Industrials', contribution: 0.08, ownReturn: 7.8 },
    { name: 'Energy', contribution: -0.05, ownReturn: -3.2 },
    { name: 'Materials', contribution: 0.04, ownReturn: 4.1 },
    { name: 'Real Estate', contribution: 0.03, ownReturn: 6.2 },
    { name: 'Utilities', contribution: 0.02, ownReturn: 3.5 },
    { name: 'Comm. Services', contribution: 0.09, ownReturn: 9.8 },
  ];
  return breakdown === 'Country' ? countryContrib : breakdown === 'Sector' ? sectorContrib : activeStrategies;
}

function buildContribData(sourceData: { name: string; contribution: number; ownReturn: number }[], topN: number) {
  const stratData = sourceData.slice(0, topN);
  const others = sourceData.slice(topN);
  const contribData = [...stratData.map(s => ({ name: s.name, value: s.contribution })),
    ...(others.length ? [{ name: 'Others', value: others.reduce((s, o) => s + o.contribution, 0) }] : [])];
  const ownData = [...stratData.map(s => ({ name: s.name, value: s.ownReturn })),
    ...(others.length ? [{ name: 'Others', value: others.reduce((s, o) => s + o.ownReturn, 0) / (others.length || 1) }] : [])];
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

  const sourceData = getSourceData(breakdown);
  const { stratData, contribData, ownData } = buildContribData(sourceData, topN);

  const waterfallDatasets = filters.compareTimespans.map(ts => ({
    label: ts,
    data: perfWaterfallData[ts] || perfWaterfallData['1Y'],
  }));

  // Build multi-timespan datasets for contribution and own-return charts
  const contribDatasets = filters.compareTimespans.map(ts => ({
    label: ts,
    data: contribData.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(2) })),
  }));
  const ownDatasets = filters.compareTimespans.map(ts => ({
    label: ts,
    data: ownData.map(d => ({ name: d.name, value: +(d.value * (tsScales[ts] || 1)).toFixed(1) })),
  }));

  const isComparing = filters.compareTimespans.length > 1;

  return (
    <div className="space-y-4">
      {/* Row 1: Top charts — left bordered primary (compare), right bordered accent (breakdown) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-l-2 border-primary/30 pl-3 min-h-[320px]">
          <ChartCard id="perf-1" title="Return Attribution (Waterfall)" className="h-full">
            <CompareWaterfallChart datasets={waterfallDatasets} onBarClick={setTarget} />
          </ChartCard>
        </div>
        <div className="border-l-2 border-primary/30 pl-3 min-h-[320px]">
          <ChartCard id="perf-2" title="Return Attribution (Time Series)" className="h-full">
            <StackedTimeChart
              data={perfTimeSeries}
              categories={['strategicPortfolio', 'mts', 'activeStrategies', 'inflation']}
              overlayLine="realReturn"
              negativeCategories={['inflation']}
            />
          </ChartCard>
        </div>
      </div>

      {/* Breakdown filter bar — between row 1 and bottom charts, like Exposure filter */}
      <div className="rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-8 rounded-full bg-accent" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Breakdown</span>
              <p className="text-[9px] text-muted-foreground">Applies to charts below ↓</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />
          <ToggleBar options={breakdowns} value={breakdown as any} onChange={setBreakdown} size="xs" />
          <div className="h-8 w-px bg-border shrink-0" />
          <TopNSelect value={topN} onChange={setTopN} />
        </div>
      </div>

      {/* Row 2 & 3: Bottom 4 charts — accent border (breakdown + TopN) */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/30 pl-3 ml-1">
        <ChartCard id="perf-3" title={`Contribution to ${target}`} className="min-h-[280px]">
          {isComparing ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${contribDatasets.length}, 1fr)` }}>
              {contribDatasets.map((ds, i) => (
                <div key={ds.label} className="flex flex-col">
                  <span className="text-[10px] font-semibold text-center mb-1" style={{ color: ['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'][i] }}>{ds.label}</span>
                  <div className="min-h-[220px]">
                    <FinancialBarChart data={ds.data} barColor={['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'][i]} colorByValue={false} height={220} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <FinancialBarChart data={contribData} />
          )}
        </ChartCard>
        <ChartCard id="perf-4" title="Contribution (Time Series)" className="min-h-[280px]">
          <StackedTimeChart
            data={contributionTimeSeries}
            categories={stratData.slice(0, 6).map(s => s.name)}
            overlayLine="Total Portfolio"
          />
        </ChartCard>
        <ChartCard id="perf-5" title={`Own-Based Return (${target})`} className="min-h-[280px]">
          {isComparing ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${ownDatasets.length}, 1fr)` }}>
              {ownDatasets.map((ds, i) => (
                <div key={ds.label} className="flex flex-col">
                  <span className="text-[10px] font-semibold text-center mb-1" style={{ color: ['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'][i] }}>{ds.label}</span>
                  <div className="min-h-[220px]">
                    <FinancialBarChart data={ds.data} barColor={['hsl(212,72%,42%)', 'hsl(185,58%,38%)', 'hsl(38,90%,50%)'][i]} colorByValue={false} height={220} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <FinancialBarChart data={ownData} />
          )}
        </ChartCard>
        <ChartCard id="perf-6" title="Cumulative Strategy Performance" className="min-h-[280px]" toolbar={
          <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
        }>
          <TrendChart data={cumulativePerfSeries} lines={activeStrategies.slice(0, 6).map(s => s.name)} />
        </ChartCard>
      </div>
    </div>
  );
}
// ActiveReturn removed — no longer a sub-tab

function MarketPerformance({ filters }: { filters: PerfFilters }) {
  const [eqBd, setEqBd] = useState<string>('Country');
  const [mode, setMode] = useState('Cumulative');

  const eqData = eqBd === 'Country' ? equityCountryPerf : equitySectorPerf;

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="mkt-1" title="Equity Performance (MSCI ACWI)" toolbar={
        <ToggleBar options={['Country', 'Sector'] as const} value={eqBd} onChange={setEqBd} size="xs" />
      }>
        <FinancialBarChart data={eqData} />
      </ChartCard>
      <ChartCard id="mkt-2" title="Equity Cumulative Performance" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={marketTimeSeries(eqData)} lines={eqData.map(d => d.name)} />
      </ChartCard>
      <ChartCard id="mkt-3" title="Fixed Income Performance (BBGA)">
        <FinancialBarChart data={fiPerf.map(f => ({ name: f.name, value: f.yield }))} colorByValue={false} barColor="hsl(185, 58%, 38%)" />
      </ChartCard>
      <ChartCard id="mkt-4" title="Fixed Income Cumulative" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={marketTimeSeries(fiPerf)} lines={fiPerf.map(f => f.name)} />
      </ChartCard>
      <ChartCard id="mkt-5" title="Commodities Performance (BCOM)">
        <FinancialBarChart data={commodityPerf} />
      </ChartCard>
      <ChartCard id="mkt-6" title="Commodities Cumulative" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={marketTimeSeries(commodityPerf)} lines={commodityPerf.map(d => d.name)} />
      </ChartCard>
      <ChartCard id="mkt-7" title="Currency Performance">
        <FinancialBarChart data={currencyPerf.map(c => ({ name: c.name, value: c.value }))} />
      </ChartCard>
      <ChartCard id="mkt-8" title="Currency Cumulative" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={marketTimeSeries(currencyPerf)} lines={currencyPerf.map(c => c.name)} />
      </ChartCard>
    </div>
  );
}

function RealReturn({ filters }: { filters: PerfFilters }) {
  const wfData = realReturnWaterfall[filters.timespan as keyof typeof realReturnWaterfall] || realReturnWaterfall['1Y'];

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="rr-1" title="Real Return Decomposition">
        <CompareWaterfallChart datasets={[{ label: filters.timespan, data: wfData }]} />
      </ChartCard>
      <ChartCard id="rr-2" title="Cumulative Nominal & Projected Real Return">
        <TrendChart
          data={cumulativePerfSeries.map((d, i) => ({
            month: d.month,
            'Nominal Return': i <= 8 ? +((i + 1) * 0.85).toFixed(2) : null,
            'Projected Real': i >= 8 ? +((i + 1) * 0.55).toFixed(2) : null,
          }))}
          lines={['Nominal Return', 'Projected Real']}
          lineColors={{ 'Projected Real': 'hsl(0, 72%, 51%)' }}
          connectNulls={false}
        />
      </ChartCard>
      <ChartCard id="rr-3" title="Expected Long-Term Rate of Return (ELTRROR)">
        <FinancialBarChart data={eltrrorData} colorByValue={false} barColor="hsl(145, 52%, 42%)" />
      </ChartCard>
      <ChartCard id="rr-4" title="ELTRROR Cone Charts">
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
      <ChartCard id="rr-5" title="Inflation by Country">
        <FinancialBarChart data={inflationByCountry} colorByValue={false} barColor="hsl(38, 90%, 50%)" />
      </ChartCard>
      <ChartCard id="rr-6" title="Cumulative Inflation by Country">
        <StackedTimeChart
          data={marketTimeSeries(inflationByCountry)}
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
        <TrendChart data={peerReturnSeries} lines={peersData.map(p => p.name)} />
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
