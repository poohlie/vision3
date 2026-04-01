import { cn } from '@/lib/utils';

const options = [3, 5, 8, 10] as const;

interface Props {
  value: number;
  onChange: (n: number) => void;
}

export default function TopNSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-8 rounded-full bg-accent" />
      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Top</span>
      <div className="flex rounded-md border bg-muted/50 p-0.5 gap-0.5">
        {options.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              'px-1.5 py-0.5 text-[10px] rounded-sm font-medium transition-all border',
              value === n
                ? 'bg-card text-foreground shadow-sm border-border'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
