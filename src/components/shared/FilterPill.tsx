import { cn } from '@/lib/utils';

type PillVariant = 'period' | 'currency' | 'breakdown';

const variantStyles: Record<PillVariant, string> = {
  period: 'bg-muted-foreground/10 border-muted-foreground/30 text-muted-foreground',
  currency: 'bg-muted-foreground/10 border-muted-foreground/30 text-muted-foreground',
  breakdown: 'bg-accent/10 border-accent/30 text-accent',
};

interface Props {
  label: string;
  value: string;
  variant: PillVariant;
  className?: string;
}

export default function FilterPill({ label, value, variant, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium leading-tight',
      variantStyles[variant],
      className
    )}>
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
