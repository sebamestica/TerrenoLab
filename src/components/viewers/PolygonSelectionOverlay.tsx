import React, { useRef, useState } from 'react';

interface PolygonSelectionOverlayProps {
  polygon: Array<{ x: number; y: number }>;
  onChange: (polygon: Array<{ x: number; y: number }>) => void;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  dimensions: { width: number; height: number };
  mode: 'drawing' | 'editing' | 'idle';
  setMode: (mode: 'drawing' | 'editing' | 'idle') => void;
}

export function PolygonSelectionOverlay({
  polygon,
  onChange,
  bounds,
  dimensions,
  mode,
  setMode,
}: PolygonSelectionOverlayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const padding = 40;
  const minX = bounds.minX;
  const maxX = bounds.maxX;
  const minY = bounds.minY;
  const maxY = bounds.maxY;

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Aspect ratio scale calculation (mirroring the main viewer)
  const drawWidth = dimensions.width - 2 * padding;
  const drawHeight = dimensions.height - 2 * padding;
  const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);

  const offsetX = padding + (drawWidth - rangeX * scale) / 2;
  const offsetY = padding + (drawHeight - rangeY * scale) / 2;

  // Projection/unprojection helpers
  const mapX = (val: number) => offsetX + (val - minX) * scale;
  const mapY = (val: number) => dimensions.height - (offsetY + (val - minY) * scale);

  const unmapX = (screenX: number) => minX + (screenX - offsetX) / scale;
  const unmapY = (screenY: number) => minY + (dimensions.height - screenY - offsetY) / scale;

  // Mouse event handlers
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'drawing' || !svgRef.current) return;

    // Do not add point if clicking on handle
    if ((e.target as SVGElement).tagName === 'circle') return;

    const rect = svgRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const tx = unmapX(screenX);
    const ty = unmapY(screenY);

    // If clicking near first point and polygon has at least 3 points, close it
    if (polygon.length >= 3) {
      const firstX = mapX(polygon[0].x);
      const firstY = mapY(polygon[0].y);
      const dist = Math.sqrt((screenX - firstX) ** 2 + (screenY - firstY) ** 2);
      
      if (dist < 12) {
        setMode('idle');
        return;
      }
    }

    onChange([...polygon, { x: tx, y: ty }]);
  };

  const handleHandleMouseDown = (e: React.MouseEvent<SVGCircleElement>, index: number) => {
    if (mode !== 'editing') return;
    e.stopPropagation();
    setDragIndex(index);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'editing' || dragIndex === null || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Constrain within bounds
    const tx = Math.max(minX, Math.min(maxX, unmapX(screenX)));
    const ty = Math.max(minY, Math.min(maxY, unmapY(screenY)));

    const updated = [...polygon];
    updated[dragIndex] = { x: tx, y: ty };
    onChange(updated);
  };

  const handleSvgMouseUp = () => {
    setDragIndex(null);
  };

  // Build points attribute for SVG
  const pointsStr = polygon.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ');

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={handleSvgClick}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
        style={{
          cursor: mode === 'drawing' ? 'crosshair' : 'default',
        }}
      >
        {/* Render filled polygon or open polyline */}
        {polygon.length > 0 && (
          mode !== 'drawing' && polygon.length >= 3 ? (
            <polygon
              points={pointsStr}
              fill="rgba(8, 145, 178, 0.12)"
              stroke="#0891B2"
              strokeWidth={2}
              className="transition-colors duration-150"
            />
          ) : (
            <polyline
              points={pointsStr}
              fill="none"
              stroke="#0891B2"
              strokeWidth={2}
              strokeDasharray="4"
            />
          )
        )}

        {/* Draw line preview connecting back to first vertex in drawing mode */}
        {mode === 'drawing' && polygon.length >= 3 && (
          <line
            x1={mapX(polygon[polygon.length - 1].x)}
            y1={mapY(polygon[polygon.length - 1].y)}
            x2={mapX(polygon[0].x)}
            y2={mapY(polygon[0].y)}
            stroke="#0891B2"
            strokeWidth={1.5}
            strokeDasharray="3"
            className="opacity-60"
          />
        )}

        {/* Drag Handles for editing mode */}
        {mode === 'editing' &&
          polygon.map((vertex, index) => (
            <g key={index} className="cursor-move pointer-events-auto">
              {/* Invisible larger hover circle */}
              <circle
                cx={mapX(vertex.x)}
                cy={mapY(vertex.y)}
                r={12}
                fill="transparent"
                onMouseDown={(e) => handleHandleMouseDown(e, index)}
              />
              {/* Visible circle handle */}
              <circle
                cx={mapX(vertex.x)}
                cy={mapY(vertex.y)}
                r={6}
                fill={dragIndex === index ? '#06b6d4' : '#ffffff'}
                stroke="#0891B2"
                strokeWidth={2.5}
                className="transition-all duration-100"
              />
              {/* Point index badge text overlay */}
              <text
                x={mapX(vertex.x)}
                y={mapY(vertex.y) - 10}
                textAnchor="middle"
                className="text-[9px] font-bold font-mono fill-[#0891B2] bg-white pointer-events-none select-none"
              >
                P{index + 1}
              </text>
            </g>
          ))}

        {/* Highlight first point in drawing mode to indicate closure */}
        {mode === 'drawing' && polygon.length >= 3 && (
          <g className="cursor-pointer">
            <circle
              cx={mapX(polygon[0].x)}
              cy={mapY(polygon[0].y)}
              r={10}
              fill="rgba(8, 145, 178, 0.2)"
              stroke="#0891B2"
              strokeWidth={1}
              strokeDasharray="2"
              onClick={() => setMode('idle')}
            />
            <circle
              cx={mapX(polygon[0].x)}
              cy={mapY(polygon[0].y)}
              r={4}
              fill="#0891B2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
