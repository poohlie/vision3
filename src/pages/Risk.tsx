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
  { key: 'Absolute Risk' as const, metric: '—', label: 'Absolute Risk', subtitle: 'Placeholder' },
  { key: 'Active Risk' as const, metric: '—', label: 'Active Risk', subtitle: 'Placeholder' },
  { key: 'Other Risk Metrics' as const, metric: '—', label: 'Other Risk Metrics', subtitle: 'Placeholder' },
];
const riskTabs = riskTabsConfig.map(t => t.key);
type RiskTab = typeof riskTabs[number];
const breakdowns = ['Active Strategies', 'Country', 'Sector'] as const;
const measures = ['Tracking Error', 'Volatility'] as const;

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
      {tab === 'Absolute Risk' && <PlaceholderSection title="Absolute Risk" />}
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

function StrategicRisk() {
  const [bd, setBd] = useState<string>('Active Strategies');
  const [topN, setTopN] = useState(6);
  const [measure, setMeasure] = useState<string>('Tracking Error');
  const [sliderVal, setSliderVal] = useState(12);

  const countryRisk = [
    { name: 'United States', contribution: 1.2, ownTE: 3.8 },
    { name: 'Japan', contribution: 0.4, ownTE: 2.9 },
    { name: 'United Kingdom', contribution: 0.3, ownTE: 2.1 },
    { name: 'Germany', contribution: 0.25, ownTE: 2.5 },
    { name: 'China', contribution: 0.35, ownTE: 4.2 },
    { name: 'France', contribution: 0.15, ownTE: 1.8 },
    { name: 'Canada', contribution: 0.1, ownTE: 1.5 },
    { name: 'Australia', contribution: 0.08, ownTE: 1.9 },
  ];
  const sectorRisk = [
    { name: 'Information Technology', contribution: 0.95, ownTE: 4.5 },
    { name: 'Financials', contribution: 0.55, ownTE: 3.2 },
    { name: 'Healthcare', contribution: 0.3, ownTE: 2.8 },
    { name: 'Energy', contribution: 0.4, ownTE: 5.1 },
    { name: 'Consumer Disc.', contribution: 0.25, ownTE: 3.0 },
    { name: 'Industrials', contribution: 0.2, ownTE: 2.4 },
    { name: 'Materials', contribution: 0.15, ownTE: 3.6 },
    { name: 'Comm. Services', contribution: 0.18, ownTE: 2.7 },
  ];

  const sourceData = bd === 'Country' ? countryRisk : bd === 'Sector' ? sectorRisk : riskContribution;
  const riskData = sourceData.slice(0, topN);
  const others = sourceData.slice(topN);
  const contribData = [...riskData.map(s => ({ name: s.name, value: s.contribution })),
    ...(others.length ? [{ name: 'Others', value: others.reduce((s, o) => s + o.contribution, 0) }] : [])];
  const ownData = [...riskData.map(s => ({ name: s.name, value: s.ownTE })),
    ...(others.length ? [{ name: 'Others', value: others.reduce((s, o) => s + o.ownTE, 0) / (others.length || 1) }] : [])];

  const trendLines = measure === 'Tracking Error' ? ['trackingError'] : ['totalVol', 'benchmarkVol'];

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="sr-1" title="Portfolio Risk Geometry">
        <RiskTriangleChart volP={11.5} volB1={14.0} volB2={9.5} teP_B1={4.5} teP_B2={3.2} />
      </ChartCard>
      <ChartCard id="sr-2" title={`${measure} Trend`} toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={measures} value={measure as any} onChange={setMeasure} size="xs" />
          <label className="text-[10px] text-muted-foreground">Period:</label>
          <input type="range" min={3} max={12} value={sliderVal} onChange={e => setSliderVal(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <TrendChart data={trackingErrorSeries.slice(0, sliderVal)} lines={trendLines} />
      </ChartCard>
      <ChartCard id="sr-3" title="TE Contribution by Strategy" toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={breakdowns} value={bd as any} onChange={setBd} size="xs" />
          <label className="text-[10px] text-muted-foreground">Top N:</label>
          <input type="range" min={3} max={8} value={topN} onChange={e => setTopN(+e.target.value)} className="w-16 h-1" />
          <span className="text-[10px] w-4">{topN}</span>
        </div>
      }>
        <FinancialBarChart data={contribData} colorByValue={false} barColor="hsl(212, 72%, 42%)" />
      </ChartCard>
      <ChartCard id="sr-4" title="TE Contribution Over Time">
        <StackedTimeChart
          data={contributionTimeSeries}
          categories={riskData.slice(0, 6).map(s => s.name)}
          overlayLine="Total Portfolio"
        />
      </ChartCard>
      <ChartCard id="sr-5" title="Own-Based TE by Strategy" toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={breakdowns} value={bd as any} onChange={setBd} size="xs" />
          <label className="text-[10px] text-muted-foreground">Top N:</label>
          <input type="range" min={3} max={8} value={topN} onChange={e => setTopN(+e.target.value)} className="w-16 h-1" />
          <span className="text-[10px] w-4">{topN}</span>
        </div>
      }>
        <FinancialBarChart data={ownData} />
      </ChartCard>
      <ChartCard id="sr-6" title="Strategy TE Trend" toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={measures} value={measure as any} onChange={setMeasure} size="xs" />
          <label className="text-[10px] text-muted-foreground">Period:</label>
          <input type="range" min={3} max={12} value={sliderVal} onChange={e => setSliderVal(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <TrendChart data={trackingErrorSeries.slice(0, sliderVal)} lines={trendLines} />
      </ChartCard>
    </div>
  );
}

function PortfolioResilience() {
  const [mode, setMode] = useState<string>('Stress Loss');
  const [bd, setBd] = useState<string>('Active Strategies');
  const [topN, setTopN] = useState(6);
  const [sliderVal, setSliderVal] = useState(12);
  const factorBd = ['Active Strategies', 'Factor Group'] as const;

  const wfData = mode === 'Stress Loss' ? resilienceWaterfallData.stressLoss : resilienceWaterfallData.etl;
  const contribData = riskContribution.slice(0, topN).map(s => ({ name: s.name, value: -(s.contribution * 5) }));
  const ownData = riskContribution.slice(0, topN).map(s => ({ name: s.name, value: -(s.ownTE * 1.5) }));

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="pr-1" title="Stress Attribution" toolbar={
        <ToggleBar options={['Stress Loss', 'Expected Tail Loss'] as const} value={mode} onChange={setMode} size="xs" />
      }>
        <WaterfallChart data={wfData} />
      </ChartCard>
      <ChartCard id="pr-2" title="Stress Attribution Over Time" toolbar={
        <div className="flex gap-2 items-center">
          <label className="text-[10px] text-muted-foreground">Period:</label>
          <input type="range" min={3} max={12} value={sliderVal} onChange={e => setSliderVal(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <StackedTimeChart data={contributionTimeSeries.slice(0, sliderVal)} categories={['strategicPortfolio', 'mts', 'activeStrategies']} />
      </ChartCard>
      <ChartCard id="pr-3" title="Stress Contribution by Strategy" toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={factorBd} value={bd as any} onChange={setBd} size="xs" />
          <ToggleBar options={['Stress Loss', 'Expected Tail Loss'] as const} value={mode} onChange={setMode} size="xs" />
          <label className="text-[10px] text-muted-foreground">Top N:</label>
          <input type="range" min={3} max={8} value={topN} onChange={e => setTopN(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <FinancialBarChart data={contribData} />
      </ChartCard>
      <ChartCard id="pr-4" title="Stress Contribution Over Time" toolbar={
        <div className="flex gap-2 items-center">
          <label className="text-[10px] text-muted-foreground">Period:</label>
          <input type="range" min={3} max={12} value={sliderVal} onChange={e => setSliderVal(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <StackedTimeChart
          data={contributionTimeSeries.slice(0, sliderVal)}
          categories={riskContribution.slice(0, 6).map(s => s.name)}
          overlayLine="Total Portfolio"
        />
      </ChartCard>
      <ChartCard id="pr-5" title="Own-Based Stress Loss" toolbar={
        <div className="flex gap-2 items-center">
          <ToggleBar options={factorBd} value={bd as any} onChange={setBd} size="xs" />
          <ToggleBar options={['Stress Loss', 'Expected Tail Loss'] as const} value={mode} onChange={setMode} size="xs" />
          <label className="text-[10px] text-muted-foreground">Top N:</label>
          <input type="range" min={3} max={8} value={topN} onChange={e => setTopN(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <FinancialBarChart data={ownData} />
      </ChartCard>
      <ChartCard id="pr-6" title="Strategy Stress Loss Trend" toolbar={
        <div className="flex gap-2 items-center">
          <label className="text-[10px] text-muted-foreground">Period:</label>
          <input type="range" min={3} max={12} value={sliderVal} onChange={e => setSliderVal(+e.target.value)} className="w-16 h-1" />
        </div>
      }>
        <TrendChart data={trackingErrorSeries.slice(0, sliderVal)} lines={riskContribution.slice(0, 4).map(s => s.name)} />
      </ChartCard>
    </div>
  );
}

function OperationalResilience() {
  const totalInv = borrowingData.reduce((s, b) => ({
    direct: s.direct + b.direct, sigIndirect: s.sigIndirect + b.sigIndirect,
    otherIndirect: s.otherIndirect + b.otherIndirect, ltv: 0, leverage: 0,
  }), { direct: 0, sigIndirect: 0, otherIndirect: 0, ltv: 0, leverage: 0 });
  totalInv.ltv = +(totalInv.direct / (totalInv.direct + totalInv.sigIndirect + totalInv.otherIndirect + 50) * 100).toFixed(2) / 100;
  totalInv.leverage = +(1 + (totalInv.direct + totalInv.sigIndirect + totalInv.otherIndirect) / 50).toFixed(2);

  return (
    <div className="space-y-4">
      <ChartCard id="or-1" title="External Borrowing">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium">Strategy</th>
                <th className="text-right py-2 px-2 font-medium">Direct Borrowing (%)</th>
                <th className="text-right py-2 px-2 font-medium">Sig. Indirect (%)</th>
                <th className="text-right py-2 px-2 font-medium">Other Indirect (%)</th>
                <th className="text-right py-2 px-2 font-medium">Loan-to-Value</th>
                <th className="text-right py-2 px-2 font-medium">Leverage Ratio</th>
              </tr>
            </thead>
            <tbody>
              {borrowingData.map(b => (
                <tr key={b.strategy} className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-medium">{b.strategy}</td>
                  <td className="py-1.5 px-2 text-right">{b.direct.toFixed(1)}</td>
                  <td className="py-1.5 px-2 text-right">{b.sigIndirect.toFixed(1)}</td>
                  <td className="py-1.5 px-2 text-right">{b.otherIndirect.toFixed(1)}</td>
                  <td className="py-1.5 px-2 text-right">{b.ltv.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right">{b.leverage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2">
                <td className="py-1.5 px-2">Investment-Related Borrowings</td>
                <td className="py-1.5 px-2 text-right">{totalInv.direct.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right">{totalInv.sigIndirect.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right">{totalInv.otherIndirect.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right">{totalInv.ltv.toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right">{totalInv.leverage.toFixed(2)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-1.5 px-2">Operational Borrowings</td>
                <td className="py-1.5 px-2 text-right">1.5</td>
                <td className="py-1.5 px-2 text-right">0.0</td>
                <td className="py-1.5 px-2 text-right">0.0</td>
                <td className="py-1.5 px-2 text-right">0.05</td>
                <td className="py-1.5 px-2 text-right">1.02</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ChartCard>

      <ChartCard id="or-2" title="Liquidity Coverage Ratio">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-left py-2 px-2 font-medium">Item</th>
                <th className="text-right py-2 px-2 font-medium">Current (%)</th>
                <th className="text-right py-2 px-2 font-medium">GFC Stress (%)</th>
                <th className="text-right py-2 px-2 font-medium">Stagflation (%)</th>
              </tr>
            </thead>
            <tbody>
              {liquidityCoverageData.map((l, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 px-2 font-medium">{l.category}</td>
                  <td className="py-1.5 px-2">{l.item}</td>
                  <td className={cn('py-1.5 px-2 text-right', l.current < 0 && 'text-destructive font-medium')}>{l.current.toFixed(1)}</td>
                  <td className={cn('py-1.5 px-2 text-right', l.gfc < 0 && 'text-destructive font-medium')}>{l.gfc.toFixed(1)}</td>
                  <td className={cn('py-1.5 px-2 text-right', l.stagflation < 0 && 'text-destructive font-medium')}>{l.stagflation.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2">
                <td className="py-1.5 px-2" colSpan={2}>Net Liquidity Coverage</td>
                <td className="py-1.5 px-2 text-right">{liquidityCoverageData.reduce((s, l) => s + l.current, 0).toFixed(1)}</td>
                <td className={cn('py-1.5 px-2 text-right', liquidityCoverageData.reduce((s, l) => s + l.gfc, 0) < 0 && 'text-destructive')}>
                  {liquidityCoverageData.reduce((s, l) => s + l.gfc, 0).toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right">{liquidityCoverageData.reduce((s, l) => s + l.stagflation, 0).toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function EnterpriseRiskMap() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard id="erm-1" title="Enterprise Risk Map">
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
          Enterprise Risk Map — Placeholder
        </div>
      </ChartCard>
    </div>
  );
}
