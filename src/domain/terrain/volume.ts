import { IDWSurfaceResult } from './interpolation';

export interface VolumeOptions {
  targetElevation: number;
  compactionFactor: number;
  wasteFactor: number;
  materialPricePerM3?: number;
  fixedTransportCost?: number;
}

export interface VolumeResult {
  polygonArea: number;
  polygonPerimeter: number;
  targetElevation: number;
  rawFillVolume: number;
  rawCutVolume: number;
  netVolume: number;
  recommendedFillVolume: number;
  compactionFactor: number;
  wasteFactor: number;
  materialPricePerM3?: number;
  estimatedMaterialCost?: number;
  estimatedTotalCost?: number;
  cellsEvaluated: number;
  cellsInsidePolygon: number;
  minExistingZ: number;
  maxExistingZ: number;
  meanExistingZ: number;
}

/**
 * Ray casting algorithm to determine if a point (x, y) is inside a polygon.
 */
export function isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates the area of a 2D polygon using the Shoelace formula.
 */
export function calculatePolygonArea(polygon: { x: number; y: number }[]): number {
  let area = 0;
  const n = polygon.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calculates the perimeter of a 2D polygon.
 */
export function calculatePolygonPerimeter(polygon: { x: number; y: number }[]): number {
  let perimeter = 0;
  const n = polygon.length;
  if (n < 2) return 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = polygon[j].x - polygon[i].x;
    const dy = polygon[j].y - polygon[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/**
 * Calculates Cut and Fill Volumes for a given IDW surface and a boundary polygon.
 */
export function calculateCutFillVolume(
  surface: IDWSurfaceResult,
  polygon: { x: number; y: number }[],
  options: VolumeOptions
): VolumeResult {
  const { targetElevation, compactionFactor, wasteFactor, materialPricePerM3, fixedTransportCost } = options;
  
  const polygonArea = calculatePolygonArea(polygon);
  const polygonPerimeter = calculatePolygonPerimeter(polygon);
  
  let rawFillVolume = 0;
  let rawCutVolume = 0;
  let cellsInsidePolygon = 0;
  
  let minExistingZ = Infinity;
  let maxExistingZ = -Infinity;
  let sumZ = 0;
  
  const cols = surface.gridX.length;
  const rows = surface.gridY.length;
  const cellsEvaluated = cols * rows;

  // Calculate cell width and height in meters
  const dx = (surface.bounds.maxX - surface.bounds.minX) / (cols - 1 || 1);
  const dy = (surface.bounds.maxY - surface.bounds.minY) / (rows - 1 || 1);
  const cellArea = dx * dy;

  if (polygon.length >= 3) {
    for (let r = 0; r < rows; r++) {
      const cy = surface.gridY[r];
      for (let c = 0; c < cols; c++) {
        const cx = surface.gridX[c];
        
        if (isPointInPolygon(cx, cy, polygon)) {
          cellsInsidePolygon++;
          const currentZ = surface.gridZ[r][c];
          
          minExistingZ = Math.min(minExistingZ, currentZ);
          maxExistingZ = Math.max(maxExistingZ, currentZ);
          sumZ += currentZ;

          const diff = targetElevation - currentZ;
          if (diff > 0) {
            rawFillVolume += diff * cellArea;
          } else if (diff < 0) {
            rawCutVolume += Math.abs(diff) * cellArea;
          }
        }
      }
    }
  }

  const hasCells = cellsInsidePolygon > 0;
  const meanExistingZ = hasCells ? sumZ / cellsInsidePolygon : 0;
  const finalMinZ = hasCells ? minExistingZ : 0;
  const finalMaxZ = hasCells ? maxExistingZ : 0;
  
  const netVolume = rawFillVolume - rawCutVolume;
  const recommendedFillVolume = rawFillVolume * compactionFactor * wasteFactor;
  
  // Costing calculations
  let estimatedMaterialCost: number | undefined = undefined;
  let estimatedTotalCost: number | undefined = undefined;
  
  if (materialPricePerM3 !== undefined && materialPricePerM3 > 0) {
    estimatedMaterialCost = recommendedFillVolume * materialPricePerM3;
    estimatedTotalCost = estimatedMaterialCost + (fixedTransportCost || 0);
  }

  return {
    polygonArea,
    polygonPerimeter,
    targetElevation,
    rawFillVolume,
    rawCutVolume,
    netVolume,
    recommendedFillVolume,
    compactionFactor,
    wasteFactor,
    materialPricePerM3,
    estimatedMaterialCost,
    estimatedTotalCost,
    cellsEvaluated,
    cellsInsidePolygon,
    minExistingZ: finalMinZ,
    maxExistingZ: finalMaxZ,
    meanExistingZ,
  };
}
