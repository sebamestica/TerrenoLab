import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AreaChart, Eye, Spline, ShieldAlert, AlertTriangle, Play, RefreshCw, Trash2, ArrowLeft, Info, X } from 'lucide-react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { TERRAIN_LIMITS } from '../../config/limits';
import { VolumeOptions, VolumeResult, calculateCutFillVolume, isPointInPolygon } from '../../domain/terrain/volume';
import { validateVolumeAnalysis, VolumeQAResult } from '../../domain/terrain/volumeQA';
import { PolygonSelectionOverlay } from '../../components/viewers/PolygonSelectionOverlay';
import { GridOverlay } from '../../components/viewers/GridOverlay';
import { Button } from '../../components/ui/Button';

import { VolumeAuditResult } from '../../domain/terrain/volumeAudit';
import { FillMaterialLayer, MaterialLayerResult } from '../../domain/terrain/materialLayers';
import { MaterialLayersQAResult } from '../../domain/terrain/materialLayersQA';

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
  onSkipVolume?: () => void;
  hideLocalLayerControls?: boolean;
  materialLayers: FillMaterialLayer[];
  onMaterialLayersChange: (layers: FillMaterialLayer[]) => void;
  materialLayersResult: MaterialLayerResult | null;
  materialLayersQA: MaterialLayersQAResult | null;
  polygonMode: 'drawing' | 'editing' | 'idle';
  setPolygonMode: (mode: 'drawing' | 'editing' | 'idle') => void;
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
  onSkipVolume,
  hideLocalLayerControls = false,
  materialLayers,
  onMaterialLayersChange,
  materialLayersResult,
  materialLayersQA,
  polygonMode,
  setPolygonMode,
}: VolumeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  type NoticeType = 'info' | 'success' | 'warning' | 'error';
  interface Notice {
    id: string;
    type: NoticeType;
    message: string | React.ReactNode;
  }
  const [notices, setNotices] = useState<Notice[]>([]);

  const addNotice = React.useCallback((type: NoticeType, message: string | React.ReactNode) => {
    const id = crypto.randomUUID();
    
    setNotices(prev => {
      // Prevent duplicates by checking string representation if possible, or just skip if it's node (for simplicity, we assume text messages are common)
      if (typeof message === 'string' && prev.some(n => n.message === message)) {
        return prev;
      }
      return [...prev, { id, type, message }];
    });

    let duration = 0;
    if (type === 'info') duration = 3500;
    if (type === 'success') duration = 4000;
    if (type === 'warning') duration = 6000;

    if (duration > 0) {
      setTimeout(() => {
        setNotices(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotice = React.useCallback((id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleAddLayer = () => {
    onMaterialLayersChange([
      ...materialLayers,
      {
        id: crypto.randomUUID(),
        name: 'Nuevo Material',
        fromThickness: 0,
        toThickness: 0.2,
        color: 'gris',
        compactionFactor: 1.2,
        wasteFactor: 1.05
      }
    ]);
  };

  const handleLayerFieldChange = (id: string, field: keyof FillMaterialLayer, value: any) => {
    onMaterialLayersChange(materialLayers.map(l => {
      if (l.id === id) {
        return { ...l, [field]: (field === 'fromThickness' || field === 'toThickness' || field === 'pricePerM3' || field === 'compactionFactor' || field === 'wasteFactor') ? (value === '' ? undefined : parseFloat(value)) : value };
      }
      return l;
    }));
  };

  const handleDeleteLayer = (id: string) => {
    onMaterialLayersChange(materialLayers.filter(l => l.id !== id));
  };

  const getColorHex = (colorName: string) => {
    const colors: Record<string, string> = {
      'gris': '#94A3B8',
      'café': '#A16207',
      'verde': '#16A34A',
      'azul': '#0284C7',
      'rojo': '#DC2626'
    };
    return colors[colorName.toLowerCase()] || '#94A3B8';
  };

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

  // Alert Effect Triggers (using primitives)
  const isNoPolygon = polygon.length === 0;
  const isIncompletePolygon = polygon.length > 0 && polygon.length < 3;
  const criticalBlocker = qa.blockers.find(
    (b) =>
      b !== 'No se ha dibujado ningún polígono de análisis.' &&
      b !== 'El polígono de análisis está incompleto: requiere al menos 3 vértices.'
  ) || (volumeAudit && volumeAudit.blockers[0]);
  const hasCriticalBlockers = !!criticalBlocker && !isNoPolygon && !isIncompletePolygon;

  const warningCount = qa.warnings.length;
  const auditWarningCount = volumeAudit?.warnings.length || 0;

  useEffect(() => {
    if (isNoPolygon) {
      addNotice('info', 'Dibuje un polígono de análisis para calcular corte y relleno. Use "Agregar polígono" y marque al menos 3 vértices.');
    }
  }, [isNoPolygon, addNotice]);

  useEffect(() => {
    if (isIncompletePolygon) {
      addNotice('warning', 'Agregue al menos 3 vértices para poder realizar la cubicación.');
    }
  }, [isIncompletePolygon, addNotice]);

  useEffect(() => {
    if (warningCount > 0 || auditWarningCount > 0) {
      addNotice('warning', 'Hay advertencias de calidad en la cubicación. Revise la leyenda inferior.');
    }
  }, [warningCount, auditWarningCount, addNotice]);

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
            disabled={polygon.length < 3 || polygonMode === 'idle'}
            className="px-3 py-1 text-[12.5px]"
          >
            Terminar
          </Button>
        </div>

        <div className="text-[12px] font-mono text-slate-500">
          Vértices: {polygon.length} {polygon.length === 0 && <span className="text-slate-400 ml-1.5 font-sans">(Use "Agregar polígono" y marque al menos 3 vértices sobre el terreno)</span>}
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

        {/* Notice Area (Non-blocking, top right) */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
          {notices.map(notice => {
            let bgClass = '';
            let icon = null;
            if (notice.type === 'info') {
              bgClass = 'bg-cyan-50/95 border-cyan-200 text-cyan-800';
              icon = <Info size={16} className="text-cyan-600 shrink-0 mt-0.5" />;
            } else if (notice.type === 'success') {
              bgClass = 'bg-green-50/95 border-green-200 text-green-800';
              icon = <RefreshCw size={16} className="text-green-600 shrink-0 mt-0.5" />;
            } else if (notice.type === 'warning') {
              bgClass = 'bg-amber-50/95 border-amber-200 text-amber-800';
              icon = <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />;
            } else if (notice.type === 'error') {
              bgClass = 'bg-red-50/95 border-red-200 text-red-800';
              icon = <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />;
            }

            return (
              <div key={notice.id} className={`pointer-events-auto border rounded shadow-md p-3 text-[12px] flex items-start gap-2 backdrop-blur-sm font-sans transition-all duration-300 ease-out ${bgClass}`}>
                {icon}
                <div className="flex-1 leading-relaxed">
                  {notice.message}
                </div>
                <button 
                  onClick={() => removeNotice(notice.id)}
                  className="shrink-0 p-1 hover:bg-black/5 rounded opacity-60 hover:opacity-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Blockers rendered as regular notice in the center (non-blocking overlay) */}
        {hasCriticalBlockers && (
          <div className="absolute inset-0 flex items-center justify-center p-6 select-none pointer-events-none z-20">
            <div className="bg-white border border-[#EF4444]/20 rounded-lg p-5 max-w-md shadow-xl text-center space-y-3 font-sans pointer-events-auto relative">
              {/* Max Polygon Vertices Warning */}
              {polygon.length > TERRAIN_LIMITS.maxPolygonVertices && (
                <div className={`border rounded p-3 mb-2 flex items-start gap-3 ${isDark ? 'bg-amber-950/90 border-amber-900 text-amber-200' : 'bg-amber-50/95 border-amber-200 text-amber-900'}`}>
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={17} />
                  <div className="space-y-0.5 flex-1 text-left">
                    <span className="font-bold text-[12.5px] block leading-tight">Polígono masivo</span>
                    <span className={`text-[11px] leading-snug block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      El polígono tiene demasiados vértices ({polygon.length} / {TERRAIN_LIMITS.maxPolygonVertices}) para una cubicación fluida en tiempo real.
                    </span>
                  </div>
                </div>
              )}

              {/* Hero Status Alert */}
              <ShieldAlert className="text-[#EF4444] mx-auto" size={32} />
              <h3 className="text-[14px] font-bold text-slate-800">
                Análisis Volumétrico Bloqueado
              </h3>
              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                {criticalBlocker}
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

      {/* Sección Materiales por Capas */}
      {volumeResult && (
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 bg-white border-t border-slate-200`}>
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <AreaChart size={16} className="text-[#0891B2]" />
              Materiales por Capas de Relleno
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleAddLayer}
                className="text-[12px] py-1 font-semibold"
              >
                Agregar material
              </Button>
              <Button
                variant="secondary"
                onClick={() => {}}
                className="text-[12px] py-1 font-semibold text-slate-500 cursor-default"
                title="Los cálculos se actualizan automáticamente de forma reactiva."
              >
                <RefreshCw size={12} className="mr-1.5 animate-spin-slow" />
                Recalcular (Auto)
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                  <th className="p-2.5">Material</th>
                  <th className="p-2.5 w-20">Desde (m)</th>
                  <th className="p-2.5 w-20">Hasta (m)</th>
                  <th className="p-2.5 w-28">Color</th>
                  <th className="p-2.5 w-28">Precio/m³ ($)</th>
                  <th className="p-2.5 w-20">Compact.</th>
                  <th className="p-2.5 w-20">Pérdida</th>
                  <th className="p-2.5 text-right w-24">Vol. Bruto</th>
                  <th className="p-2.5 text-right w-24">Vol. Recom.</th>
                  <th className="p-2.5 text-right w-28">Costo</th>
                  <th className="p-2.5 text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody>
                {materialLayers.map((layer) => {
                  const volData = materialLayersResult?.layers.find((l) => l.layerId === layer.id);
                  const rawVol = volData ? volData.rawVolume : 0;
                  const recomVol = volData ? volData.recommendedVolume : 0;
                  const estCost = volData ? volData.estimatedCost : null;

                  return (
                    <tr key={layer.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={layer.name}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={layer.fromThickness}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'fromThickness', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-mono focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={layer.toThickness}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'toThickness', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-mono focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300"
                            style={{ backgroundColor: getColorHex(layer.color) }}
                          />
                          <select
                            value={layer.color}
                            onChange={(e) => handleLayerFieldChange(layer.id, 'color', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] font-sans focus:outline-none focus:border-[#0891B2] cursor-pointer"
                          >
                            <option value="gris">Gris</option>
                            <option value="café">Café</option>
                            <option value="verde">Verde</option>
                            <option value="azul">Azul</option>
                            <option value="rojo">Rojo</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="Sin precio"
                          min="0"
                          value={layer.pricePerM3 === null || layer.pricePerM3 === undefined ? '' : layer.pricePerM3}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'pricePerM3', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-mono focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={layer.compactionFactor}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'compactionFactor', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-mono focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={layer.wasteFactor}
                          onChange={(e) => handleLayerFieldChange(layer.id, 'wasteFactor', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-[12px] text-slate-800 font-mono focus:outline-none focus:border-[#0891B2]"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-medium text-slate-600">
                        {rawVol.toFixed(2)} m³
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-700">
                        {recomVol.toFixed(2)} m³
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800">
                        {estCost !== null && estCost !== undefined ? (
                          `$${estCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        ) : (
                          '---'
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteLayer(layer.id)}
                          className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors"
                          title="Eliminar material"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen del Relleno por Capas */}
          {materialLayersResult && (
            <div className="grid grid-cols-4 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded font-sans">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Volumen Recomendado Compras</span>
                <span className="text-[15px] font-bold text-[#0891B2] mt-0.5 block font-mono">
                  {materialLayersResult.totalRecommendedVolume.toFixed(2)} m³
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Costo Estimado Materiales</span>
                <span className="text-[15px] font-bold text-slate-800 mt-0.5 block font-mono">
                  {materialLayersResult.totalEstimatedCost !== null ? (
                    `$${materialLayersResult.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  ) : (
                    'null (Faltan precios)'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Volumen Relleno sin Asignar</span>
                <span className={`text-[15px] font-bold mt-0.5 block font-mono ${materialLayersResult.unassignedFillVolume > 0.001 ? 'text-[#EF4444]' : 'text-slate-600'}`}>
                  {materialLayersResult.unassignedFillVolume.toFixed(2)} m³
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Estado QA Capas</span>
                <div className="mt-1">
                  {materialLayersQA ? (
                    materialLayersQA.blockers.length > 0 ? (
                      <span className="px-2 py-0.5 text-[10.5px] bg-red-50 text-red-700 border border-red-200 rounded font-semibold uppercase tracking-wide">Bloqueado</span>
                    ) : materialLayersQA.warnings.length > 0 ? (
                      <span className="px-2 py-0.5 text-[10.5px] bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold uppercase tracking-wide">Advertencia</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10.5px] bg-green-50 text-green-700 border border-green-200 rounded font-semibold uppercase tracking-wide">Apto</span>
                    )
                  ) : (
                    <span className="text-slate-400 font-bold">---</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advertencia obligatoria */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[11px] text-amber-900 leading-relaxed font-sans font-medium">
            La configuración de materiales es preliminar y debe ser validada por un profesional competente. TerrenoLab no reemplaza estudio geotécnico, diseño de pavimentos ni especificación de compactación en obra.
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

      <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onReset} className="text-[13px]">
            <ArrowLeft size={14} className="mr-1.5" />
            Reiniciar
          </Button>
          {onSkipVolume && (
            <Button
              variant="secondary"
              onClick={onSkipVolume}
              className="text-[13px] border-slate-300 text-slate-600 hover:bg-slate-50 border"
            >
              Omitir Cálculo y Exportar
            </Button>
          )}
        </div>
        <Button
          variant="primary"
          onClick={onProceed}
          disabled={
            volumeResult === null ||
            qa.blockers.length > 0 ||
            (volumeAudit !== null && volumeAudit !== undefined && !volumeAudit.isValid) ||
            (materialLayersQA !== null && materialLayersQA !== undefined && materialLayersQA.blockers.length > 0)
          }
          className="px-5 py-2 font-semibold shadow-sm text-[12.5px]"
          title={
            (volumeResult === null || qa.blockers.length > 0 || (volumeAudit !== null && volumeAudit !== undefined && !volumeAudit.isValid) || (materialLayersQA !== null && materialLayersQA !== undefined && materialLayersQA.blockers.length > 0))
              ? "Resuelva los errores de volumen y materiales, o presione Omitir."
              : undefined
          }
        >
          <Play size={14} className="mr-1.5" />
          {(volumeResult === null || qa.blockers.length > 0 || (volumeAudit !== null && volumeAudit !== undefined && !volumeAudit.isValid) || (materialLayersQA !== null && materialLayersQA !== undefined && materialLayersQA.blockers.length > 0))
            ? "Complete el análisis de volumen para exportar."
            : "Proceder a Exportar"
          }
        </Button>
      </div>
    </div>
  );
}
