import { cn } from '@/lib/utils';
import { timespans } from '@/data/mockData';
import { GitCompareArrows } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
  locked?: string; // timespan that cannot be deselected (global period)
}

export default function TimespanMultiSelect({ selected, onChange, max = 3, locked }: Props) {
  const toggle = (ts: string) => {
    if (selected.includes(ts)) {
      if (ts === locked) return; // cannot deselect the global timespan
      if (selected.length > 1) onChange(selected.filter(s => s !== ts));
    } else if (selected.length < max) {
      onChange([...selected, ts]);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <GitCompareArrows className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Compare</span>
      <div className="flex rounded-md border bg-muted/50 p-0.5 gap-0.5">
        {timespans.map(ts => (
          <button
            key={ts}
            onClick={() => toggle(ts)}
            className={cn(
              'px-1.5 py-0.5 text-[10px] rounded-sm font-medium transition-all border',
              selected.includes(ts)
                ? ts === locked
                  ? 'bg-primary text-primary-foreground shadow-sm border-primary/50'
                  : 'bg-accent text-accent-foreground shadow-sm border-accent/50'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {ts}
          </button>
        ))}
      </div>
      {selected.length > 1 && (
        <span className="text-[9px] text-accent font-medium">{selected.length} selected</span>
      )}
    </div>
  );
}
