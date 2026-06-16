import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AreaChart, Eye, Spline, ShieldAlert, AlertTriangle, Play, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { VolumeOptions, VolumeResult, calculateCutFillVolume, isPointInPolygon } from '../../domain/terrain/volume';
import { validateVolumeAnalysis, VolumeQAResult } from '../../domain/terrain/volumeQA';
import { PolygonSelectionOverlay } from '../../components/viewers/PolygonSelectionOverlay';
import { GridOverlay } from '../../components/viewers/GridOverlay';
import { Button } from '../../components/ui/Button';

import { VolumeAuditResult } from '../../domain/terrain/volumeAudit';

interface VolumeViewProps {
  points: TerrainPoint[];
  surface: IDWSurfaceResult | null;
  metrics: TerrainMetrics | null;
  selectedCRS: string;
  viewerMode: 'light' | 'technical';
  polygon: Array<{ x: number; y: number }>;
  setPolygon: (polygon: Array<{ x: number; y: number }>) => void;
  volumeOptions: VolumeOptions;
  setVolumeOptions: (options: VolumeOptions) => void;
  volumeResult: VolumeResult | null;
  setVolumeResult: (res: VolumeResult | null) => void;
  volumeAudit?: VolumeAuditResult | null;
  onProceed: () => void;
  onReset: () => void;
  hideLocalLayerControls?: boolean;
}

export function VolumeView({
  points,
  surface,
  metrics,
  selectedCRS,
  viewerMode,
  polygon,
  setPolygon,
  volumeOptions,
  setVolumeOptions,
  volumeResult,
  setVolumeResult,
  volumeAudit,
  onProceed,
  onReset,
  hideLocalLayerControls = false,
}: VolumeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [polygonMode, setPolygonMode] = useState<'drawing' | 'editing' | 'idle'>('idle');

  // Resize observer for dynamic canvas scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 250),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // QA Check
  const qa = useMemo<VolumeQAResult>(() => {
    return validateVolumeAnalysis(surface, polygon, volumeOptions, selectedCRS, metrics);
  }, [surface, polygon, volumeOptions, selectedCRS, metrics]);

  // Trigger volume calculation reactively
  useEffect(() => {
    if (surface && polygon.length >= 3 && qa.isValid) {
      const result = calculateCutFillVolume(surface, polygon, volumeOptions);
      setVolumeResult(result);
    } else {
      setVolumeResult(null);
    }
  }, [surface, polygon, volumeOptions, qa.isValid, setVolumeResult]);

  // Smooth elevation color ramp mapping
  const getZColorSmooth = (z: number, minZ: number, maxZ: number, alpha = 0.85) => {
    const rangeZ = maxZ - minZ || 1;
    const t = Math.max(0, Math.min(1, (z - minZ) / rangeZ));

    const colors = [
      { t: 0.0, r: 59, g: 130, b: 246 },   // Blue
      { t: 0.25, r: 6, g: 182, b: 212 },  // Cyan
      { t: 0.5, r: 16, g: 185, b: 129 },  // Emerald
      { t: 0.75, r: 245, g: 158, b: 11 }, // Amber
      { t: 1.0, r: 244, g: 63, b: 94 }    // Rose
    ];

    let lower = colors[0];
    let upper = colors[colors.length - 1];

    for (let i = 0; i < colors.length - 1; i++) {
      if (t >= colors[i].t && t <= colors[i + 1].t) {
        lower = colors[i];
        upper = colors[i + 1];
        break;
      }
    }

    const segmentRange = upper.t - lower.t || 1;
    const segmentT = (t - lower.t) / segmentRange;

    const r = Math.round(lower.r + segmentT * (upper.r - lower.r));
    const g = Math.round(lower.g + segmentT * (upper.g - lower.g));
    const b = Math.round(lower.b + segmentT * (upper.b - lower.b));

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !surface) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { gridX, gridY, gridZ, bounds, minZ, maxZ } = surface;
    const cols = gridX.length;
    const rows = gridY.length;
    if (cols === 0 || rows === 0) return;

    const isDark = viewerMode === 'technical';

    // Background color
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const padding = 40;
    const minX = bounds.minX;
    const maxX = bounds.maxX;
    const minY = bounds.minY;
    const maxY = bounds.maxY;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Preserve aspect ratio scale
    const drawWidth = dimensions.width - 2 * padding;
    const drawHeight = dimensions.height - 2 * padding;
    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);

    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    const mapX = (val: number) => offsetX + (val - minX) * scale;
    const mapY = (val: number) => dimensions.height - (offsetY + (val - minY) * scale);

    const dx = (maxX - minX) / (cols - 1 || 1);
    const dy = (maxY - minY) / (rows - 1 || 1);

    const cellWidthCanvas = dx * scale;
    const cellHeightCanvas = dy * scale;

    // 1. Draw Heatmap cells with cut/fill classification
    for (let r = 0; r < rows; r++) {
      const cy = mapY(gridY[r]);
      for (let c = 0; c < cols; c++) {
        const cx = mapX(gridX[c]);
        const z = gridZ[r][c];

        let cellColor = getZColorSmooth(z, minZ, maxZ, isDark ? 0.7 : 0.85);

        // Classify cell if polygon is closed and cell is inside
        if (polygon.length >= 3) {
          const inside = isPointInPolygon(gridX[c], gridY[r], polygon);
          if (inside) {
            const diff = volumeOptions.targetElevation - z;
            if (diff > 0) {
              // Fill (Relleno) - Cyan highlight
              cellColor = isDark ? 'rgba(6, 182, 212, 0.75)' : 'rgba(8, 145, 178, 0.8)';
            } else if (diff < 0) {
              // Cut (Corte) - Red highlight
              cellColor = isDark ? 'rgba(244, 63, 94, 0.75)' : 'rgba(225, 29, 72, 0.8)';
            } else {
              // Neutral (Neutro) - Slate highlight
              cellColor = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
            }
          } else {
            // Low opacity outside polygon
            cellColor = getZColorSmooth(z, minZ, maxZ, isDark ? 0.15 : 0.2);
          }
        }

        ctx.fillStyle = cellColor;
        ctx.fillRect(
          cx - cellWidthCanvas / 2 - 0.5,
          cy - cellHeightCanvas / 2 - 0.5,
          cellWidthCanvas + 1,
          cellHeightCanvas + 1
        );
      }
    }

    // 2. Draw original points as overlay
    for (const p of points) {
      const px = mapX(p.x);
      const py = mapY(p.y);

      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.15)';
      ctx.beginPath();
      ctx.arc(px + 1, py + 1, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = getZColorSmooth(p.z, minZ, maxZ, 1);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 3. Draw Bounding Box border
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      mapX(minX) - cellWidthCanvas / 2,
      mapY(maxY) - cellHeightCanvas / 2,
      rangeX * scale + cellWidthCanvas,
      rangeY * scale + cellHeightCanvas
    );

    // 4. Draw Scale Bar
    const getNiceScaleDistance = (range: number): number => {
      const targetWidth = range / 5;
      const log = Math.log10(targetWidth);
      const power = Math.pow(10, Math.floor(log));
      const ratio = targetWidth / power;
      let niceDist = power;
      if (ratio >= 5) niceDist = 5 * power;
      else if (ratio >= 2) niceDist = 2 * power;
      return niceDist > 0 ? niceDist : 1;
    };

    const scaleDistance = getNiceScaleDistance(rangeX);
    const scaleBarWidth = scaleDistance * scale;
    const scaleX = padding + 20;
    const scaleY = dimensions.height - padding - 15;

    ctx.strokeStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY + 1);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY + 1);
    ctx.stroke();

    ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scaleBarWidth, scaleY - 4);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY + 4);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.font = '10px monospace';
    ctx.fillText(`${scaleDistance.toLocaleString()} m`, scaleX + scaleBarWidth + 8, scaleY + 3);

  }, [surface, points, polygon, volumeOptions.targetElevation, dimensions, viewerMode]);

  // Toolbar Actions
  const handleUndoPoint = () => {
    if (polygon.length > 0) {
      setPolygon(polygon.slice(0, -1));
    }
  };

  const handleClearPolygon = () => {
    setPolygon([]);
    setPolygonMode('idle');
  };

  const isDark = viewerMode === 'technical';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-[#0F172A]'}`}>
      
      {/* Top action toolbar */}
      <div className={`px-6 py-3 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setPolygonMode('drawing')}
            className={`px-3 py-1 text-[12.5px] font-semibold ${polygonMode === 'drawing' ? 'bg-[#0891B2] text-white border-[#0891B2]' : ''}`}
          >
            Agregar polígono
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPolygonMode('editing')}
            disabled={polygon.length === 0}
            className={`px-3 py-1 text-[12.5px] font-semibold ${polygonMode === 'editing' ? 'bg-[#0891B2] text-white border-[#0891B2]' : ''}`}
          >
            Editar vértices
          </Button>
          <Button
            variant="secondary"
            onClick={handleUndoPoint}
            disabled={polygon.length === 0}
            className="px-3 py-1 text-[12.5px] font-semibold"
          >
            Eliminar último
          </Button>
          <Button
            variant="secondary"
            onClick={handleClearPolygon}
            disabled={polygon.length === 0}
            className="px-3 py-1 text-[12.5px] font-semibold"
          >
            Limpiar
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPolygonMode('idle')}
            disabled={polygonMode === 'idle'}
            className="px-3 py-1 text-[12.5px]"
          >
            Terminar
          </Button>
        </div>

        <div className="text-[12px] font-mono text-slate-500">
          Vértices: {polygon.length}
        </div>
      </div>

      {/* Main interactive map window */}
      <div className="flex-1 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block"
        />

        <GridOverlay width={dimensions.width} height={dimensions.height} isDark={isDark} />

        {/* Polygon drawing interaction layer */}
        {surface && (
          <PolygonSelectionOverlay
            polygon={polygon}
            onChange={setPolygon}
            bounds={surface.bounds}
            dimensions={dimensions}
            mode={polygonMode}
            setMode={setPolygonMode}
          />
        )}

        {/* Map legend overlay card */}
        {polygon.length >= 3 && volumeResult && (
          <div className={`absolute left-4 bottom-4 p-3 rounded shadow-md border backdrop-blur-sm ${
            isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b pb-1 mb-1.5">
              Leyenda Volumétrica
            </div>
            <div className="flex flex-col gap-1.5 text-[11px] font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0891B2] rounded-sm" />
                <span>Relleno (Target &gt; Z)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#e11d48] rounded-sm" />
                <span>Corte (Target &lt; Z)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-500/80 rounded-sm" />
                <span>Neutro (Target = Z)</span>
              </div>
            </div>
          </div>
        )}

        {/* Display warnings callout directly on the map viewport */}
        {(qa.warnings.length > 0 || (volumeAudit && volumeAudit.warnings.length > 0)) && (
          <div className="absolute top-4 left-4 right-4 max-w-md bg-[#FFFBEB]/95 border border-[#F59E0B]/35 rounded p-3 shadow-md flex items-start gap-2 backdrop-blur-sm">
            <AlertTriangle className="text-[#D97706] shrink-0 mt-0.5" size={15} />
            <div className="space-y-0.5 text-[12px] leading-relaxed text-[#92400E]">
              <span className="font-semibold block">Aviso preliminar:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {qa.warnings.map((w, idx) => (
                  <li key={`qa-${idx}`}>{w}</li>
                ))}
                {volumeAudit && volumeAudit.warnings.map((w, idx) => (
                  <li key={`audit-${idx}`}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Blockers block directly on viewport */}
        {(qa.blockers.length > 0 || (volumeAudit && volumeAudit.blockers.length > 0)) && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 select-none pointer-events-auto">
            <div className="bg-white border border-[#EF4444]/20 rounded-lg p-5 max-w-md shadow-xl text-center space-y-3">
              <ShieldAlert className="text-[#EF4444] mx-auto" size={32} />
              <h3 className="text-[14px] font-bold text-slate-800">
                Análisis Volumétrico Bloqueado
              </h3>
              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                {qa.blockers[0] || (volumeAudit && volumeAudit.blockers[0])}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Precisión del cálculo section */}
      {volumeResult && volumeAudit && (
        <div className={`px-6 py-3 border-t grid grid-cols-4 gap-4 text-[12.5px] shrink-0 ${
          isDark ? 'bg-slate-900/55 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div>
            <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Precisión del cálculo</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold">
              {!volumeAudit.isValid || qa.blockers.length > 0 ? (
                <span className="px-2 py-0.5 text-[11px] bg-red-50 text-red-700 border border-red-200 rounded font-semibold">Crítico</span>
              ) : qa.warnings.length > 0 || volumeAudit.warnings.length > 0 ? (
                <span className="px-2 py-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">Advertencia</span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] bg-green-50 text-green-700 border border-green-200 rounded font-semibold">Estable</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Celdas (Dentro/Total)</span>
            <div className="mt-1 font-mono font-semibold">
              {volumeResult.cellsInsidePolygon} / {volumeResult.cellsEvaluated}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Áreas (Polígono/Muestreada)</span>
            <div className="mt-1 font-mono font-semibold">
              {volumeResult.polygonArea.toFixed(2)} m² / {volumeAudit.sampledArea.toFixed(2)} m²
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">Diferencia / Resolución</span>
            <div className="mt-1 font-semibold flex gap-2">
              <span className="font-mono text-slate-600">{(Math.abs(1 - volumeAudit.areaCoverageRatio) * 100).toFixed(1)}%</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono">{volumeAudit.cellArea.toFixed(2)} m²</span>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimers footer */}
      <div className={`px-6 py-4 border-t space-y-2 shrink-0 ${
        isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-100/60 border-slate-200 text-slate-500'
      }`}>
        <p className="text-[11.5px] leading-relaxed italic">
          * <strong>Estimación preliminar:</strong> basada en superficie IDW interpolada. No reemplaza cubicación topográfica profesional, estudio geotécnico ni diseño de ingeniería.
        </p>
        <p className="text-[11.5px] leading-relaxed italic">
          * <strong>Nota:</strong> El volumen geométrico no es igual al volumen de compra de material. El volumen recomendado considera compactación y pérdidas de contingencia configuradas por el usuario.
        </p>
      </div>

      {/* Proceed step bar */}
      <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <Button variant="ghost" onClick={onReset} className="text-[13px]">
          <ArrowLeft size={14} className="mr-1.5" />
          Reiniciar
        </Button>
        <Button
          variant="primary"
          onClick={onProceed}
          disabled={qa.blockers.length > 0 || (volumeAudit !== null && volumeAudit !== undefined && !volumeAudit.isValid)}
          className="px-5 py-2 font-semibold shadow-sm"
        >
          <Play size={14} className="mr-1.5" />
          Proceder a Exportar
        </Button>
      </div>
    </div>
  );
}
