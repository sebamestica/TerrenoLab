import React from 'react';
import { Grid, ArrowRight, Layers, Cpu, AlertTriangle, XCircle } from 'lucide-react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { SurfaceQAResult } from '../../domain/terrain/surfaceQA';
import { SurfaceRasterViewer } from '../../components/viewers/SurfaceRasterViewer';
import { Button } from '../../components/ui/Button';

interface SurfaceViewProps {
  points: TerrainPoint[];
  metrics: TerrainMetrics | null;
  surface: IDWSurfaceResult | null;
  surfaceQA: SurfaceQAResult | null;
  isProcessing: boolean;
  onGenerateSurface: () => void;
  onProceed: () => void;
  showPoints: boolean;
  setShowPoints: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  viewerMode: 'light' | 'technical';
  setViewerMode: (mode: 'light' | 'technical') => void;
  hideLocalLayerControls?: boolean;
}

export function SurfaceView({
  points,
  metrics,
  surface,
  surfaceQA,
  isProcessing,
  onGenerateSurface,
  onProceed,
  showPoints,
  setShowPoints,
  showGrid,
  setShowGrid,
  viewerMode,
  setViewerMode,
  hideLocalLayerControls = false,
}: SurfaceViewProps) {
  
  // Render floating warning or blocker banners on top of the raster canvas
  const renderAlertBanners = () => {
    if (!surface || !surfaceQA) return null;
    
    const { blockers, warnings } = surfaceQA;
    
    if (blockers.length > 0) {
      return (
        <div className="absolute top-4 left-4 right-4 bg-red-50/95 border border-red-200 text-red-800 p-3 rounded shadow-md text-[12.5px] flex items-start gap-2.5 max-w-2xl backdrop-blur-sm z-10">
          <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <strong className="block text-red-950 font-bold uppercase tracking-wide text-[10px]">
              Errores Críticos en Superficie (Bloqueante)
            </strong>
            <ul className="list-disc pl-4 space-y-0.5 text-red-900 leading-normal">
              {blockers.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    if (warnings.length > 0) {
      return (
        <div className="absolute top-4 left-4 right-4 bg-amber-50/95 border border-amber-200 text-amber-800 p-3 rounded shadow-md text-[12.5px] flex items-start gap-2.5 max-w-2xl backdrop-blur-sm z-10">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <strong className="block text-amber-950 font-bold uppercase tracking-wide text-[10px]">
              Advertencias de Superficie
            </strong>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-900 leading-normal">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Render main viewport contents depending on surface computation status
  const renderViewport = () => {
    if (isProcessing) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-8 select-none">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#06b6d4]/20 border-t-[#06b6d4] animate-spin" />
              <Cpu size={24} className="text-[#06b6d4] animate-pulse" />
            </div>
            <h3 className="text-[15px] font-sans font-bold text-slate-200">
              Procesando interpolación IDW...
            </h3>
            <p className="text-[12px] text-slate-400 font-mono">
              Calculando alturas de la malla de terreno...
            </p>
          </div>
        </div>
      );
    }

    if (!surface) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 select-none">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-md p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mx-auto text-[#0891B2]">
              <Cpu size={24} />
            </div>
            <h3 className="text-[16px] font-sans font-bold text-slate-800">
              Generar Superficie Continua
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed font-sans">
              Interpole la nube de puntos mediante el algoritmo IDW (Inverse Distance Weighting) para crear un modelo de elevación digital continuo en 2D.
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={onGenerateSurface} className="w-full justify-center">
                <Cpu size={14} className="mr-1.5" />
                Generar Superficie
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <SurfaceRasterViewer
        points={points}
        surface={surface}
        showPoints={showPoints}
        showGrid={showGrid}
        viewerMode={viewerMode}
      />
    );
  };

  const hasBlockers = surfaceQA ? surfaceQA.blockers.length > 0 : false;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-white">
      {/* Viewer controls bar */}
      <div className="h-11 border-b border-[#E2E8F0] bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[13px] font-sans">
          {!hideLocalLayerControls && (
            <>
              <span className="text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono text-[12px]">
                <Layers size={14} className="text-[#0891B2]" />
                Capas Activas:
              </span>
              <label className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                  disabled={isProcessing || !surface}
                  className="accent-[#0891B2] rounded disabled:opacity-50"
                />
                Nube Puntos
              </label>
              <label className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  disabled={isProcessing || !surface}
                  className="accent-[#0891B2] rounded disabled:opacity-50"
                />
                Superficie Heatmap ({surface ? `${surface.resolution}x${surface.resolution}` : '---'})
              </label>
              <label className="flex items-center gap-1.5 text-[#94A3B8] cursor-not-allowed" title="Curvas no generadas todavía">
                <input type="checkbox" disabled className="rounded" />
                Curvas Nivel (No generadas)
              </label>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {surface && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[#64748B] text-[11px] font-mono uppercase font-bold">Modo Visor:</span>
              <select
                value={viewerMode}
                onChange={(e) => setViewerMode(e.target.value as 'light' | 'technical')}
                className="text-[12px] font-semibold bg-white border border-[#CBD5E1] rounded px-2 py-0.5 outline-none cursor-pointer text-[#0F172A]"
              >
                <option value="light">Claro</option>
                <option value="technical">Técnico</option>
              </select>
            </div>
          )}
          <span className="font-mono text-[12px] text-[#64748B]">
            Visualización de Superficie Interpolada 2D
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {renderAlertBanners()}
        {renderViewport()}
      </div>

      {/* Bottom control bar */}
      <div className="h-14 border-t border-[#E2E8F0] bg-white px-6 flex items-center justify-between shrink-0">
        <div className="text-[13px] font-sans text-[#64748B] flex items-center gap-2">
          <Grid size={14} className="text-[#06B6D4]" />
          <span>Configure la resolución y exponente IDW en el inspector derecho.</span>
        </div>
        <Button 
          variant="primary" 
          disabled={!surface || hasBlockers} 
          onClick={onProceed}
          title={
            !surface
              ? "Debe generar la superficie primero."
              : hasBlockers
                ? "El cálculo de curvas está bloqueado debido a errores críticos de la superficie."
                : "Avanzar a la generación de curvas de nivel."
          }
        >
          Generar curvas
          <ArrowRight size={12} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
