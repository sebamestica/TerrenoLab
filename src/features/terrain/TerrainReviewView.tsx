import React, { useState } from 'react';
import { Eye, ArrowRight, Layers } from 'lucide-react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { TopographicQAResult } from '../../domain/terrain/qa';
import { Terrain2DViewer } from '../../components/viewers/Terrain2DViewer';
import { Button } from '../../components/ui/Button';

interface TerrainReviewViewProps {
  points: TerrainPoint[];
  metrics: TerrainMetrics | null;
  qaResult: TopographicQAResult | null;
  onProceed: () => void;
  viewerMode: 'light' | 'technical';
  setViewerMode: (mode: 'light' | 'technical') => void;
  hideLocalLayerControls?: boolean;
}

export function TerrainReviewView({
  points,
  metrics,
  qaResult,
  onProceed,
  viewerMode,
  setViewerMode,
  hideLocalLayerControls = false
}: TerrainReviewViewProps) {
  const [showPoints, setShowPoints] = useState(true);

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
                  className="accent-[#0891B2] rounded"
                />
                Nube Puntos
              </label>
              <label className="flex items-center gap-1.5 text-[#94A3B8] cursor-not-allowed" title="Superficie no generada todavía">
                <input type="checkbox" disabled className="rounded" />
                Superficie Grid (Bloqueado)
              </label>
              <label className="flex items-center gap-1.5 text-[#94A3B8] cursor-not-allowed" title="Curvas no generadas todavía">
                <input type="checkbox" disabled className="rounded" />
                Curvas Nivel (Bloqueado)
              </label>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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

          {qaResult && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] text-[11px] font-mono uppercase font-bold">Aptitud:</span>
              {qaResult.quality.canInterpolate ? (
                qaResult.outlierResult.outlierCount > 0 ? (
                  <span className="px-2 py-0.5 border rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border-[#D97706]/10" title="Dataset apto pero contiene outliers altimétricos">
                    Requiere revisión
                  </span>
                ) : (
                  <span className="px-2 py-0.5 border rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#10B981] border-[#10B981]/10" title="Dataset óptimo para interpolación">
                    Apto para interpolación
                  </span>
                )
              ) : (
                <span className="px-2 py-0.5 border rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/10" title="No apto para interpolación">
                  No apto para interpolación
                </span>
              )}
            </div>
          )}
          <span className="font-mono text-[12px] text-[#64748B] border-l border-[#E2E8F0] pl-2">
            Planta 2D (Este/Norte)
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        <Terrain2DViewer
          points={points}
          metrics={metrics}
          grid={null}
          contours={[]}
          showGrid={false}
          showContours={false}
          showPoints={showPoints}
          viewerMode={viewerMode}
        />
      </div>

      {/* Workflow Navigation */}
      <div className="h-14 border-t border-[#E2E8F0] bg-white px-6 flex items-center justify-between shrink-0">
        <div className="text-[13px] font-sans text-[#64748B] flex items-center gap-2">
          <Eye size={14} className="text-[#06B6D4]" />
          <span>Verifique los límites y la distribución del terreno cargado.</span>
        </div>
        <Button variant="primary" onClick={onProceed}>
          Generar superficie
          <ArrowRight size={12} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
