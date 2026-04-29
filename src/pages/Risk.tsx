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
import RiskFrontierChart from '@/components/charts/RiskFrontierChart';
import EnterpriseRiskMap, { ENTERPRISE_RISK_SCENARIOS } from '@/components/charts/EnterpriseRiskMap';
import {
  riskContribution, assetClassExposureData, getTimeLabels,
} from '@/data/mockData';

type RiskTabConfig = {
  key: 'Absolute Risk' | 'Active Risk' | 'Other Risk Metrics' | 'Enterprise Risk Map';
  metric: string;
  label: string;
  subtitle: string;
  metric2?: string;
  label2?: string;
  subtitle2?: string;
};
const riskTabsConfig: RiskTabConfig[] = [
  { key: 'Absolute Risk', metric: '11.5%', label: 'Total Vol (P)', subtitle: 'vs 10.2% Benchmark' },
  { key: 'Active Risk', metric: '2.8%', label: 'Tracking Error', subtitle: 'vs Benchmark' },
  { key: 'Other Risk Metrics', metric: '1.54x', label: 'Ext. Leverage', subtitle: '$26.9B borrowings', metric2: '2.19x', label2: 'Liquidity Coverage', subtitle2: 'Supply / Demand' },
  { key: 'Enterprise Risk Map', metric: '12', label: 'Tracked Scenarios', subtitle: 'Likelihood × impact' },
];
const riskTabs = riskTabsConfig.map(t => t.key);
type RiskTab = typeof riskTabs[number];

export default function Risk() {
  const [searchParams] = useSearchParams();
  const initialTab = riskTabs.find(t => t === searchParams.get('tab')) || 'Absolute Risk';
  const [tab, setTab] = useState<RiskTab>(initialTab);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-3">
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
            {t.key === 'Enterprise Risk Map' ? (() => {
              const topImpact = [...ENTERPRISE_RISK_SCENARIOS].sort((a, b) => b.impact - a.impact)[0];
              const topLikelihood = [...ENTERPRISE_RISK_SCENARIOS].sort((a, b) => b.likelihood - a.likelihood)[0];
              return (
                <div className="mt-2 space-y-1.5">
                  <div>
                    <p className={cn('text-[9px] uppercase tracking-wider', tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>Highest impact</p>
                    <p className={cn('text-sm font-bold leading-tight', tab === t.key ? 'text-primary-foreground' : 'text-accent')}>
                      {topImpact.name} <span className={cn('text-xs font-semibold', tab === t.key ? 'text-primary-foreground/80' : 'text-muted-foreground')}>· {topImpact.impact}</span>
                    </p>
                    
                  </div>
                  <div>
                    <p className={cn('text-[9px] uppercase tracking-wider', tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>Highest likelihood</p>
                    <p className={cn('text-sm font-bold leading-tight', tab === t.key ? 'text-primary-foreground' : 'text-accent')}>
                      {topLikelihood.name} <span className={cn('text-xs font-semibold', tab === t.key ? 'text-primary-foreground/80' : 'text-muted-foreground')}>· {topLikelihood.likelihood}</span>
                    </p>
                    
                  </div>
                </div>
              );
            })() : t.metric2 ? (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className={cn('text-2xl font-bold tracking-tight', tab === t.key ? 'text-primary-foreground' : 'text-accent')}>{t.metric}</p>
                  <p className={cn('text-[11px] mt-1', tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{t.label}</p>
                  <p className={cn('text-[10px]', tab === t.key ? 'text-primary-foreground/60' : 'text-muted-foreground/80')}>{t.subtitle}</p>
                </div>
                <div className={cn('border-l pl-3', tab === t.key ? 'border-primary-foreground/30' : 'border-border')}>
                  <p className={cn('text-2xl font-bold tracking-tight', tab === t.key ? 'text-primary-foreground' : 'text-accent')}>{t.metric2}</p>
                  <p className={cn('text-[11px] mt-1', tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{t.label2}</p>
                  <p className={cn('text-[10px]', tab === t.key ? 'text-primary-foreground/60' : 'text-muted-foreground/80')}>{t.subtitle2}</p>
                </div>
              </div>
            ) : (
              <>
                <p className={cn('text-2xl font-bold tracking-tight mt-2', tab === t.key ? 'text-primary-foreground' : 'text-accent')}>{t.metric}</p>
                <p className={cn('text-[11px] mt-1', tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{t.label} · {t.subtitle}</p>
              </>
            )}
          </button>
        ))}
      </div>
      {tab === 'Absolute Risk' && <AbsoluteRiskSection />}
      {tab === 'Active Risk' && <ActiveRiskSection />}
      {tab === 'Other Risk Metrics' && <OtherRiskMetricsSection />}
      {tab === 'Enterprise Risk Map' && (
        <ChartCard
          id="erm-map"
          title="Enterprise Risk Map"
          subtitle="Scenario likelihood vs portfolio impact, coloured by imminence horizon"
        >
          <EnterpriseRiskMap data={ENTERPRISE_RISK_SCENARIOS} height={460} />
        </ChartCard>
      )}
    </div>
  );
}

// ============ OTHER RISK METRICS ============
const equityBetaData = [
  { name: 'Developed Equity', value: 0.92 },
  { name: 'Emerging Equity', value: 0.78 },
  { name: 'Private Equity', value: 0.65 },
  { name: 'Real Estate', value: 0.42 },
  { name: 'Infrastructure', value: 0.28 },
  { name: 'Hedge Funds', value: 0.35 },
];

const durationData = [
  { name: 'Government Bonds', value: 7.2 },
  { name: 'Corporate IG', value: 5.8 },
  { name: 'High Yield', value: 3.4 },
  { name: 'EM Debt', value: 6.1 },
  { name: 'Inflation-Linked', value: 8.5 },
  { name: 'Cash & Equivalents', value: 0.3 },
];

const externalBorrowingData = [
  { strategy: 'Real Estate Strategies', direct: 5.2, sigIndirect: 2.1, otherIndirect: 1.5, ltv: 0.35, leverage: 1.42 },
  { strategy: 'Infrastructure Strategies', direct: 3.8, sigIndirect: 1.5, otherIndirect: 0.8, ltv: 0.28, leverage: 1.35 },
  { strategy: 'Private Equity Strategies', direct: 0.0, sigIndirect: 4.2, otherIndirect: 2.1, ltv: 0.45, leverage: 1.68 },
  { strategy: 'Integrated Strategies', direct: 1.5, sigIndirect: 0.8, otherIndirect: 0.5, ltv: 0.18, leverage: 1.15 },
  { strategy: 'Enhanced ILB Strategy', direct: 2.1, sigIndirect: 0.5, otherIndirect: 0.3, ltv: 0.12, leverage: 1.08 },
];
const externalBorrowingTotals = [
  { strategy: 'Investment-Related Borrowings', direct: 12.6, sigIndirect: 9.1, otherIndirect: 5.2, ltv: 0.16, leverage: 1.54 },
  { strategy: 'Operational Borrowings', direct: 1.5, sigIndirect: 0.0, otherIndirect: 0.0, ltv: 0.05, leverage: 1.02 },
];

const liquidityData = [
  { category: 'Supply', item: 'Cash & Near-Cash', current: 15.2, gfc: 8.5, stag: 10.1 },
  { category: 'Supply', item: 'Committed Credit Lines', current: 12.8, gfc: 12.8, stag: 12.8 },
  { category: 'Demand', item: 'Margin Calls', current: -5.2, gfc: -18.5, stag: -12.2 },
  { category: 'Demand', item: 'Redemptions', current: -3.1, gfc: -8.2, stag: -6.5 },
  { category: 'Demand', item: 'Capital Calls', current: -4.5, gfc: -2.1, stag: -3.2 },
];
const liquidityNet = { current: 15.2, gfc: -7.5, stag: 1.0 };

const portfolioRiskColumns = [
  { key: 'strategic', name: 'Strategic Portfolio', subtitle: 'Equities · Fixed income · Real estate', color: 'hsl(212, 72%, 42%)', bg: 'hsl(212, 72%, 42% / 0.08)' },
  { key: 'transition', name: 'Strategic Portfolio Transition', subtitle: '+ ILBs · Credit · Infrastructure', color: 'hsl(155, 50%, 35%)', bg: 'hsl(155, 50%, 35% / 0.08)' },
  { key: 'total', name: 'Total Portfolio', subtitle: 'Broad multi-asset', color: 'hsl(258, 55%, 45%)', bg: 'hsl(258, 55%, 45% / 0.08)' },
] as const;

const portfolioRiskRows = [
  {
    group: 'Downside Risk',
    rows: [
      { label: '3Y real return VaR at 95%', strategic: '-14.2%', transition: '-10.6%', total: '-8.1%', isPill: true, pillTone: ['neg', 'warn', 'warn'] as const },
    ],
  },
  {
    group: 'Return Preservation — 10-year horizon',
    rows: [
      { label: 'Prob. of 10Y real return > 0%', strategic: '78%', transition: '83%', total: '87%', isPill: false },
      { label: 'Prob. of 10Y real return > 3%', strategic: '44%', transition: '51%', total: '58%', isPill: false },
    ],
  },
] as const;

function PortfolioRiskTable() {
  const pillClass = (tone: 'neg' | 'warn') =>
    tone === 'neg'
      ? 'bg-chart-negative/15 text-chart-negative'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400';

  return (
    <ChartCard id="orm-0" title="Downside Risk & Return Preservation" subtitle="Value-at-Risk and probability of meeting real return targets across portfolio constructions">
      <div className="overflow-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left py-3 px-3 font-medium bg-muted/30 border-b border-border w-[28%]"></th>
              {portfolioRiskColumns.map(c => (
                <th key={c.key} className="py-3 px-3 text-center align-top border-b-2" style={{ backgroundColor: c.bg, borderBottomColor: c.color }}>
                  <div className="font-semibold text-sm" style={{ color: c.color }}>{c.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">{c.subtitle}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolioRiskRows.map(group => (
              <>
                <tr key={`g-${group.group}`}>
                  <td colSpan={4} className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/50">
                    {group.group}
                  </td>
                </tr>
                {group.rows.map(r => (
                  <tr key={r.label} className="border-b border-border/30">
                    <td className="py-3 px-3 text-foreground border-b border-border/30">{r.label}</td>
                    {portfolioRiskColumns.map((c, i) => {
                      const val = r[c.key as 'strategic' | 'transition' | 'total'];
                      return (
                        <td key={c.key} className="py-3 px-3 text-center align-middle border-b border-border/30" style={{ backgroundColor: c.bg }}>
                          {r.isPill ? (
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums ${pillClass(r.pillTone![i])}`}>
                              {val}
                            </span>
                          ) : (
                            <span className="text-2xl font-semibold tabular-nums" style={{ color: c.color }}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function OtherRiskMetricsSection() {
  return (
    <div className="space-y-4">
      <PortfolioRiskTable />
      <div className="grid grid-cols-2 gap-4">
        <ChartCard id="orm-1" title="Equity Market Sensitivity (Beta)" subtitle="Portfolio beta to equity markets by asset class">
          <FinancialBarChart data={equityBetaData} height={260} colorByValue={false} barColor="hsl(212, 72%, 42%)" />
        </ChartCard>
        <ChartCard id="orm-2" title="Fixed Income Sensitivity (Duration, years)" subtitle="Effective duration in years by fixed income segment">
          <FinancialBarChart data={durationData} height={260} colorByValue={false} barColor="hsl(212, 72%, 42%)" />
        </ChartCard>
      </div>

      <ChartCard id="orm-3" title="External Borrowing">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Strategy</th>
                <th className="text-right py-2 px-3 font-medium">Direct Borrowing (%)</th>
                <th className="text-right py-2 px-3 font-medium">Sig. Indirect (%)</th>
                <th className="text-right py-2 px-3 font-medium">Other Indirect (%)</th>
                <th className="text-right py-2 px-3 font-medium">Loan-to-Value</th>
                <th className="text-right py-2 px-3 font-medium">Leverage Ratio</th>
              </tr>
            </thead>
            <tbody>
              {externalBorrowingData.map(r => (
                <tr key={r.strategy} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">{r.strategy}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.direct.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.sigIndirect.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.otherIndirect.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.ltv.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.leverage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {externalBorrowingTotals.map(r => (
                <tr key={r.strategy} className="font-semibold border-t border-border">
                  <td className="py-2 px-3">{r.strategy}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.direct.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.sigIndirect.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.otherIndirect.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.ltv.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.leverage.toFixed(2)}</td>
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </ChartCard>

      <ChartCard id="orm-4" title="Liquidity Coverage Ratio">
        <div className="overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Category</th>
                <th className="text-left py-2 px-3 font-medium">Item</th>
                <th className="text-right py-2 px-3 font-medium">Current (%)</th>
                <th className="text-right py-2 px-3 font-medium">GFC Stress (%)</th>
                <th className="text-right py-2 px-3 font-medium">Stagflation (%)</th>
              </tr>
            </thead>
            <tbody>
              {liquidityData.map(r => (
                <tr key={r.item} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">{r.category}</td>
                  <td className="py-2 px-3">{r.item}</td>
                  <td className={cn('py-2 px-3 text-right tabular-nums', r.current < 0 && 'text-chart-negative')}>{r.current.toFixed(1)}</td>
                  <td className={cn('py-2 px-3 text-right tabular-nums', r.gfc < 0 && 'text-chart-negative')}>{r.gfc.toFixed(1)}</td>
                  <td className={cn('py-2 px-3 text-right tabular-nums', r.stag < 0 && 'text-chart-negative')}>{r.stag.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-border">
                <td className="py-2 px-3" colSpan={2}>Net Liquidity Coverage</td>
                <td className={cn('py-2 px-3 text-right tabular-nums', liquidityNet.current < 0 && 'text-chart-negative')}>{liquidityNet.current.toFixed(1)}</td>
                <td className={cn('py-2 px-3 text-right tabular-nums', liquidityNet.gfc < 0 && 'text-chart-negative')}>{liquidityNet.gfc.toFixed(1)}</td>
                <td className={cn('py-2 px-3 text-right tabular-nums', liquidityNet.stag < 0 && 'text-chart-negative')}>{liquidityNet.stag.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
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

type RiskMeasure = 'Volatility' | 'ETL' | '3YSL';
const riskMeasureLabels: Record<RiskMeasure, string> = {
  Volatility: 'Ex-Ante Volatility',
  ETL: 'Expected Tail Loss',
  '3YSL': 'Three-Year Stress Loss',
};
const riskMeasureShort: Record<RiskMeasure, string> = {
  Volatility: 'Vol',
  ETL: 'ETL',
  '3YSL': '3YSL',
};

function AbsoluteRiskSection() {
  const [measure, setMeasure] = useState<RiskMeasure>('ETL');
  const [contribView, setContribView] = useState<View>('Portfolio');
  const [ownView, setOwnView] = useState<View>('Portfolio');
  const [topN, setTopN] = useState(5);
  const [period, setPeriod] = useState<string>('1Y');

  // Scale factor: ETL ≈ -1.4× vol; 3YSL ≈ -2.5× vol (deeper stress loss, negative)
  const measureScale = measure === 'Volatility' ? 1 : measure === 'ETL' ? -1.4 : -2.5;
  const isNegative = measure !== 'Volatility';
  const portfolioBase = 11.5;
  const benchmarkBase = 10.2;
  const portfolioMetric = +(portfolioBase * Math.abs(measureScale)).toFixed(2) * (isNegative ? -1 : 1);
  const benchmarkMetric = +(benchmarkBase * Math.abs(measureScale)).toFixed(2) * (isNegative ? -1 : 1);

  // Period labels: 1Y monthly, 5Y quarterly, 10Y yearly (matches Exposure)
  const xKey = 'label';
  const labels = useMemo(() => {
    if (period === '1Y') return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (period === '5Y') return ['Q1 22','Q2 22','Q3 22','Q4 22','Q1 23','Q2 23','Q3 23','Q4 23','Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26','Q3 26','Q4 26'];
    return ['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];
  }, [period]);

  // Source list, sorted desc by abs contribution, with Top N + Others
  const buildBars = (view: View) => {
    const src = view === 'Portfolio' ? PORTFOLIO_COMPONENTS : BENCHMARK_COMPONENTS;
    const scaled = src.map(s => ({
      name: s.name,
      vol: +(s.vol * measureScale).toFixed(2),
      contribution: +(s.contribution * measureScale).toFixed(2),
    }));
    const sorted = [...scaled].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const restContrib = rest.reduce((s, r) => s + r.contribution, 0);
    const restVol = rest.length ? rest.reduce((s, r) => s + r.vol, 0) / rest.length : 0;
    const items = [...top];
    if (rest.length) items.push({ name: 'Others', vol: +restVol.toFixed(2), contribution: +restContrib.toFixed(2) });
    return items;
  };

  const contribBars = useMemo(() => buildBars(contribView), [contribView, topN, measure]);
  const ownBars = useMemo(() => buildBars(ownView), [ownView, topN, measure]);

  // Trend: P vs BM
  const volTrend = useMemo(() => labels.map((m, i) => ({
    [xKey]: m,
    Portfolio: +(portfolioMetric + Math.sin(i / 2) * 0.6 * Math.sign(measureScale) + ((i * 13) % 7) / 50).toFixed(2),
    Benchmark: +(benchmarkMetric + Math.sin(i / 2.5) * 0.5 * Math.sign(measureScale) + ((i * 7) % 5) / 50).toFixed(2),
  })), [labels, measure]);

  // Stacked contribution-over-time trend (chart iv)
  const contribTrend = useMemo(() => {
    const totalLine = contribView === 'Portfolio' ? portfolioMetric : benchmarkMetric;
    return labels.map((m, i) => {
      const row: Record<string, string | number> = { [xKey]: m };
      contribBars.forEach((b, j) => {
        const wobble = 1 + Math.sin((i + j) / 2) * 0.15;
        row[b.name] = +(b.contribution * wobble).toFixed(2);
      });
      row['Total'] = +(totalLine + Math.sin(i / 2) * 0.5 * Math.sign(measureScale)).toFixed(2);
      return row;
    });
  }, [contribBars, contribView, labels, measure]);

  // Own-based trend (chart vi)
  const ownTrend = useMemo(() => labels.map((m, i) => {
    const row: Record<string, string | number> = { [xKey]: m };
    ownBars.forEach((b, j) => {
      row[b.name] = +(b.vol + Math.sin((i + j * 1.3) / 2) * 0.4 * Math.sign(measureScale)).toFixed(2);
    });
    return row;
  }), [ownBars, labels, measure]);

  const measurePill = <FilterPill label="Risk" value={riskMeasureShort[measure]} variant="breakdown" />;

  return (
    <div className="space-y-4">
      {/* Top-level controls: Risk Measure (left, primary) + Period (right, muted) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-primary" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Risk Measure</span>
                <p className="text-[9px] text-muted-foreground">All charts</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar
              options={['ETL', '3YSL', 'Volatility'] as const}
              value={measure}
              onChange={(v) => setMeasure(v)}
              size="sm"
            />
          </div>
        </div>
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
      </div>

      {/* Row 1: Comparison + trend */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          id="ar-1"
          title={`${riskMeasureLabels[measure]}: Portfolio vs Tracking Error`}
          subtitle={measure === 'Volatility'
            ? 'Portfolio volatility frontier as a function of TE (ρ = corr. of active vs benchmark)'
            : `Portfolio ${riskMeasureShort[measure]} frontier as a function of TE (ρ = corr. of active vs benchmark)`}
          footer={measurePill}
        >
          <RiskFrontierChart
            benchmarkRisk={Math.abs(benchmarkMetric)}
            portfolioTE={2.8}
            rho={-0.01}
            yLabel={measure === 'Volatility' ? 'Portfolio volatility (%)' : `Portfolio ${riskMeasureShort[measure]} (%)`}
            portfolioSymbol={measure === 'Volatility' ? 'σ_p' : `${riskMeasureShort[measure]}_p`}
            negative={isNegative}
          />
        </ChartCard>
        <div className="border-l-2 border-muted-foreground/30 pl-3 flex">
          <ChartCard
            id="ar-2"
            title={`${riskMeasureLabels[measure]} Trend`}
            subtitle="Portfolio vs Benchmark"
            className="flex-1"
            footer={
              <>
                {measurePill}
                <FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />
              </>
            }
          >
            <TrendChart
              data={volTrend}
              xKey={xKey}
              lines={['Portfolio', 'Benchmark']}
              lineColors={{ Portfolio: 'hsl(212, 72%, 42%)', Benchmark: 'hsl(215, 15%, 55%)' }}
              height={360}
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

      {/* Rows 2 & 3 */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/30 pl-3 ml-1">
        {/* iii) Contribution */}
        <ChartCard
          id="ar-3"
          title={`${riskMeasureLabels[measure]} Contribution`}
          subtitle={contribView === 'Portfolio'
            ? `Active strategies → Portfolio ${riskMeasureShort[measure]}`
            : `Asset classes → Benchmark ${riskMeasureShort[measure]}`}
          footer={
            <>
              {measurePill}
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
            title={`Contribution to ${riskMeasureLabels[measure]} — Trend`}
            subtitle={`Stacked contributions with total ${riskMeasureShort[measure]} overlay`}
            footer={
              <>
                {measurePill}
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

        {/* v) Own-based */}
        <ChartCard
          id="ar-5"
          title={`Own-Based ${riskMeasureLabels[measure]}`}
          subtitle={ownView === 'Portfolio'
            ? `Active strategies, standalone ${riskMeasureShort[measure]}`
            : `Asset classes, standalone ${riskMeasureShort[measure]}`}
          footer={
            <>
              {measurePill}
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
            title={`Own-Based ${riskMeasureLabels[measure]} — Trend`}
            subtitle={`Per-component standalone ${riskMeasureShort[measure]}`}
            footer={
              <>
                {measurePill}
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

// Creative comparison: side-by-side vertical bars with delta callout.
// Works for both Volatility (positive) and ETL (negative loss values).
function VolGaugeCompare({ portfolio, benchmark, measure = 'Volatility' }: { portfolio: number; benchmark: number; measure?: RiskMeasure }) {
  const absP = Math.abs(portfolio);
  const absB = Math.abs(benchmark);
  const max = Math.max(absP, absB) * 1.25;
  const pPct = (absP / max) * 100;
  const bPct = (absB / max) * 100;
  const delta = +(portfolio - benchmark).toFixed(2);
  // For ETL, smaller |loss| is good (positive delta means portfolio loses less)
  const deltaPositive = measure === 'ETL' ? delta >= 0 : delta >= 0;
  const fmt = (v: number) => `${v.toFixed(2)}%`;

  const pGradient = measure === 'ETL'
    ? 'linear-gradient(180deg, hsl(0, 60%, 60%) 0%, hsl(0, 70%, 38%) 100%)'
    : 'linear-gradient(180deg, hsl(212, 72%, 52%) 0%, hsl(212, 72%, 35%) 100%)';

  return (
    <div className="flex items-end justify-around h-[250px] gap-6 px-4 pb-2 relative">
      {/* Portfolio column */}
      <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[120px]">
        <div className="text-xs font-semibold text-foreground mb-1">{fmt(portfolio)}</div>
        <div className="w-full bg-muted/40 rounded-md relative" style={{ height: '85%' }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-md transition-all"
            style={{ height: `${pPct}%`, background: pGradient }}
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
        <div className="text-xs font-semibold text-foreground mb-1">{fmt(benchmark)}</div>
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

// ============ ACTIVE RISK ============
// Tracking error contribution by active strategy (uses portfolio components only — no toggle).
const ACTIVE_RISK_COMPONENTS = riskContribution.map(s => ({
  name: s.name,
  ownTE: +s.ownTE.toFixed(2),
  contribution: +s.contribution.toFixed(2),
}));

function ActiveRiskSection() {
  const [topN, setTopN] = useState(5);
  const [period, setPeriod] = useState<string>('1Y');

  const portfolioTE = 2.8;          // total ex-ante tracking error
  const trackingLimit = 5.0;        // limit/budget for context

  const xKey = 'label';
  const labels = useMemo(() => {
    if (period === '1Y') return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (period === '5Y') return ['Q1 22','Q2 22','Q3 22','Q4 22','Q1 23','Q2 23','Q3 23','Q4 23','Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26','Q3 26','Q4 26'];
    return ['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];
  }, [period]);

  const bars = useMemo(() => {
    const sorted = [...ACTIVE_RISK_COMPONENTS].sort((a, b) => b.contribution - a.contribution);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const items = [...top];
    if (rest.length) {
      items.push({
        name: 'Others',
        ownTE: +(rest.reduce((s, r) => s + r.ownTE, 0) / rest.length).toFixed(2),
        contribution: +rest.reduce((s, r) => s + r.contribution, 0).toFixed(2),
      });
    }
    return items;
  }, [topN]);

  const teTrend = useMemo(() => labels.map((m, i) => ({
    [xKey]: m,
    'Tracking Error': +(portfolioTE + Math.sin(i / 2.2) * 0.4 + ((i * 11) % 5) / 60).toFixed(2),
    Limit: trackingLimit,
  })), [labels]);

  const contribTrend = useMemo(() => labels.map((m, i) => {
    const row: Record<string, string | number> = { [xKey]: m };
    bars.forEach((b, j) => {
      const wobble = 1 + Math.sin((i + j) / 2) * 0.15;
      row[b.name] = +(b.contribution * wobble).toFixed(2);
    });
    row['Total'] = +(portfolioTE + Math.sin(i / 2) * 0.3).toFixed(2);
    return row;
  }), [bars, labels]);

  const ownTrend = useMemo(() => labels.map((m, i) => {
    const row: Record<string, string | number> = { [xKey]: m };
    bars.forEach((b, j) => {
      row[b.name] = +(b.ownTE + Math.sin((i + j * 1.3) / 2) * 0.3).toFixed(2);
    });
    return row;
  }), [bars, labels]);

  return (
    <div className="space-y-4">
      {/* Period control */}
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
          <ToggleBar options={['1Y', '5Y', '10Y'] as const} value={period} onChange={setPeriod} size="sm" />
          <span className="text-[9px] text-muted-foreground font-medium">({periodDescriptions[period]})</span>
        </div>
      </div>

      {/* Row 1: TE gauge + TE trend */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          id="acr-1"
          title="Ex-Ante Tracking Error"
          subtitle="Annualised, current snapshot vs limit"
        >
          <TrackingErrorGauge te={portfolioTE} limit={trackingLimit} />
        </ChartCard>
        <div className="border-l-2 border-muted-foreground/30 pl-3">
          <ChartCard
            id="acr-2"
            title="Ex-Ante Tracking Error Trend"
            subtitle="Portfolio TE over time"
            footer={<FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />}
          >
            <TrendChart
              data={teTrend}
              xKey={xKey}
              lines={['Tracking Error', 'Limit']}
              lineColors={{ 'Tracking Error': 'hsl(212, 72%, 42%)', Limit: 'hsl(0, 60%, 55%)' }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Top N control — accent, scoped to rows 2 & 3 */}
      <div className="rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-8 rounded-full bg-accent" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Strategies</span>
              <p className="text-[9px] text-muted-foreground">Applies to rows 2 &amp; 3 below ↓</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />
          <TopNSelect value={topN} onChange={setTopN} />
        </div>
      </div>

      {/* Rows 2 & 3 */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/30 pl-3 ml-1">
        <ChartCard
          id="acr-3"
          title="Tracking Error Contribution"
          subtitle="Active strategies → Portfolio TE"
          footer={<FilterPill label="Top" value={String(topN)} variant="breakdown" />}
        >
          <FinancialBarChart
            data={bars.map(b => ({ name: b.name, value: b.contribution }))}
            colorByValue={false}
            barColor="hsl(212, 72%, 42%)"
          />
        </ChartCard>

        <div className="border-l-2 border-muted-foreground/30 pl-3 -ml-3">
          <ChartCard
            id="acr-4"
            title="Contribution to Tracking Error — Trend"
            subtitle="Stacked contributions with total TE overlay"
            footer={
              <>
                <FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />
                <FilterPill label="Top" value={String(topN)} variant="breakdown" />
              </>
            }
          >
            <StackedTimeChart
              data={contribTrend}
              categories={bars.map(b => b.name)}
              overlayLine="Total"
              xKey={xKey}
            />
          </ChartCard>
        </div>

        <ChartCard
          id="acr-5"
          title="Own-Based Tracking Error"
          subtitle="Active strategies, standalone TE with ARC"
          footer={<FilterPill label="Top" value={String(topN)} variant="breakdown" />}
        >
          <FinancialBarChart
            data={bars.map(b => ({
              name: b.name,
              value: b.ownTE,
              // Allowed standalone TE budget per strategy (mock)
              limit: b.name === 'Others' ? +(b.ownTE * 1.15).toFixed(2) : +(b.ownTE * (0.85 + ((b.name.length % 5) * 0.1))).toFixed(2),
            }))}
            colorByValue={false}
            barColor="hsl(32, 80%, 50%)"
            showLimit
          />
        </ChartCard>

        <div className="border-l-2 border-muted-foreground/30 pl-3 -ml-3">
          <ChartCard
            id="acr-6"
            title="Own-Based Tracking Error — Trend"
            subtitle="Per-strategy standalone TE"
            footer={
              <>
                <FilterPill label="Period" value={`${period} (${periodDescriptions[period]})`} variant="period" />
                <FilterPill label="Top" value={String(topN)} variant="breakdown" />
              </>
            }
          >
            <TrendChart data={ownTrend} lines={bars.map(b => b.name)} xKey={xKey} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// TE gauge: horizontal bar showing TE used vs limit, with prominent value
function TrackingErrorGauge({ te, limit }: { te: number; limit: number }) {
  const pct = Math.min((te / limit) * 100, 100);
  const utilization = ((te / limit) * 100).toFixed(0);

  return (
    <div className="flex flex-col justify-center h-[250px] px-2 gap-6">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Portfolio Tracking Error</div>
        <div className="text-5xl font-bold tracking-tight text-foreground mt-1">{te.toFixed(2)}<span className="text-2xl text-muted-foreground">%</span></div>
        <div className="text-[10px] text-muted-foreground mt-1">{utilization}% of {limit.toFixed(1)}% limit</div>
      </div>

      <div className="space-y-2 px-4">
        <div className="relative h-6 bg-muted/40 rounded-md overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-md transition-all"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, hsl(212, 72%, 52%) 0%, hsl(212, 72%, 35%) 100%)',
            }}
          />
          {/* Limit marker */}
          <div className="absolute inset-y-0 right-0 w-0.5 bg-destructive" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className="font-semibold text-foreground">Used: {te.toFixed(2)}%</span>
          <span className="text-destructive font-semibold">Limit: {limit.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
