import { cn } from '@/lib/utils';

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'xs';
}

export default function ToggleBar<T extends string>({ options, value, onChange, size = 'sm' }: Props<T>) {
  return (
    <div className="flex rounded-md border bg-muted/50 p-0.5 gap-0.5">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-sm transition-all font-medium border',
            size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
            value === o
              ? 'bg-card text-foreground shadow-sm border-border'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
