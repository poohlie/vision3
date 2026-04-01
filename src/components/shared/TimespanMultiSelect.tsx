import { cn } from '@/lib/utils';
import { timespans } from '@/data/mockData';


interface Props {
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
  locked?: string; // primary timespan that can't be deselected
}

export default function TimespanMultiSelect({ selected, onChange, max = 3, locked }: Props) {
  const toggle = (ts: string) => {
    if (ts === locked) return; // can't deselect the locked/primary timespan
    if (selected.includes(ts)) {
      if (selected.length > 1) onChange(selected.filter(s => s !== ts));
    } else if (selected.length < max) {
      onChange([...selected, ts]);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-md border bg-muted/50 p-0.5 gap-0.5">
        {timespans.map(ts => (
          <button
            key={ts}
            onClick={() => toggle(ts)}
            className={cn(
              'px-1.5 py-0.5 text-[10px] rounded-sm font-medium transition-all border',
              selected.includes(ts)
                ? 'bg-accent text-accent-foreground shadow-sm border-accent/50'
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
