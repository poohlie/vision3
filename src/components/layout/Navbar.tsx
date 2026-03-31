import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';

const tabs = [
  { label: 'Overview', path: '/' },
  { label: 'Performance', path: '/performance' },
  { label: 'Exposure', path: '/exposure' },
  { label: 'Risk', path: '/risk' },
  { label: 'Workspace', path: '/workspace' },
];

export default function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const { charts } = useWorkspace();
  const dockCount = charts.filter(c => c.inDock).length;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold tracking-tight text-primary mr-6">Portfolio Analytics</span>
          {tabs.map(t => (
            <button
              key={t.path}
              onClick={() => nav(t.path)}
              className={cn(
                'px-4 py-3.5 text-sm font-medium transition-colors relative',
                loc.pathname === t.path ? 'nav-active' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {t.label === 'Workspace' && dockCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                  {dockCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-sm">
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(date, 'dd MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
