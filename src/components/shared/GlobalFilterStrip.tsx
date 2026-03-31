import ToggleBar from './ToggleBar';
import TopNSelect from './TopNSelect';
import { timespans, currencies } from '@/data/mockData';
import { SlidersHorizontal } from 'lucide-react';

const breakdowns = ['Active Strategies', 'Country', 'Sector'] as const;

interface GlobalFilters {
  timespan: string;
  currency: string;
  breakdown: string;
  topN: number;
}

interface Props {
  filters: GlobalFilters;
  onChange: (f: GlobalFilters) => void;
  showBreakdown?: boolean;
  showTopN?: boolean;
}

export type { GlobalFilters };

export default function GlobalFilterStrip({ filters, onChange, showBreakdown = true, showTopN = true }: Props) {
  const set = (partial: Partial<GlobalFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Filters</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Period</span>
        <ToggleBar options={timespans} value={filters.timespan as any} onChange={v => set({ timespan: v })} size="xs" />
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Currency</span>
        <ToggleBar options={currencies} value={filters.currency as any} onChange={v => set({ currency: v })} size="xs" />
      </div>
      {showBreakdown && (
        <>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">By</span>
            <ToggleBar options={breakdowns} value={filters.breakdown as any} onChange={v => set({ breakdown: v })} size="xs" />
          </div>
        </>
      )}
      {showTopN && (
        <>
          <div className="w-px h-5 bg-border" />
          <TopNSelect value={filters.topN} onChange={n => set({ topN: n })} />
        </>
      )}
    </div>
  );
}
