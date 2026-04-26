import { useNavigate } from 'react-router-dom';
import { BarChart3, Shield, Triangle, ArrowRight, TrendingUp, TrendingDown, Activity, Globe, Zap, DollarSign, MapPin, LayoutGrid, User, AlertTriangle, Waves, GitBranch } from 'lucide-react';
import WaterfallChart from '@/components/charts/WaterfallChart';
import { perfWaterfallData } from '@/data/mockData';
import RiskFrontierChart from '@/components/charts/RiskFrontierChart';
import EnterpriseRiskMap, { ENTERPRISE_RISK_SCENARIOS } from '@/components/charts/EnterpriseRiskMap';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { riskMetrics, countryExposureData, sectorExposureData, nameExposureData, currencyExposureData, assetClassExposureData, CHART_COLORS } from '@/data/mockData';

// Country name to code mapping
const countryCodeMap: Record<string, string> = {
  'United States': 'US', 'United Kingdom': 'UK', 'Japan': 'JP', 'China': 'CN',
  'Germany': 'DE', 'France': 'FR', 'Canada': 'CA', 'Australia': 'AU'
};

// Ticker mapping
const tickerMap: Record<string, string> = {
  'Apple Inc.': 'AAPL', 'Microsoft Corp.': 'MSFT', 'NVIDIA Corp.': 'NVDA',
  'Amazon.com Inc.': 'AMZN', 'Alphabet Inc.': 'GOOGL', 'Meta Platforms': 'META'
};

// Sector short names
const sectorShortMap: Record<string, string> = {
  'Information Technology': 'Tech', 'Financials': 'Finance', 'Healthcare': 'Healthcare',
  'Consumer Discretionary': 'Cons. Disc.', 'Industrials': 'Industrials'
};

const tileBase = "rounded-lg border p-4 text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm transition-all duration-200";
const tilePerf = `${tileBase} bg-[hsl(var(--tile-perf)/0.08)] border-[hsl(var(--tile-perf)/0.2)] hover:bg-[hsl(var(--tile-perf)/0.15)]`;
const tileExposure = `${tileBase} bg-[hsl(var(--tile-exposure)/0.08)] border-[hsl(var(--tile-exposure)/0.2)] hover:bg-[hsl(var(--tile-exposure)/0.15)]`;
const tileRisk = `${tileBase} bg-[hsl(var(--tile-risk)/0.08)] border-[hsl(var(--tile-risk)/0.2)] hover:bg-[hsl(var(--tile-risk)/0.15)]`;
const headerPerf = `${tileBase} bg-[hsl(var(--tile-perf)/0.18)] border-[hsl(var(--tile-perf)/0.3)] hover:bg-[hsl(var(--tile-perf)/0.25)] flex flex-col items-center justify-center`;
const headerExposure = `${tileBase} bg-[hsl(var(--tile-exposure)/0.18)] border-[hsl(var(--tile-exposure)/0.3)] hover:bg-[hsl(var(--tile-exposure)/0.25)] flex flex-col items-center justify-center`;
const headerRisk = `${tileBase} bg-[hsl(var(--tile-risk)/0.18)] border-[hsl(var(--tile-risk)/0.3)] hover:bg-[hsl(var(--tile-risk)/0.25)] flex flex-col items-center justify-center`;

export default function Overview() {
  const nav = useNavigate();

  const top3Countries = countryExposureData.slice(0, 3);
  const top3Sectors = sectorExposureData.slice(0, 3);
  const top3Names = nameExposureData.slice(0, 3);
  const top3Currencies = currencyExposureData.slice(0, 3);

  // Asset class breakdown by portfolio type for overview
  const acBreakdownData = [
  { name: 'Public Equities', sp: 45.0, sa: -1.5, tp: 43.5 },
  { name: 'Fixed Income', sp: 25.0, sa: -2.2, tp: 22.8 },
  { name: 'Real Estate', sp: 10.0, sa: 2.5, tp: 12.5 },
  { name: 'Infrastructure', sp: 8.0, sa: 1.2, tp: 9.2 },
  { name: 'Private Equity', sp: 7.0, sa: 1.5, tp: 8.5 },
  { name: 'Commodities', sp: 3.0, sa: -1.0, tp: 2.0 },
  { name: 'Cash', sp: 2.0, sa: -0.5, tp: 1.5 }];

  const normalize = (entries: {name: string;val: number;}[]) => {
    const total = entries.reduce((s, e) => s + e.val, 0);
    return Object.fromEntries(entries.map((e) => [e.name, +(e.val / total * 100).toFixed(1)]));
  };
  const acBarData = [
  { portfolio: 'Strategic\nPortfolio', ...normalize(acBreakdownData.map((d) => ({ name: d.name, val: d.sp }))) },
  { portfolio: 'Strategy\nAllocation', ...normalize(acBreakdownData.map((d) => ({ name: d.name, val: Math.abs(d.sa) }))) },
  { portfolio: 'Total\nPortfolio', ...normalize(acBreakdownData.map((d) => ({ name: d.name, val: d.tp }))) }];

  const acBarCategories = acBreakdownData.map((d) => d.name);


  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-3">
      {/* Row 1: Headers — 10% */}
      <div className="grid grid-cols-3 gap-3" style={{ flex: '0 0 10%' }}>
        <div className={headerPerf} onClick={() => nav('/performance')}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Performance</h2>
          <p className="text-[9px] text-muted-foreground mt-0.5 text-center">Historical Performance Trend and Contribution</p>
        </div>
        <div className={headerExposure} onClick={() => nav('/exposure')}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Exposure</h2>
          <p className="text-[9px] text-muted-foreground mt-0.5 text-center">Current Portfolio Composition by Key Exposure Cuts</p>
        </div>
        <div className={headerRisk} onClick={() => nav('/risk')}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Risk</h2>
          <p className="text-[9px] text-muted-foreground mt-0.5">Forward Looking Portfolio Risks</p>
        </div>
      </div>

      {/* Row 2: Chart placeholders — 40% */}
      <div className="grid grid-cols-3 gap-3" style={{ flex: '0 0 40%' }}>
        <div className={`${tilePerf} flex flex-col`} onClick={() => nav('/performance')}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1">Return Attribution</p>
          <div className="flex-1 min-h-0">
            <WaterfallChart data={perfWaterfallData['1Y']} />
          </div>
        </div>
        <div className={`${tileExposure} flex flex-col`} onClick={() => nav('/exposure')}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1">Asset Class Breakdown</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={acBarData} margin={{ left: 0, right: 5, top: 5, bottom: 25 }}>
                <XAxis dataKey="portfolio" tick={{ fontSize: 8, width: 50 }} interval={0} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                {acBarCategories.map((c, i) =>
                <Bar key={c} dataKey={c} stackId="s" fill={CHART_COLORS[i % CHART_COLORS.length]} barSize={28}>
                    <LabelList
                    dataKey={c}
                    position="center"
                    formatter={(v: number) => v >= 5 ? `${v}%` : ''}
                    style={{ fontSize: 7, fill: '#fff', fontWeight: 600 }} />

                  </Bar>
                )}
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${tileRisk} flex flex-col`} onClick={() => nav('/risk')}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1">INTEGRATED RISK VIEW</p>
          <div className="flex-1 min-h-0">
            <RiskFrontierChart
              benchmarkRisk={10.2}
              portfolioTE={2.8}
              rho={-0.01}
              yLabel="Portfolio volatility (%)"
              portfolioSymbol="σ_p"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Detail cards — 50% */}
      <div className="grid grid-cols-3 gap-3 min-h-0" style={{ flex: '0 0 40%' }}>
        {/* Performance column: 2x2 grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {/* Nominal Return */}
          <div className={tilePerf} onClick={() => nav('/performance?tab=Nominal Return')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Nominal</span><span className="block">Return</span>
                </p>
                <p className="text-[11px] text-muted-foreground">1Y USD basis</p>
              </div>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Real</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-accent">7.3<span className="text-xs font-medium ml-0.5">%</span></span>
                  <svg viewBox="0 0 40 16" className="w-10 h-4 opacity-30">
                    <polyline points="0,14 6,12 12,10 18,11 24,8 30,6 36,4 40,2" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Nominal</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-accent">10.5<span className="text-xs font-medium ml-0.5">%</span></span>
                  <svg viewBox="0 0 40 16" className="w-10 h-4 opacity-30">
                    <polyline points="0,14 6,11 12,9 18,10 24,7 30,5 36,3 40,1" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Comparison */}
          <div className={tilePerf} onClick={() => nav('/performance?tab=Comparison')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Peer</span><span className="block">Comparison</span>
                </p>
                <p className="text-[11px] text-muted-foreground">75th percentile</p>
              </div>
              <Activity className="h-4 w-4 text-chart-positive" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-2 mb-1 text-chart-positive">P75</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />vs peer group</p>
          </div>
          {/* Market Return */}
          <div className={tilePerf} onClick={() => nav('/performance?tab=Market Performance')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Market</span><span className="block">Return</span>
                </p>
                <p className="text-[11px] text-muted-foreground">1Y USD benchmarks</p>
              </div>
              <Globe className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Equities</span>
                <span className="text-sm font-bold text-accent">12.5<span className="text-xs font-medium ml-0.5">%</span></span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Fixed Income</span>
                <span className="text-sm font-bold text-accent">3.2<span className="text-xs font-medium ml-0.5">%</span></span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Commodities</span>
                <span className="text-sm font-bold text-accent">4.1<span className="text-xs font-medium ml-0.5">%</span></span>
              </div>
            </div>
          </div>
          {/* Real Return */}
          <div className={tilePerf} onClick={() => nav('/performance?tab=Real Return')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Real</span><span className="block">Return</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Inflation adjusted</p>
              </div>
              <TrendingUp className="h-4 w-4 text-chart-positive" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-2 mb-1 text-chart-positive">7.3<span className="text-base font-medium ml-0.5">%</span></p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />1Y USD basis</p>
          </div>
        </div>

        {/* Exposure column: 2x2 grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {/* Country */}
          <div className={tileExposure} onClick={() => nav('/exposure?tab=country')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">Country</p>
                <p className="text-[11px] text-muted-foreground">Top 3 allocations</p>
              </div>
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 space-y-2">
              {top3Countries.map((c) =>
              <BarRow key={c.name} label={countryCodeMap[c.name] || c.name.slice(0, 2).toUpperCase()} value={c.totalPortfolio} max={50} />
              )}
            </div>
          </div>
          {/* Sector */}
          <div className={tileExposure} onClick={() => nav('/exposure?tab=sector')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">Sector</p>
                <p className="text-[11px] text-muted-foreground">Top 3 weights</p>
              </div>
              <LayoutGrid className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 space-y-2">
              {top3Sectors.map((s) =>
              <BarRow key={s.name} label={sectorShortMap[s.name] || s.name.slice(0, 8)} value={s.totalPortfolio} max={30} />
              )}
            </div>
          </div>
          {/* Currency */}
          <div className={tileExposure} onClick={() => nav('/exposure?tab=currency')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">Currency</p>
                <p className="text-[11px] text-muted-foreground">Top 3 exposures</p>
              </div>
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 space-y-2">
              {top3Currencies.map((c) =>
              <BarRow key={c.name} label={c.name} value={c.totalPortfolio} max={60} />
              )}
            </div>
          </div>
          {/* Top Holdings */}
          <div className={tileExposure} onClick={() => nav('/exposure?tab=name')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Top</span><span className="block">Holdings</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Largest names</p>
              </div>
              <User className="h-4 w-4 text-chart-positive" />
            </div>
            <div className="mt-2 space-y-1.5">
              {nameExposureData.slice(0, 3).map((h) =>
              <div key={h.name} className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold text-foreground">{tickerMap[h.name] || h.name}</span>
                  <span className="text-[10px] font-semibold text-accent">{h.totalPortfolio.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk column: 2x2 grid — mirrors Risk tab structure */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {/* Absolute Risk */}
          <div className={tileRisk} onClick={() => nav('/risk?tab=Absolute Risk')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Absolute</span><span className="block">Risk</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Total Vol (P)</p>
              </div>
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-2 mb-1 text-accent">11.5<span className="text-base font-medium ml-0.5">%</span></p>
            <p className="text-[11px] text-muted-foreground">vs 10.2% Benchmark</p>
          </div>
          {/* Active Risk */}
          <div className={tileRisk} onClick={() => nav('/risk?tab=Active Risk')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Active</span><span className="block">Risk</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Tracking Error</p>
              </div>
              <GitBranch className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-2 mb-1 text-accent">2.8<span className="text-base font-medium ml-0.5">%</span></p>
            <p className="text-[11px] text-muted-foreground">vs Benchmark</p>
          </div>
          {/* Other Risk Metrics */}
          <div className={tileRisk} onClick={() => nav('/risk?tab=Other Risk Metrics')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Other Risk</span><span className="block">Metrics</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Leverage & Liquidity</p>
              </div>
              <Waves className="h-4 w-4 text-chart-positive" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Ext. Leverage</span>
                <span className="text-base font-bold text-accent">1.54<span className="text-xs font-medium ml-0.5">x</span></span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground">Liquidity Cov.</span>
                <span className="text-base font-bold text-accent">2.19<span className="text-xs font-medium ml-0.5">x</span></span>
              </div>
            </div>
          </div>
          {/* Enterprise Risk Map */}
          <div className={`${tileRisk} flex flex-col`} onClick={() => nav('/risk?tab=Enterprise Risk Map')}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground leading-tight">
                  <span className="block">Enterprise</span><span className="block">Risk Map</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Likelihood × impact</p>
              </div>
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-h-0 -mx-1">
              <EnterpriseRiskMap data={ENTERPRISE_RISK_SCENARIOS} compact height={120} />
            </div>
          </div>
        </div>
      </div>
    </div>);

}

/* Reusable bar row for exposure cards */
function BarRow({ label, value, max }: {label: string;value: number;max: number;}) {
  const pct = Math.min(value / max * 100, 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-semibold text-foreground w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-bold text-foreground w-8 text-right">{value}%</span>
    </div>);

}