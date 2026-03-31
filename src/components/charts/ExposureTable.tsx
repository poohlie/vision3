import { cn } from '@/lib/utils';

interface Row { name: string; benchmark: number; totalPortfolio: number; }

interface Props {
  data: Row[];
  onRowClick?: (name: string) => void;
  selectedRow?: string;
}

export default function ExposureTable({ data, onRowClick, selectedRow }: Props) {
  return (
    <div className="overflow-auto text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 px-2 font-medium">Component</th>
            <th className="text-center py-2 px-2 font-medium">Benchmark</th>
            <th className="text-center py-2 px-2 font-medium">Active Tilt</th>
            <th className="text-center py-2 px-2 font-medium">Total Portfolio</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => {
            const tilt = +(r.totalPortfolio - r.benchmark).toFixed(1);
            return (
              <tr
                key={r.name}
                onClick={() => onRowClick?.(r.name)}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  selectedRow === r.name && 'bg-accent/10'
                )}
              >
                <td className="py-1.5 px-2 font-medium">{r.name}</td>
                <td className="py-1.5 px-2 text-center">{r.benchmark.toFixed(1)}%</td>
                <td className={cn('py-1.5 px-2 text-center font-medium', tilt >= 0 ? 'text-chart-positive' : 'text-chart-negative')}>
                  {tilt >= 0 ? '+' : ''}{tilt.toFixed(1)}%
                </td>
                <td className="py-1.5 px-2 text-center">{r.totalPortfolio.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-semibold border-t-2">
            <td className="py-1.5 px-2">Total</td>
            <td className="py-1.5 px-2 text-center">{data.reduce((s, r) => s + r.benchmark, 0).toFixed(1)}%</td>
            <td className="py-1.5 px-2 text-center">{(data.reduce((s, r) => s + r.totalPortfolio - r.benchmark, 0)).toFixed(1)}%</td>
            <td className="py-1.5 px-2 text-center">{data.reduce((s, r) => s + r.totalPortfolio, 0).toFixed(1)}%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
