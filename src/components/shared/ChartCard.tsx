import { cn } from '@/lib/utils';
import { Pin, PinOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface ChartTag {
  label: string;
  color?: 'primary' | 'muted' | 'accent';
}

interface Props {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  tags?: ChartTag[];
}

export default function ChartCard({ id, title, subtitle, children, toolbar, className, tags }: Props) {
  const { saveChart, isChartSaved } = useWorkspace();
  const saved = isChartSaved(id);

  return (
    <div className={cn('chart-card-glass p-4 flex flex-col animate-fade-in relative', className)}>
      <button
        onClick={(e) => { e.stopPropagation(); saveChart(id, title, children); }}
        className={cn(
          'absolute top-2 right-2 p-1.5 rounded-md transition-colors z-10',
          saved ? 'text-accent hover:text-accent/80' : 'text-muted-foreground/40 hover:text-muted-foreground'
        )}
        title={saved ? 'Remove from workspace' : 'Pin to workspace'}
      >
        {saved ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </button>
      <div className="flex items-start justify-between mb-3 gap-2 pr-7">
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {toolbar && <div className="flex items-center gap-2 flex-shrink-0">{toolbar}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      {tags && tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
          {tags.map((tag, i) => (
            <span key={i} className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded border',
              tag.color === 'primary' && 'text-primary border-primary/40 bg-primary/5',
              tag.color === 'accent' && 'text-accent border-accent/40 bg-accent/5',
              tag.color === 'muted' && 'text-muted-foreground border-muted-foreground/30 bg-muted/30',
              !tag.color && 'text-primary border-primary/40 bg-primary/5',
            )}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
