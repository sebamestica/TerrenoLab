import React, { useRef, useEffect, useState } from 'react';
import { TerrainPoint } from '../../domain/terrain/types';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { ElevationLegend } from './ElevationLegend';
import { GridOverlay } from './GridOverlay';
import { drawLegendOnCanvas } from './canvasLegend';

interface SurfaceRasterViewerProps {
  points: TerrainPoint[];
  surface: IDWSurfaceResult;
  showPoints: boolean;
  showGrid: boolean;
  viewerMode?: 'light' | 'technical';
}

export function SurfaceRasterViewer({
  points,
  surface,
  showPoints,
  showGrid,
  viewerMode = 'light',
}: SurfaceRasterViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    z: number;
    r: number;
    c: number;
  } | null>(null);

  // Resize observer
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

  // Smooth elevation color ramp mapping
  const getZColorSmooth = (z: number, minZ: number, maxZ: number) => {
    const rangeZ = maxZ - minZ || 1;
    const t = Math.max(0, Math.min(1, (z - minZ) / rangeZ));

    const colors = [
      { t: 0.0, r: 59, g: 130, b: 246 },   // Blue (#3b82f6)
      { t: 0.25, r: 6, g: 182, b: 212 },  // Cyan (#06b6d4)
      { t: 0.5, r: 16, g: 185, b: 129 },  // Emerald (#10b981)
      { t: 0.75, r: 245, g: 158, b: 11 }, // Amber (#f59e0b)
      { t: 1.0, r: 244, g: 63, b: 94 }    // Rose (#f43f5e)
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

    return `rgba(${r}, ${g}, ${b}, 0.85)`;
  };

  // Helper to get nice scale division
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

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc'; // Slate 800 background for technical, light slate for light
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Padding inside canvas
    const padding = 40;
    const minX = bounds.minX;
    const maxX = bounds.maxX;
    const minY = bounds.minY;
    const maxY = bounds.maxY;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Aspect ratio preservation
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

    // 1. Draw Heatmap Cells
    for (let r = 0; r < rows; r++) {
      const cy = mapY(gridY[r]);
      for (let c = 0; c < cols; c++) {
        const cx = mapX(gridX[c]);
        const z = gridZ[r][c];

        ctx.fillStyle = getZColorSmooth(z, minZ, maxZ);
        ctx.fillRect(
          cx - cellWidthCanvas / 2 - 0.5,
          cy - cellHeightCanvas / 2 - 0.5,
          cellWidthCanvas + 1,
          cellHeightCanvas + 1
        );
      }
    }

    // 2. Draw Cell Borders (Grid lines)
    if (showGrid) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 0.5;

      // Draw vertical lines on cell centers/boundaries
      for (let c = 0; c < cols; c++) {
        const cx = mapX(gridX[c]);
        ctx.beginPath();
        ctx.moveTo(cx, mapY(minY) + cellHeightCanvas / 2);
        ctx.lineTo(cx, mapY(maxY) - cellHeightCanvas / 2);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let r = 0; r < rows; r++) {
        const cy = mapY(gridY[r]);
        ctx.beginPath();
        ctx.moveTo(mapX(minX) - cellWidthCanvas / 2, cy);
        ctx.lineTo(mapX(maxX) + cellWidthCanvas / 2, cy);
        ctx.stroke();
      }
    }

    // 3. Draw Bounding Box border
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      mapX(minX) - cellWidthCanvas / 2,
      mapY(maxY) - cellHeightCanvas / 2,
      rangeX * scale + cellWidthCanvas,
      rangeY * scale + cellHeightCanvas
    );

    // 4. Draw original points as overlay if checked
    if (showPoints && points.length > 0) {
      for (const p of points) {
        const px = mapX(p.x);
        const py = mapY(p.y);

        // Draw point circle shadow
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.15)';
        ctx.beginPath();
        ctx.arc(px + 1, py + 1, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw actual point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fill();

        // Inner elevation color dot
        ctx.fillStyle = getZColorSmooth(p.z, minZ, maxZ);
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 5. Draw Dynamic Scale Legend inside Canvas
    const scaleDistance = getNiceScaleDistance(rangeX);
    const scaleBarWidth = scaleDistance * scale;
    const scaleX = padding + 20;
    const scaleY = dimensions.height - padding - 20;

    // Scale bar shadow
    ctx.strokeStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY + 1);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY + 1);
    ctx.stroke();

    // Scale bar line
    ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY);
    ctx.stroke();

    // End ticks
    ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scaleBarWidth, scaleY - 4);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY + 4);
    ctx.stroke();

    // Scale text
    ctx.fillStyle = isDark ? '#ffffff' : '#0F172A';
    if (isDark) {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillText(`${scaleDistance.toLocaleString()} m`, scaleX + scaleBarWidth + 8, scaleY + 4);
    ctx.shadowBlur = 0; // reset shadow

    // 6. Draw Legend directly on Canvas for PNG export
    drawLegendOnCanvas(ctx, minZ, maxZ, dimensions.width, dimensions.height, isDark);

  }, [surface, points, showPoints, showGrid, dimensions, viewerMode]);

  // Mouse move over canvas to detect cell coordinate
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !surface) return;

    const { gridX, gridY, gridZ, bounds } = surface;
    const cols = gridX.length;
    const rows = gridY.length;
    if (cols === 0 || rows === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = 40;
    const minX = bounds.minX;
    const maxX = bounds.maxX;
    const minY = bounds.minY;
    const maxY = bounds.maxY;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const drawWidth = dimensions.width - 2 * padding;
    const drawHeight = dimensions.height - 2 * padding;

    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);

    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    // Inverse mapping
    const mx = minX + (mouseX - offsetX) / scale;
    const my = minY + (dimensions.height - mouseY - offsetY) / scale;

    const dx = (maxX - minX) / (cols - 1 || 1);
    const dy = (maxY - minY) / (rows - 1 || 1);

    // Calculate indexes
    const c = Math.round((mx - minX) / dx);
    const r = Math.round((my - minY) / dy);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      setHoveredCell({
        x: gridX[c],
        y: gridY[r],
        z: gridZ[r][c],
        r,
        c,
      });
    } else {
      setHoveredCell(null);
    }
  };

  const isDark = viewerMode === 'technical';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`} ref={containerRef}>
      {/* Canvas viewport */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          className="absolute inset-0 cursor-crosshair block"
        />

        <GridOverlay width={dimensions.width} height={dimensions.height} isDark={isDark} />

        {/* Legend Overlay */}
        {surface && (
          <div className={`absolute left-4 bottom-4 p-3 rounded shadow-md backdrop-blur-sm border ${
            isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            <ElevationLegend minZ={surface.minZ} maxZ={surface.maxZ} isDark={isDark} />
          </div>
        )}

        {/* Hovered cell coordinates card */}
        {hoveredCell && (
          <div className={`absolute right-4 bottom-4 p-3 rounded shadow-lg font-mono text-[12px] w-56 backdrop-blur-sm border ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
          }`}>
            <div className="text-[#06b6d4] font-bold border-b pb-1 mb-1 text-[11px] uppercase tracking-wider border-slate-700">
              Celda Interpolada
            </div>
            <div>Celda: R{hoveredCell.r} C{hoveredCell.c}</div>
            <div>E (X): {hoveredCell.x.toFixed(3)}</div>
            <div>N (Y): {hoveredCell.y.toFixed(3)}</div>
            <div className="font-bold text-[#f59e0b] mt-0.5">Elevación (Z): {hoveredCell.z.toFixed(3)}m</div>
          </div>
        )}
      </div>
    </div>
  );
}
