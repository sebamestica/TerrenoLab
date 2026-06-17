import { TerrainPoint } from './types';
import { TERRAIN_LIMITS } from '../../config/limits';

export interface GridCell {
  x: number;
  y: number;
  z: number;
}

export interface InterpolationGrid {
  cols: number;
  rows: number;
  cells: GridCell[][];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface IDWParameters {
  power: number;         // Distance weighting power (usually 2.0)
  gridSize: number;      // Size of grid cell in units (e.g., 5m, 10m)
  searchRadius?: number; // Optional max distance to search for neighbors
}

export interface IDWOptions {
  resolution: 'low' | 'medium' | 'high';
  power: number;
  maxPoints?: number;
}

export interface IDWSurfaceResult {
  method: 'IDW';
  resolution: number;
  power: number;
  gridX: number[];
  gridY: number[];
  gridZ: number[][];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  minZ: number;
  maxZ: number;
  deltaZ: number;
  processingTimeMs: number;
}

/**
 * Generates an interpolation grid using Inverse Distance Weighting (IDW).
 */
export function generateIDWSurface(
  points: TerrainPoint[],
  options: IDWOptions
): IDWSurfaceResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  if (points.length === 0) {
    return {
      method: 'IDW',
      resolution: 0,
      power: options.power,
      gridX: [],
      gridY: [],
      gridZ: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      minZ: 0,
      maxZ: 0,
      deltaZ: 0,
      processingTimeMs: 0
    };
  }

  let resolutionSize = TERRAIN_LIMITS.idwResolutions.medium;
  if (options.resolution === 'low') resolutionSize = TERRAIN_LIMITS.idwResolutions.low;
  else if (options.resolution === 'medium') resolutionSize = TERRAIN_LIMITS.idwResolutions.medium;
  else if (options.resolution === 'high') resolutionSize = TERRAIN_LIMITS.idwResolutions.high;

  const cols = resolutionSize;
  const rows = resolutionSize;

  const dx = (maxX - minX) / (cols - 1 || 1);
  const dy = (maxY - minY) / (rows - 1 || 1);

  const gridX: number[] = [];
  for (let c = 0; c < cols; c++) {
    gridX.push(minX + c * dx);
  }

  const gridY: number[] = [];
  for (let r = 0; r < rows; r++) {
    gridY.push(minY + r * dy);
  }

  const targetPoints = options.maxPoints && points.length > options.maxPoints
    ? points.slice(0, options.maxPoints)
    : points;

  const power = options.power;
  const gridZ: number[][] = [];
  let minZInterpolated = Infinity;
  let maxZInterpolated = -Infinity;

  for (let r = 0; r < rows; r++) {
    const rowZ: number[] = [];
    const y = gridY[r];

    for (let c = 0; c < cols; c++) {
      const x = gridX[c];

      let sumWeights = 0;
      let sumWeightedZ = 0;
      let exactMatchZ: number | null = null;

      for (let i = 0; i < targetPoints.length; i++) {
        const p = targetPoints[i];
        const distSq = (x - p.x) ** 2 + (y - p.y) ** 2;

        if (distSq < 1e-8) {
          exactMatchZ = p.z;
          break;
        }

        const dist = Math.sqrt(distSq);
        const w = 1 / Math.pow(dist, power);
        sumWeights += w;
        sumWeightedZ += w * p.z;
      }

      let z = 0;
      if (exactMatchZ !== null) {
        z = exactMatchZ;
      } else if (sumWeights > 0) {
        z = sumWeightedZ / sumWeights;
      } else {
        z = points[0]?.z || 0;
      }

      // Safeguards against NaN/Infinity
      if (isNaN(z) || !isFinite(z)) {
        z = points[0]?.z || 0;
      }

      if (z < minZInterpolated) minZInterpolated = z;
      if (z > maxZInterpolated) maxZInterpolated = z;

      rowZ.push(parseFloat(z.toFixed(3)));
    }
    gridZ.push(rowZ);
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const processingTimeMs = Math.round(endTime - startTime);

  return {
    method: 'IDW',
    resolution: resolutionSize,
    power,
    gridX,
    gridY,
    gridZ,
    bounds: { minX, maxX, minY, maxY },
    minZ: minZInterpolated === Infinity ? 0 : minZInterpolated,
    maxZ: maxZInterpolated === -Infinity ? 0 : maxZInterpolated,
    deltaZ: maxZInterpolated === -Infinity || minZInterpolated === Infinity ? 0 : maxZInterpolated - minZInterpolated,
    processingTimeMs,
  };
}

/**
 * Generates an interpolation grid using Inverse Distance Weighting (IDW) - Legacy wrapper.
 */
export function interpolateSurfaceIDW(
  points: TerrainPoint[],
  params: IDWParameters
): InterpolationGrid {
  if (points.length === 0) {
    return { cols: 0, rows: 0, cells: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = params.gridSize || 10;
  const cols = Math.max(2, Math.ceil(width / cellSize));

  const result = generateIDWSurface(points, {
    resolution: cols <= TERRAIN_LIMITS.idwResolutions.low ? 'low' : cols <= TERRAIN_LIMITS.idwResolutions.medium ? 'medium' : 'high',
    power: params.power || 2.0
  });

  return {
    cols: result.gridX.length,
    rows: result.gridY.length,
    cells: result.gridY.map((y, r) => result.gridX.map((x, c) => ({
      x,
      y,
      z: result.gridZ[r][c]
    }))),
    minX: result.bounds.minX,
    maxX: result.bounds.maxX,
    minY: result.bounds.minY,
    maxY: result.bounds.maxY
  };
}
