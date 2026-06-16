import React from 'react';
import { Spline, ArrowRight, Layers, Cpu, AlertTriangle, AlertOctagon } from 'lucide-react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { SurfaceQAResult } from '../../domain/terrain/surfaceQA';
import { ContourResult } from '../../domain/terrain/contours';
import { ContourQAResult } from '../../domain/terrain/contourQA';
import { ContourViewer } from '../../components/viewers/ContourViewer';
import { Button } from '../../components/ui/Button';

interface ContoursViewProps {
  points: TerrainPoint[];
  metrics: TerrainMetrics | null;
  surface: IDWSurfaceResult | null;
  surfaceQA: SurfaceQAResult | null;
  contours: ContourResult | null;
  contourQA?: ContourQAResult | null;
  isProcessing: boolean;
  onGenerateContours: (interval: number, includeIndex: boolean, indexEvery: number) => void;
  onProceed: () => void;
  
  // Parameter bindings
  contourInterval: number;
  setContourInterval: (val: number) => void;
  includeIndexContours: boolean;
  setIncludeIndexContours: (val: boolean) => void;
  indexEvery: number;
  setIndexEvery: (val: number) => void;

  // Hook bindings from parent to inspector
  showPoints: boolean;
  setShowPoints: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  showContours: boolean;
  setShowContours: (val: boolean) => void;

  viewerMode: 'light' | 'technical';
  setViewerMode: (mode: 'light' | 'technical') => void;
}

export function ContoursView({
  points,
  metrics,
  surface,
  surfaceQA,
  contours,
  contourQA,
  isProcessing,
  onGenerateContours,
  onProceed,
  contourInterval,
  setContourInterval,
  includeIndexContours,
  setIncludeIndexContours,
  indexEvery,
  setIndexEvery,
  showPoints,
  setShowPoints,
  showGrid,
  setShowGrid,
  showContours,
  setShowContours,
  viewerMode,
  setViewerMode,
}: ContoursViewProps) {
  
  const handleGenerate = () => {
    onGenerateContours(contourInterval, includeIndexContours, indexEvery);
  };

  // Render view states
  if (!surface) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 select-none font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
            <AlertOctagon size={24} />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800">No hay superficie generada</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Debe generar primero una superficie de interpolación IDW estable antes de trazar las curvas de nivel.
          </p>
        </div>
      </div>
    );
  }

  if (surfaceQA && surfaceQA.blockers.length > 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 select-none font-sans">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
            <XCircleIcon size={24} />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 text-red-700">Superficie No Apta para Curvas</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            La superficie generada contiene errores de QA críticos y no se permite continuar.
          </p>
          <div className="bg-red-50 border border-red-100 text-red-800 text-[12px] p-3 rounded text-left space-y-1">
            <strong className="block text-red-900">Errores bloqueantes:</strong>
            <ul className="list-disc pl-4 space-y-0.5">
              {surfaceQA.blockers.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-8 select-none font-sans">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#06b6d4]/20 border-t-[#06b6d4] animate-spin" />
            <Cpu size={24} className="text-[#06b6d4] animate-pulse" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-200">
            Delineando curvas con Marching Squares...
          </h3>
          <p className="text-[12px] text-slate-400 font-mono">
            Analizando intersecciones y cruces en la grilla regular...
          </p>
        </div>
      </div>
    );
  }

  // Render before-curves setup panel
  if (!contours) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 select-none font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-md p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mx-auto text-[#0891B2]">
              <Spline size={24} />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800">
              Configurar Curvas de Nivel
            </h3>
            <p className="text-[12.5px] text-slate-500 leading-relaxed">
              Defina los parámetros para delinear las isolíneas físicas sobre la superficie interpolada.
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4">
            {/* Equidistance Selector */}
            <div className="space-y-1">
              <label className="text-[12px] text-slate-600 font-semibold block">Equidistancia (Intervalo):</label>
              <select
                value={contourInterval}
                onChange={(e) => setContourInterval(parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded p-2 text-[13px] text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
              >
                <option value="0.5">0.5 m (Alta Densidad)</option>
                <option value="1">1.0 m (Detallado)</option>
                <option value="2">2.0 m (Normal)</option>
                <option value="5">5.0 m (Macro)</option>
              </select>
            </div>

            {/* Index Contours Check */}
            <div className="space-y-2 border-t border-slate-50 pt-3">
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIndexContours}
                  onChange={(e) => setIncludeIndexContours(e.target.checked)}
                  className="accent-[#0891B2] rounded"
                />
                Generar curvas maestras (índice)
              </label>

              {includeIndexContours && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[12px] text-slate-500">Curva maestra cada:</span>
                  <select
                    value={indexEvery}
                    onChange={(e) => setIndexEvery(parseInt(e.target.value))}
                    className="bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="5">5 líneas</option>
                    <option value="10">10 líneas</option>
                  </select>
                </div>
              )}
            </div>

            {/* Run Button */}
            <Button variant="primary" onClick={handleGenerate} className="w-full justify-center">
              <Spline size={14} className="mr-1.5" />
              Generar Curvas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render warnings or validation errors of contours count
  const renderValidationBanner = () => {
    if (!contourQA) return null;

    if (contourQA.blockers.length > 0) {
      return (
        <div className="absolute top-4 left-4 right-4 bg-[#FEF2F2]/95 border border-[#EF4444]/20 text-[#991B1B] p-3.5 rounded shadow-md text-[12.5px] flex items-start gap-2 max-w-xl backdrop-blur-sm z-10 bg-white/95">
          <AlertOctagon size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[#7F1D1D] font-bold block">Las curvas no son aptas para exportación.</strong>
            <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-[#991B1B]/90">
              {contourQA.blockers.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (contourQA.warnings.length > 0) {
      return (
        <div className="absolute top-4 left-4 right-4 bg-[#FFFBEB]/95 border border-[#F59E0B]/20 text-[#92400E] p-3.5 rounded shadow-md text-[12.5px] flex items-start gap-2 max-w-xl backdrop-blur-sm z-10 bg-white/95">
          <AlertTriangle size={16} className="text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[#78350F] font-bold block">Las curvas fueron generadas, pero presentan advertencias geométricas.</strong>
            <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-[#92400E]/90">
              {contourQA.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-4 left-4 right-4 bg-[#F0FDF4]/95 border border-[#16A34A]/25 text-[#166534] p-3.5 rounded shadow-md text-[12.5px] flex items-start gap-2 max-w-xl backdrop-blur-sm z-10 bg-white/95">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <div className="space-y-0.5">
          <strong className="text-[#14532D] font-bold block">Curvas listas para exportación.</strong>
          <p className="text-[11.5px] text-[#166534]/90">La geometría de las isolíneas es estable y cumple con los requisitos de QA.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-white">
      {/* Viewer controls bar */}
      <div className="h-11 border-b border-[#E2E8F0] bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[13px] font-sans">
          <span className="text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono text-[12px]">
            <Layers size={14} className="text-[#0891B2]" />
            Capas Activas:
          </span>
          <label className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={showPoints}
              onChange={(e) => setShowPoints(e.target.checked)}
              className="accent-[#0891B2] rounded"
            />
            Nube Puntos
          </label>
          <label className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-[#0891B2] rounded"
            />
            Superficie Grid
          </label>
          <label className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
              disabled={!!contours.error}
              className="accent-[#0891B2] rounded disabled:opacity-50"
            />
            Curvas de Nivel ({contours.lineCount} líneas)
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          {contours && !contours.error && (
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
            Trazado de Contornos Vectoriales (Marching Squares)
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex min-h-0 relative bg-white">
        {renderValidationBanner()}
        
        {contours.error ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center text-[#64748B] space-y-2 max-w-sm px-6">
              <Spline className="mx-auto text-slate-300 opacity-60" size={48} />
              <p className="text-[13px]">
                Ajuste los parámetros en la barra derecha para trazar las curvas correctamente.
              </p>
            </div>
          </div>
        ) : (
          <ContourViewer
            points={points}
            contours={contours}
            showPoints={showPoints}
            showGrid={showGrid}
            minZ={surface.minZ}
            maxZ={surface.maxZ}
            viewerMode={viewerMode}
          />
        )}
      </div>

      {/* Bottom control bar */}
      <div className="h-14 border-t border-[#E2E8F0] bg-white px-6 flex items-center justify-between shrink-0">
        <div className="text-[13px] font-sans text-[#64748B] flex items-center gap-2">
          <Spline size={14} className="text-[#06B6D4]" />
          <span>
            {contours.error
              ? 'Error en el trazado. Modifique la equidistancia.'
              : `Curvas trazadas: ${contours.lineCount} niveles, ${contours.segmentCount.toLocaleString()} segmentos en ${contours.processingTimeMs} ms.`}
          </span>
        </div>
        <Button variant="primary" onClick={onProceed} disabled={!!contours.error || (contourQA ? contourQA.blockers.length > 0 : false)}>
          Continuar a Exportación
          <ArrowRight size={12} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

// Simple placeholder for XCircleIcon
function XCircleIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
