import React, { useRef, useState, useEffect } from 'react';

interface PolygonSelectionOverlayProps {
  polygon: Array<{ x: number; y: number }>;
  onChange: (polygon: Array<{ x: number; y: number }>) => void;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  dimensions: { width: number; height: number };
  mode: 'drawing' | 'editing' | 'idle';
  setMode: (mode: 'drawing' | 'editing' | 'idle') => void;
  isValidPolygon?: boolean;
  draggedIndex?: number | null;
  onDragIndexChange?: (index: number | null) => void;
  isDark?: boolean;
}

export function PolygonSelectionOverlay({
  polygon,
  onChange,
  bounds,
  dimensions,
  mode,
  setMode,
  isValidPolygon = true,
  draggedIndex = null,
  onDragIndexChange,
  isDark = false,
}: PolygonSelectionOverlayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Reset drag index if we leave editing mode
  useEffect(() => {
    if (mode !== 'editing') {
      if (onDragIndexChange) {
        onDragIndexChange(null);
      }
    }
  }, [mode, onDragIndexChange]);

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

    if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

    // If clicking near first point and polygon has at least 3 points, close it
    if (polygon.length >= 3) {
      const firstX = mapX(polygon[0].x);
      const firstY = mapY(polygon[0].y);
      const dist = Math.sqrt((screenX - firstX) ** 2 + (screenY - firstY) ** 2);
      
      if (dist < 14) {
        setMode('idle');
        return;
      }
    }

    onChange([...polygon, { x: tx, y: ty }]);
  };

  const handleHandleMouseDown = (e: React.MouseEvent<SVGCircleElement | SVGTextElement | SVGGElement>, index: number) => {
    if (mode !== 'editing') return;
    if (!polygon || polygon.length === 0) return;
    if (index < 0 || index >= polygon.length) return;
    e.stopPropagation();
    if (onDragIndexChange) {
      onDragIndexChange(index);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'editing' || draggedIndex === null || draggedIndex === undefined || !svgRef.current) return;
    if (!polygon || polygon.length === 0) return;
    if (draggedIndex < 0 || draggedIndex >= polygon.length) return;

    const rect = svgRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const tx = unmapX(screenX);
    const ty = unmapY(screenY);

    if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

    // Constrain within bounds
    const constrainedX = Math.max(minX, Math.min(maxX, tx));
    const constrainedY = Math.max(minY, Math.min(maxY, ty));

    const updated = [...polygon];
    updated[draggedIndex] = { x: constrainedX, y: constrainedY };
    onChange(updated);
  };

  const handleSvgMouseUp = () => {
    if (onDragIndexChange) {
      onDragIndexChange(null);
    }
  };

  // Build points attribute for SVG
  const pointsStr = polygon.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ');

  // Determine cursor shape based on tool mode
  const getCursorStyle = () => {
    if (mode === 'drawing') return 'crosshair';
    if (mode === 'editing') {
      return draggedIndex !== null ? 'grabbing' : 'default';
    }
    return 'default';
  };

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
          cursor: getCursorStyle(),
        }}
      >
        {/* Render filled polygon or open polyline */}
        {polygon.length > 0 && (
          mode !== 'drawing' && polygon.length >= 3 ? (
            <polygon
              points={pointsStr}
              fill={isValidPolygon ? "rgba(8, 145, 178, 0.15)" : "rgba(220, 38, 38, 0.05)"}
              stroke={isValidPolygon ? "#0891B2" : "#DC2626"}
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

        {/* Render Vertices in all modes */}
        {polygon.map((vertex, index) => {
          const isFirst = index === 0;
          const isDragged = draggedIndex === index;
          const isHovered = hoveredIndex === index;
          const cx = mapX(vertex.x);
          const cy = mapY(vertex.y);

          return (
            <g
              key={index}
              className={`${mode === 'editing' ? 'cursor-move' : ''} pointer-events-auto`}
              onMouseEnter={() => mode === 'editing' && setHoveredIndex(index)}
              onMouseLeave={() => mode === 'editing' && setHoveredIndex(null)}
              onMouseDown={(e) => mode === 'editing' && handleHandleMouseDown(e, index)}
            >
              <title>{isFirst ? "Punto inicial" : `Vértice P${index + 1}`}</title>
              
              {/* Invisible larger hover/drag target area */}
              {mode === 'editing' && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="transparent"
                />
              )}

              {/* Pulsing ring for first point to highlight closure */}
              {isFirst && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth={1.5}
                  strokeDasharray="2"
                  className={mode === 'drawing' ? 'animate-pulse' : ''}
                />
              )}

              {/* Main vertex circle */}
              {isDragged ? (
                // Active/Dragged style: cyan solid, white outer ring
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill="#0891B2"
                  stroke="#ffffff"
                  strokeWidth={3}
                  style={{
                    filter: 'drop-shadow(0px 2px 4px rgba(8, 145, 178, 0.4))',
                    cursor: 'grabbing'
                  }}
                />
              ) : isHovered ? (
                // Hover style: bigger, thicker border, grab cursor
                <circle
                  cx={cx}
                  cy={cy}
                  r={8}
                  fill="#ffffff"
                  stroke={isFirst ? "#16A34A" : "#0891B2"}
                  strokeWidth={3.5}
                  style={{
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))',
                    cursor: 'grab'
                  }}
                />
              ) : (
                // Normal style: white fill, cyan/green border, radius 6px, soft shadow
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="#ffffff"
                  stroke={isFirst ? "#16A34A" : "#0891B2"}
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15))'
                  }}
                />
              )}

              {/* Vertex Label Badge (P1, P2...) */}
              <g className="pointer-events-none select-none">
                <rect
                  x={cx - 13}
                  y={cy - 24}
                  width={26}
                  height={14}
                  rx={3}
                  fill={isDark ? '#1e293b' : '#ffffff'}
                  stroke={isFirst ? '#16A34A' : '#0891B2'}
                  strokeWidth={1}
                  opacity={polygon.length > 15 ? 0.4 : 0.85}
                  style={{
                    filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))'
                  }}
                />
                <text
                  x={cx}
                  y={cy - 13}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill={isFirst ? '#16A34A' : '#0891B2'}
                  opacity={polygon.length > 15 ? 0.5 : 1}
                >
                  P{index + 1}
                </text>
              </g>
            </g>
          );
        })}

        {/* Highlight first point in drawing mode to indicate closure */}
        {mode === 'drawing' && polygon.length >= 3 && (
          <g 
            className="cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setMode('idle');
            }}
          >
            <circle
              cx={mapX(polygon[0].x)}
              cy={mapY(polygon[0].y)}
              r={12}
              fill="rgba(22, 163, 74, 0.2)"
              stroke="#16A34A"
              strokeWidth={1.5}
              strokeDasharray="2"
              className="animate-pulse"
            />
            <circle
              cx={mapX(polygon[0].x)}
              cy={mapY(polygon[0].y)}
              r={4}
              fill="#16A34A"
            />
            <title>Cerrar polígono</title>
          </g>
        )}
      </svg>
    </div>
  );
}
