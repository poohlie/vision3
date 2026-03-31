import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ChartCard from '@/components/shared/ChartCard';
import ToggleBar from '@/components/shared/ToggleBar';
import GlobalFilterStrip, { type GlobalFilters } from '@/components/shared/GlobalFilterStrip';
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

const subTabsConfig = [
  { key: 'Nominal Return' as const, metric: '+10.5%', label: 'Total Return', subtitle: '1Y USD basis' },
  { key: 'Real Return' as const, metric: '+7.3%', label: 'Real Return', subtitle: 'Inflation adjusted' },
  { key: 'Market Performance' as const, metric: '+6.1%', label: 'MSCI ACWI', subtitle: 'Equity benchmark' },
  { key: 'Comparison' as const, metric: 'P75', label: 'Peer Ranking', subtitle: '75th percentile' },
];
const subTabs = subTabsConfig.map(t => t.key);
type SubTab = typeof subTabs[number];
const cumRoll = ['Cumulative', 'Rolling'] as const;

export default function Performance() {
  const [searchParams] = useSearchParams();
  const initialTab = subTabs.find(t => t === searchParams.get('tab')) || 'Absolute Return';
  const [sub, setSub] = useState<SubTab>(initialTab);
  const [filters, setFilters] = useState<GlobalFilters>({
    timespan: '1Y', currency: 'USD', breakdown: 'Active Strategies', topN: 8,
  });

  const showBreakdown = sub === 'Absolute Return' || sub === 'Active Return';
  const showTopN = showBreakdown;

  return (
    <div className="p-6 space-y-4">
      {/* Sub-tab cards */}
      <div className="grid grid-cols-5 gap-3">
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

      {/* Global filter strip */}
      <GlobalFilterStrip
        filters={filters}
        onChange={setFilters}
        showBreakdown={showBreakdown}
        showTopN={showTopN}
      />

      {/* Tab content */}
      {sub === 'Absolute Return' && <PortfolioPerformance filters={filters} />}
      {sub === 'Active Return' && <ActiveReturn filters={filters} />}
      {sub === 'Market Performance' && <MarketPerformance filters={filters} />}
      {sub === 'Real Return' && <RealReturn filters={filters} />}
      {sub === 'Peers Comparison' && <PeersComparison filters={filters} />}
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

// ─── Sub-tab components ───

function PortfolioPerformance({ filters }: { filters: GlobalFilters }) {
  const [compareTimespans, setCompareTimespans] = useState<string[]>([filters.timespan]);
  const [target, setTarget] = useState('Total Portfolio');
  const [mode, setMode] = useState('Cumulative');

  const sourceData = getSourceData(filters.breakdown);
  const { stratData, contribData, ownData } = buildContribData(sourceData, filters.topN);

  const waterfallDatasets = compareTimespans.map(ts => ({
    label: ts,
    data: perfWaterfallData[ts] || perfWaterfallData['1Y'],
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="perf-1" title="Return Attribution (Waterfall)" toolbar={
        <TimespanMultiSelect selected={compareTimespans} onChange={setCompareTimespans} />
      }>
        <CompareWaterfallChart datasets={waterfallDatasets} onBarClick={setTarget} />
      </ChartCard>
      <ChartCard id="perf-2" title="Return Attribution (Time Series)">
        <StackedTimeChart
          data={perfTimeSeries}
          categories={['strategicPortfolio', 'mts', 'activeStrategies', 'inflation']}
          overlayLine="realReturn"
          negativeCategories={['inflation']}
        />
      </ChartCard>
      <ChartCard id="perf-3" title={`Contribution to ${target}`}>
        <FinancialBarChart data={contribData} />
      </ChartCard>
      <ChartCard id="perf-4" title="Contribution (Time Series)">
        <StackedTimeChart
          data={contributionTimeSeries}
          categories={stratData.slice(0, 6).map(s => s.name)}
          overlayLine="Total Portfolio"
        />
      </ChartCard>
      <ChartCard id="perf-5" title={`Own-Based Return (${target})`}>
        <FinancialBarChart data={ownData} />
      </ChartCard>
      <ChartCard id="perf-6" title="Cumulative Strategy Performance" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={cumulativePerfSeries} lines={activeStrategies.slice(0, 6).map(s => s.name)} />
      </ChartCard>
    </div>
  );
}

function ActiveReturn({ filters }: { filters: GlobalFilters }) {
  const [compareTimespans, setCompareTimespans] = useState<string[]>([filters.timespan]);
  const [target, setTarget] = useState('Active Return');
  const [mode, setMode] = useState('Cumulative');

  const sourceData = getSourceData(filters.breakdown).map(s => ({
    ...s, contribution: +(s.contribution * 0.4).toFixed(3), ownReturn: +(s.ownReturn * 0.35).toFixed(1)
  }));
  const { stratData, contribData, ownData } = buildContribData(sourceData, filters.topN);

  const waterfallDatasets = compareTimespans.map(ts => ({
    label: ts,
    data: (perfWaterfallData[ts] || perfWaterfallData['1Y']).map(d => ({
      ...d, value: +(d.value * 0.42).toFixed(1)
    })),
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="act-1" title="Active Return Attribution (Waterfall)" toolbar={
        <TimespanMultiSelect selected={compareTimespans} onChange={setCompareTimespans} />
      }>
        <CompareWaterfallChart datasets={waterfallDatasets} onBarClick={setTarget} />
      </ChartCard>
      <ChartCard id="act-2" title="Active Return Attribution (Time Series)">
        <StackedTimeChart
          data={perfTimeSeries.map(d => ({
            month: d.month,
            strategicPortfolio: +(d.strategicPortfolio * 0.4).toFixed(2),
            mts: +(d.mts * 0.4).toFixed(2),
            activeStrategies: +(d.activeStrategies * 0.4).toFixed(2),
            inflation: +(d.inflation * 0.3).toFixed(2),
            realReturn: +(d.realReturn * 0.4).toFixed(2),
          }))}
          categories={['strategicPortfolio', 'mts', 'activeStrategies']}
          overlayLine="realReturn"
        />
      </ChartCard>
      <ChartCard id="act-3" title={`Contribution to ${target}`}>
        <FinancialBarChart data={contribData} />
      </ChartCard>
      <ChartCard id="act-4" title="Active Contribution (Time Series)">
        <StackedTimeChart
          data={contributionTimeSeries.map(d => {
            const out: any = { month: d.month };
            Object.keys(d).filter(k => k !== 'month').forEach(k => { out[k] = +((d as any)[k] * 0.4).toFixed(2); });
            return out;
          })}
          categories={stratData.slice(0, 6).map(s => s.name)}
          overlayLine="Total Portfolio"
        />
      </ChartCard>
      <ChartCard id="act-5" title={`Own-Based Active Return (${target})`}>
        <FinancialBarChart data={ownData} />
      </ChartCard>
      <ChartCard id="act-6" title="Cumulative Active Strategy Performance" toolbar={
        <ToggleBar options={cumRoll} value={mode as any} onChange={setMode} size="xs" />
      }>
        <TrendChart data={cumulativePerfSeries.map(d => {
          const out: any = { month: d.month };
          Object.keys(d).filter(k => k !== 'month').forEach(k => { out[k] = +((d as any)[k] * 0.4).toFixed(2); });
          return out;
        })} lines={activeStrategies.slice(0, 6).map(s => s.name)} />
      </ChartCard>
    </div>
  );
}

function MarketPerformance({ filters }: { filters: GlobalFilters }) {
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

function RealReturn({ filters }: { filters: GlobalFilters }) {
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

function PeersComparison({ filters }: { filters: GlobalFilters }) {
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
