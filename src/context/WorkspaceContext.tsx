import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface SavedChart {
  id: string;
  title: string;
  component: ReactNode;
  position: { x: number; y: number };
  size: { w: number; h: number };
  zIndex: number;
  inDock: boolean;
}

interface WorkspaceCtx {
  charts: SavedChart[];
  saveChart: (id: string, title: string, component: ReactNode) => void;
  removeChart: (id: string) => void;
  clearAll: () => void;
  isChartSaved: (id: string) => boolean;
  moveChart: (id: string, pos: { x: number; y: number }) => void;
  bringToFront: (id: string) => void;
  placeOnCanvas: (id: string) => void;
  returnToDock: (id: string) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);
export const useWorkspace = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWorkspace must be within WorkspaceProvider');
  return c;
};

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [nextZ, setNextZ] = useState(1);

  const saveChart = useCallback((id: string, title: string, component: ReactNode) => {
    setCharts(prev => {
      if (prev.find(c => c.id === id)) return prev.filter(c => c.id !== id);
      return [...prev, { id, title, component, position: { x: 100 + prev.length * 30, y: 100 + prev.length * 30 }, size: { w: 500, h: 350 }, zIndex: nextZ, inDock: true }];
    });
    setNextZ(z => z + 1);
  }, [nextZ]);

  const removeChart = useCallback((id: string) => setCharts(p => p.filter(c => c.id !== id)), []);
  const clearAll = useCallback(() => setCharts([]), []);
  const isChartSaved = useCallback((id: string) => charts.some(c => c.id === id), [charts]);

  const moveChart = useCallback((id: string, pos: { x: number; y: number }) => {
    setCharts(p => p.map(c => c.id === id ? { ...c, position: pos } : c));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setNextZ(z => {
      setCharts(p => p.map(c => c.id === id ? { ...c, zIndex: z } : c));
      return z + 1;
    });
  }, []);

  const placeOnCanvas = useCallback((id: string) => {
    setCharts(p => p.map(c => c.id === id ? { ...c, inDock: false } : c));
  }, []);

  const returnToDock = useCallback((id: string) => {
    setCharts(p => p.map(c => c.id === id ? { ...c, inDock: true } : c));
  }, []);

  return <Ctx.Provider value={{ charts, saveChart, removeChart, clearAll, isChartSaved, moveChart, bringToFront, placeOnCanvas, returnToDock }}>{children}</Ctx.Provider>;
};
