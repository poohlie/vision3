import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { X, Trash2, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Workspace() {
  const { charts, removeChart, clearAll, moveChart, bringToFront, placeOnCanvas, returnToDock } = useWorkspace();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingChart, setDraggingChart] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const dockCharts = charts.filter(c => c.inDock);
  const canvasCharts = charts.filter(c => !c.inDock);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('grid-dot-bg')) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    if (draggingChart) {
      moveChart(draggingChart, {
        x: (e.clientX - dragOffset.x - pan.x) / zoom,
        y: (e.clientY - dragOffset.y - pan.y) / zoom,
      });
    }
  }, [isPanning, dragStart, draggingChart, dragOffset, pan, zoom, moveChart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingChart(null);
  }, []);

  const handleChartMouseDown = useCallback((e: React.MouseEvent, chartId: string) => {
    e.stopPropagation();
    bringToFront(chartId);
    const chart = charts.find(c => c.id === chartId);
    if (chart) {
      setDraggingChart(chartId);
      setDragOffset({
        x: e.clientX - chart.position.x * zoom - pan.x,
        y: e.clientY - chart.position.y * zoom - pan.y,
      });
    }
  }, [charts, zoom, pan, bringToFront]);

  if (charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No charts pinned yet</p>
          <p className="text-sm">Pin charts from Performance, Exposure, or Risk tabs to build your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={canvasRef}
          className="grid-dot-bg absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '4000px',
            height: '4000px',
          }}
        >
          {canvasCharts.map(chart => (
            <div
              key={chart.id}
              className="absolute chart-card-glass shadow-lg hover:shadow-xl transition-shadow"
              style={{
                left: chart.position.x,
                top: chart.position.y,
                width: chart.size.w,
                height: chart.size.h,
                zIndex: chart.zIndex,
              }}
              onMouseDown={e => handleChartMouseDown(e, chart.id)}
            >
              <div className="flex items-center justify-between p-2 border-b cursor-move bg-muted/30 rounded-t-lg">
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold truncate">{chart.title}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => returnToDock(chart.id)} className="p-0.5 hover:bg-muted rounded" title="Return to dock">
                    <Minimize2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => removeChart(chart.id)} className="p-0.5 hover:bg-destructive/20 rounded" title="Remove">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="p-3 overflow-auto" style={{ height: chart.size.h - 40 }}>
                {chart.component}
              </div>
            </div>
          ))}
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-20 right-4 bg-card/90 border rounded-md px-2 py-1 text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Dock */}
      {dockCharts.length > 0 && (
        <div className="border-t bg-card/95 backdrop-blur-sm px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Dock:</span>
            {dockCharts.map(chart => (
              <button
                key={chart.id}
                onClick={() => placeOnCanvas(chart.id)}
                className="shrink-0 px-3 py-1.5 rounded-md border bg-muted/50 text-xs font-medium hover:bg-accent/10 transition-colors flex items-center gap-1.5"
                title="Click to place on canvas"
              >
                <Maximize2 className="h-3 w-3" />
                {chart.title}
                <button
                  onClick={e => { e.stopPropagation(); removeChart(chart.id); }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            ))}
            <div className="ml-auto shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Clear All
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all charts?</AlertDialogTitle>
                    <AlertDialogDescription>This will remove all pinned charts from your workspace. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAll}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
