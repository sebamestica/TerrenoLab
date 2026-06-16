import React, { useRef, useEffect, useState } from 'react';
import { TerrainPoint, TerrainMetrics } from '../../domain/terrain/types';
import { InterpolationGrid } from '../../domain/terrain/interpolation';
import { ContourLine } from '../../domain/terrain/contours';
import { ElevationLegend } from './ElevationLegend';
import { GridOverlay } from './GridOverlay';
import { drawLegendOnCanvas } from './canvasLegend';

interface Terrain2DViewerProps {
  points: TerrainPoint[];
  metrics: TerrainMetrics | null;
  grid: InterpolationGrid | null;
  contours: ContourLine[];
  showGrid: boolean;
  showContours: boolean;
  showPoints: boolean;
  viewerMode?: 'light' | 'technical';
}

export function Terrain2DViewer({
  points,
  metrics,
  grid,
  contours,
  showGrid,
  showContours,
  showPoints,
  viewerMode = 'light',
}: Terrain2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TerrainPoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Handle resizing
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

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !metrics || points.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = viewerMode === 'technical';

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Padding inside canvas
    const padding = 40;
    const minX = metrics.minX;
    const maxX = metrics.maxX;
    const minY = metrics.minY;
    const maxY = metrics.maxY;
    const minZ = metrics.minZ;
    const maxZ = metrics.maxZ;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const rangeZ = maxZ - minZ || 1;

    // Aspect ratio matching
    const drawWidth = dimensions.width - 2 * padding;
    const drawHeight = dimensions.height - 2 * padding;

    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);
    
    // Centers the rendering
    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    const mapX = (x: number) => offsetX + (x - minX) * scale;
    // Invert Y because screen space Y is top-to-bottom
    const mapY = (y: number) => dimensions.height - (offsetY + (y - minY) * scale);

    // Color ramp mapping for elevations (Deep blue -> Cyan -> Emerald -> Yellow -> Orange -> Rose)
    const getZColor = (z: number) => {
      const t = (z - minZ) / rangeZ;
      if (t < 0.2) return 'rgba(59, 130, 246, 0.85)'; // Blue
      if (t < 0.4) return 'rgba(6, 182, 212, 0.85)'; // Cyan
      if (t < 0.6) return 'rgba(16, 185, 129, 0.85)'; // Emerald
      if (t < 0.8) return 'rgba(245, 158, 11, 0.9)'; // Amber
      return 'rgba(244, 63, 94, 0.95)'; // Rose
    };

    // 1. Draw Grid Overlay / Axis ticks
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const tx = minX + (i / numTicks) * rangeX;
      const ty = minY + (i / numTicks) * rangeY;

      // Vertical tick lines
      ctx.beginPath();
      ctx.moveTo(mapX(tx), padding);
      ctx.lineTo(mapX(tx), dimensions.height - padding);
      ctx.stroke();

      // Horizontal tick lines
      ctx.beginPath();
      ctx.moveTo(padding, mapY(ty));
      ctx.lineTo(dimensions.width - padding, mapY(ty));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Draw Bounding Box border
    ctx.strokeStyle = isDark ? '#cbd5e1' : '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapX(minX), mapY(maxY), (maxX - minX) * scale, (maxY - minY) * scale);

    // 3. (Grid rendering removed in Phase 1)
    // 4. (Contour rendering removed in Phase 1)

    // 5. Draw point cloud
    if (showPoints) {
      for (const p of points) {
        ctx.fillStyle = getZColor(p.z);
        ctx.beginPath();
        // Hover highlight
        const isHovered = hoveredPoint && hoveredPoint.id === p.id;
        const radius = isHovered ? 6 : 4;

        ctx.arc(mapX(p.x), mapY(p.y), radius, 0, 2 * Math.PI);
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

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

    // Draw Scale bar
    const scaleDistance = getNiceScaleDistance(rangeX);
    const scaleBarWidth = scaleDistance * scale;
    const scaleX = padding + 20;
    const scaleY = dimensions.height - padding - 20;

    ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.lineWidth = 2;
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
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${scaleDistance.toLocaleString()} m`, scaleX + scaleBarWidth + 8, scaleY);

    // Draw Legend directly on Canvas for PNG export
    drawLegendOnCanvas(ctx, minZ, maxZ, dimensions.width, dimensions.height, isDark);

  }, [points, metrics, grid, contours, showGrid, showContours, showPoints, dimensions, hoveredPoint, viewerMode]);

  // Handle hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !metrics || points.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = 40;
    const rangeX = metrics.maxX - metrics.minX || 1;
    const rangeY = metrics.maxY - metrics.minY || 1;

    const drawWidth = dimensions.width - 2 * padding;
    const drawHeight = dimensions.height - 2 * padding;

    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);
    
    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    const mapX = (x: number) => offsetX + (x - metrics.minX) * scale;
    const mapY = (y: number) => dimensions.height - (offsetY + (y - metrics.minY) * scale);

    // Search nearest point within 8px radius
    let nearest: TerrainPoint | null = null;
    let minDist = 8;

    for (const p of points) {
      const px = mapX(p.x);
      const py = mapY(p.y);
      const dist = Math.sqrt((px - mouseX) ** 2 + (py - mouseY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    setHoveredPoint(nearest);
  };

  const isDark = viewerMode === 'technical';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`} ref={containerRef}>
      {/* 2D Viewport Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="absolute inset-0 cursor-crosshair block"
        />

        <GridOverlay width={dimensions.width} height={dimensions.height} isDark={isDark} />

        {/* Legend Overlay */}
        {metrics && points.length > 0 && (
          <div className={`absolute left-4 bottom-4 p-2 rounded shadow-sm backdrop-blur-sm border ${
            isDark ? 'bg-[#0f172a]/95 border-slate-700' : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            <ElevationLegend minZ={metrics.minZ} maxZ={metrics.maxZ} isDark={isDark} />
          </div>
        )}

        {/* Hovered point coordinates details */}
        {hoveredPoint && (
          <div className={`absolute right-4 bottom-4 p-3 rounded shadow-md font-mono text-[12px] w-48 backdrop-blur-sm border ${
            isDark 
              ? 'bg-[#0f172a]/95 border-[#0891B2] text-white' 
              : 'bg-white border-[#0891B2] text-[#0F172A]'
          }`}>
            <div className="text-[#0891B2] font-bold border-b border-[#E2E8F0] pb-1 mb-1 text-[11px] uppercase tracking-wider">
              Punto Topográfico
            </div>
            <div>ID: {hoveredPoint.id}</div>
            <div>E (X): {hoveredPoint.x.toFixed(3)}</div>
            <div>N (Y): {hoveredPoint.y.toFixed(3)}</div>
            <div className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Z: {hoveredPoint.z.toFixed(3)}m
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
