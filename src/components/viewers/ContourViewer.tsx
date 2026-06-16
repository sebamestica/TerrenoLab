import React, { useRef, useEffect, useState } from 'react';
import { TerrainPoint } from '../../domain/terrain/types';
import { ContourResult } from '../../domain/terrain/contours';
import { ElevationLegend } from './ElevationLegend';
import { GridOverlay } from './GridOverlay';
import { drawLegendOnCanvas } from './canvasLegend';

interface ContourViewerProps {
  points: TerrainPoint[];
  contours: ContourResult;
  showPoints: boolean;
  showGrid: boolean;
  minZ: number;
  maxZ: number;
  viewerMode?: 'light' | 'technical';
}

export function ContourViewer({
  points,
  contours,
  showPoints,
  showGrid,
  minZ,
  maxZ,
  viewerMode = 'light',
}: ContourViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    if (!canvas || !contours) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = viewerMode === 'technical';

    // 1. Clear background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = isDark ? '#0f172a' : '#FFFFFF';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Padding inside canvas
    const padding = 40;

    // Find bounding box coordinates from points (or default bounds if no points)
    let minX = 0, maxX = 100, minY = 0, maxY = 100;
    if (points.length > 0) {
      minX = Infinity;
      maxX = -Infinity;
      minY = Infinity;
      maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }

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

    // 2. Draw Grid ticks
    if (showGrid) {
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
    }

    // 3. Draw Bounding Box border
    ctx.strokeStyle = isDark ? '#cbd5e1' : '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapX(minX), mapY(maxY), rangeX * scale, rangeY * scale);

    // 4. Draw Contour Lines
    // Render normal contours first, then master/index contours to overlay labels cleanly
    const normalContours = contours.lines.filter(l => !l.isIndex);
    const indexContours = contours.lines.filter(l => l.isIndex);

    // Render normal contours
    ctx.strokeStyle = isDark ? '#22d3ee' : '#0891B2';
    ctx.lineWidth = 1.0;
    for (const line of normalContours) {
      ctx.beginPath();
      for (const seg of line.segments) {
        ctx.moveTo(mapX(seg.x1), mapY(seg.y1));
        ctx.lineTo(mapX(seg.x2), mapY(seg.y2));
      }
      ctx.stroke();
    }

    // Render index contours
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0369A1';
    ctx.lineWidth = 2.0;
    for (const line of indexContours) {
      ctx.beginPath();
      for (const seg of line.segments) {
        ctx.moveTo(mapX(seg.x1), mapY(seg.y1));
        ctx.lineTo(mapX(seg.x2), mapY(seg.y2));
      }
      ctx.stroke();
    }

    // Render labels for index contours (masked background)
    for (const line of indexContours) {
      if (line.segments.length === 0) continue;

      // Draw label near the middle segment of the line
      const midIdx = Math.floor(line.segments.length / 2);
      const seg = line.segments[midIdx];

      const cx = (mapX(seg.x1) + mapX(seg.x2)) / 2;
      const cy = (mapY(seg.y1) + mapY(seg.y2)) / 2;

      const labelText = `${line.level.toFixed(1)}m`;
      ctx.font = 'bold 9px monospace';
      
      const textWidth = ctx.measureText(labelText).width;
      
      // Draw background mask
      ctx.fillStyle = isDark ? '#0f172a' : '#FFFFFF';
      ctx.fillRect(cx - textWidth / 2 - 2, cy - 6, textWidth + 4, 12);

      // Draw border box for mask (optional, keep it clean without border)
      // Draw text
      ctx.fillStyle = isDark ? '#38bdf8' : '#0369A1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, cx, cy);
    }

    // 5. Draw original points
    if (showPoints && points.length > 0) {
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.15)'; // Low opacity point cloud
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(mapX(p.x), mapY(p.y), 3.0, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 6. Draw Scale bar
    const scaleDistance = getNiceScaleDistance(rangeX);
    const scaleBarWidth = scaleDistance * scale;
    const scaleX = padding + 20;
    const scaleY = dimensions.height - padding - 20;

    // Scale bar line
    ctx.strokeStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY);
    ctx.stroke();

    // Ticks
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scaleBarWidth, scaleY - 4);
    ctx.lineTo(scaleX + scaleBarWidth, scaleY + 4);
    ctx.stroke();

    // Scale text
    ctx.fillStyle = isDark ? '#ffffff' : '#0F172A';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${scaleDistance.toLocaleString()} m`, scaleX + scaleBarWidth + 8, scaleY);

    // 7. Draw Legend directly on Canvas for PNG export
    drawLegendOnCanvas(ctx, minZ, maxZ, dimensions.width, dimensions.height, isDark);

  }, [contours, points, showPoints, showGrid, dimensions, minZ, maxZ, viewerMode]);

  const isDark = viewerMode === 'technical';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`} ref={containerRef}>
      {/* Canvas viewport */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 cursor-default block"
        />

        <GridOverlay width={dimensions.width} height={dimensions.height} isDark={isDark} />

        {/* Legend Overlay */}
        {contours && contours.lines.length > 0 && (
          <div className={`absolute left-4 bottom-4 p-3 rounded shadow-sm backdrop-blur-sm border ${
            isDark ? 'bg-[#0f172a]/95 border-slate-700' : 'bg-white/95 border-[#E2E8F0]'
          }`}>
            <ElevationLegend minZ={minZ} maxZ={maxZ} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
}
