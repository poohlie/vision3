import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import ChartCard from '@/components/shared/ChartCard';
import ToggleBar from '@/components/shared/ToggleBar';
import FinancialBarChart from '@/components/charts/FinancialBarChart';
import GroupedBarChart from '@/components/charts/GroupedBarChart';
import StackedTimeChart from '@/components/charts/StackedTimeChart';
import WaterfallChart from '@/components/charts/WaterfallChart';
import {
  countryExposureData, sectorExposureData, nameExposureData,
  currencyExposureData, assetClassExposureData, exposureTimeSeries,
  getExposureWaterfall, exposureWaterfallTimeSeries, getExposureBreakdown,
} from '@/data/mockData';

const exposureTabs = [
  { key: 'country', label: 'Country', metric: '42.1%', metricLabel: 'US', subtitle: 'Largest allocation', data: countryExposureData },
  { key: 'sector', label: 'Sector', metric: '24.2%', metricLabel: 'IT', subtitle: 'Top sector weight', data: sectorExposureData },
  { key: 'name', label: 'Name', metric: '5.2%', metricLabel: 'AAPL', subtitle: 'Top holding', data: nameExposureData },
  { key: 'currency', label: 'Currency', metric: '83%', metricLabel: 'DM', subtitle: 'Developed markets', data: currencyExposureData },
  { key: 'asset', label: 'Asset Class', metric: '44%', metricLabel: 'Equities', subtitle: 'Largest asset class', data: assetClassExposureData },
] as const;

type TabKey = typeof exposureTabs[number]['key'];

const viewToggles = ['Strategic Portfolio', 'Active Tilt', 'Total Portfolio'] as const;
const periodToggles = ['1Y', '5Y', '10Y'] as const;
const periodDescriptions: Record<string, string> = { '1Y': 'Monthly', '5Y': 'Quarterly', '10Y': 'Yearly' };

const groupByOptions: Record<string, readonly string[]> = {
  country: ['Sector', 'Asset Class', 'Currency', 'Name'],
  sector: ['Country', 'Asset Class', 'Currency', 'Name'],
  name: ['Country', 'Sector', 'Asset Class', 'Currency'],
  currency: ['Country', 'Sector', 'Asset Class', 'Name'],
  asset: ['Country', 'Sector', 'Currency', 'Name'],
};

export default function Exposure() {
  const [searchParams] = useSearchParams();
  const initialTab = exposureTabs.find(t => t.key === searchParams.get('tab'))?.key || 'country';
  const [tab, setTab] = useState<TabKey>(initialTab);
  const activeTab = exposureTabs.find(t => t.key === tab)!;
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [view, setView] = useState<string>('Total Portfolio');
  const [period, setPeriod] = useState<string>('1Y');
  const [groupBy, setGroupBy] = useState<string>('Sector');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const allItems = activeTab.data.map(d => d.name);

  const toggleFilter = (name: string) => {
    setSelectedFilters(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  // Effective filter: default to first item if nothing selected
  const activeFilters = selectedFilters.length > 0 ? selectedFilters : [allItems[0]];
  const waterfallItem = activeFilters[0];

  const timeSeries = exposureTimeSeries(activeTab.data.slice(0, 6), period);
  const tsCats = activeTab.data.slice(0, 6).map(d =>
    view === 'Strategic Portfolio' ? `${d.name}_bm` : `${d.name}_tp`
  );

  // Waterfall for first selected filter
  const waterfallMatch = activeTab.data.find(d => d.name === waterfallItem);
  const waterfallData = waterfallMatch
    ? getExposureWaterfall(tab, waterfallItem, waterfallMatch.benchmark, waterfallMatch.totalPortfolio)
    : [];
  const waterfallTrendData = waterfallMatch
    ? exposureWaterfallTimeSeries(waterfallMatch.benchmark, waterfallMatch.totalPortfolio, period)
    : [];
  const waterfallTrendCategories = ['Strategic Benchmark', 'SAA Tilt', 'Active Mgmt'];

  // Breakdown data for row 3 — uses all selected filters, broken down by groupBy dimension
  const breakdownData = useMemo(() => {
    return activeFilters.flatMap(filterName => {
      const item = activeTab.data.find(d => d.name === filterName);
      if (!item) return [];
      const totalValue = view === 'Strategic Portfolio' ? item.benchmark
        : view === 'Active Tilt' ? +(item.totalPortfolio - item.benchmark).toFixed(1)
        : item.totalPortfolio;
      const breakdown = getExposureBreakdown(filterName, totalValue, groupBy);
      // If multiple filters, prefix with filter name
      if (activeFilters.length > 1) {
        return breakdown.map(d => ({ name: `${filterName} · ${d.name}`, value: d.value }));
      }
      return breakdown;
    }).sort((a, b) => b.value - a.value);
  }, [activeFilters, activeTab.data, view, groupBy]);

  const filterLabel = activeFilters.length > 2
    ? `${activeFilters.slice(0, 2).join(', ')} +${activeFilters.length - 2}`
    : activeFilters.join(', ');

  return (
    <div className="p-6 space-y-4">
      {/* Tab cards */}
      <div className="grid grid-cols-5 gap-4">
        {exposureTabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedFilters([]); }}
            className={cn(
              'rounded-lg border p-4 text-left transition-all',
              tab === t.key ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card hover:bg-muted/50'
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider">{t.label}</p>
            <p className={cn(
              'text-2xl font-bold tracking-tight mt-2',
              tab === t.key ? 'text-primary-foreground' : 'text-accent'
            )}>{t.metric}</p>
            <p className={cn(
              'text-[11px] mt-1',
              tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>{t.metricLabel} · {t.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Global controls bar */}
      <div className="grid grid-cols-2 gap-3">
        {/* View parameter */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-primary" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">View</span>
                <p className="text-[9px] text-muted-foreground">All charts · Rows 1 &amp; 3</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={viewToggles} value={view as any} onChange={setView} size="sm" />
          </div>
        </div>

        {/* Period parameter */}
        <div className="rounded-lg border-2 border-muted-foreground/20 bg-muted/30 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1 h-8 rounded-full bg-muted-foreground/50" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Period</span>
                <p className="text-[9px] text-muted-foreground">Trend charts only →</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border shrink-0" />
            <ToggleBar options={periodToggles} value={period as any} onChange={setPeriod} size="sm" />
            <span className="text-[9px] text-muted-foreground font-medium">({periodDescriptions[period]})</span>
          </div>
        </div>
      </div>

      {/* Row 1: Overview charts — bordered by View (primary) */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/20 pl-3 ml-1">
        <ChartCard id={`exp-${tab}-1`} title={`${activeTab.label} Breakdown`} tags={[view]}>
          {(tab === 'country' || tab === 'currency') ? (
            <GroupedBarChart
              data={(tab === 'country' ? countryExposureData : currencyExposureData).map(d => ({
                name: d.name,
                value: view === 'Strategic Portfolio' ? d.benchmark
                  : view === 'Active Tilt' ? +(d.totalPortfolio - d.benchmark).toFixed(1)
                  : d.totalPortfolio,
                group: d.market,
              }))}
              colorByValue={view === 'Active Tilt'}
              height={320}
            />
          ) : (
            <FinancialBarChart
              data={activeTab.data.map(d => ({
                name: d.name,
                value: view === 'Strategic Portfolio' ? d.benchmark
                  : view === 'Active Tilt' ? +(d.totalPortfolio - d.benchmark).toFixed(1)
                  : d.totalPortfolio,
              }))}
              colorByValue={view === 'Active Tilt'}
              barColor="hsl(212, 72%, 42%)"
            />
          )}
        </ChartCard>
        <ChartCard id={`exp-${tab}-2`} title={`${activeTab.label} Over Time`} tags={[view, period]}>
          <StackedTimeChart data={timeSeries} categories={tsCats} height={380} />
        </ChartCard>
      </div>

      {/* Filter bar — controls rows 2 & 3 */}
      <div className="relative rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1 h-8 rounded-full bg-accent" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {activeTab.label} Filter
              </span>
              <p className="text-[9px] text-muted-foreground">Applies to rows 2 &amp; 3 below ↓</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border shrink-0" />

          {/* Selected pills */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {activeFilters.map(name => (
              <button
                key={name}
                onClick={() => toggleFilter(name)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border',
                  selectedFilters.includes(name)
                    ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                    : 'bg-accent/20 text-foreground border-accent/30'
                )}
              >
                {name}
                {selectedFilters.includes(name) && <X className="w-3 h-3" />}
              </button>
            ))}
            {selectedFilters.length === 0 && (
              <span className="text-[10px] text-muted-foreground italic ml-1">Default: {allItems[0]}</span>
            )}
          </div>

          {/* Add filter dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              + Add {activeTab.label}
            </button>
            {filterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-card shadow-lg p-1.5 max-h-64 overflow-auto">
                  {allItems.map(name => (
                    <button
                      key={name}
                      onClick={() => toggleFilter(name)}
                      className={cn(
                        'w-full text-left rounded-md px-3 py-1.5 text-[11px] transition-colors',
                        selectedFilters.includes(name)
                          ? 'bg-accent/15 text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <span className="flex items-center justify-between">
                        {name}
                        {selectedFilters.includes(name) && <span className="text-accent">✓</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Waterfall — bordered by Filter (accent) */}
      <div className="grid grid-cols-2 gap-4 border-l-2 border-accent/20 pl-3 ml-1">
        <ChartCard id={`exp-${tab}-wf`} title={`${waterfallItem} — Exposure Waterfall`} tags={[waterfallItem]}>
          <WaterfallChart data={waterfallData} height={280} />
        </ChartCard>
        <ChartCard id={`exp-${tab}-wf-ts`} title={`${waterfallItem} — Waterfall Over Time`} tags={[waterfallItem, period]}>
          <StackedTimeChart
            data={waterfallTrendData}
            categories={waterfallTrendCategories}
            height={280}
          />
        </ChartCard>
      </div>

      {/* Row 3: Breakdown — bordered by BOTH (gradient left border) */}
      <div className="relative grid grid-cols-2 gap-4 pl-3 ml-1">
        {/* Dual left border to show both View + Filter apply */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
          style={{ background: 'linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--accent)))' }}
        />
        <ChartCard id={`exp-${tab}-3`} title={`${filterLabel} — ${groupBy} Breakdown`} tags={[view, filterLabel]} toolbar={
          <ToggleBar options={groupByOptions[tab] as any} value={groupBy as any} onChange={setGroupBy} size="xs" />
        }>
          <FinancialBarChart data={breakdownData} colorByValue={view === 'Active Tilt'} barColor="hsl(212, 72%, 42%)" />
        </ChartCard>
        <ChartCard id={`exp-${tab}-4`} title={`${filterLabel} — ${groupBy} Over Time`}>
          <StackedTimeChart data={timeSeries} categories={tsCats.slice(0, 4)} height={320} />
        </ChartCard>
      </div>
    </div>
  );
}
