import { TerrainPoint } from './types';
import { IDWSurfaceResult } from './interpolation';

export interface SurfaceQAResult {
  originalMinZ: number;
  originalMaxZ: number;
  surfaceMinZ: number;
  surfaceMaxZ: number;
  minDifference: number; // originalMinZ - surfaceMinZ
  maxDifference: number; // originalMaxZ - surfaceMaxZ
  hasNaN: boolean;
  hasInfinity: boolean;
  gridRows: number;
  gridCols: number;
  cellCount: number;
  zRangeOriginal: number;
  zRangeSurface: number;
  isStable: boolean;
  warnings: string[];
  blockers: string[];
}

/**
 * Performs a comprehensive mathematical quality check on the generated IDW surface.
 */
export function analyzeSurfaceQuality(
  points: TerrainPoint[],
  surface: IDWSurfaceResult
): SurfaceQAResult {
  let originalMinZ = Infinity;
  let originalMaxZ = -Infinity;

  for (const p of points) {
    if (p.z < originalMinZ) originalMinZ = p.z;
    if (p.z > originalMaxZ) originalMaxZ = p.z;
  }

  if (points.length === 0) {
    originalMinZ = 0;
    originalMaxZ = 0;
  }

  let surfaceMinZ = Infinity;
  let surfaceMaxZ = -Infinity;
  let hasNaN = false;
  let hasInfinity = false;

  const gridRows = surface.gridZ.length;
  const gridCols = surface.gridZ[0]?.length || 0;
  const cellCount = gridRows * gridCols;

  for (let r = 0; r < gridRows; r++) {
    const row = surface.gridZ[r];
    for (let c = 0; c < gridCols; c++) {
      const z = row[c];
      if (isNaN(z)) {
        hasNaN = true;
      } else if (!isFinite(z)) {
        hasInfinity = true;
      } else {
        if (z < surfaceMinZ) surfaceMinZ = z;
        if (z > surfaceMaxZ) surfaceMaxZ = z;
      }
    }
  }

  if (cellCount === 0) {
    surfaceMinZ = 0;
    surfaceMaxZ = 0;
  }

  const minDifference = originalMinZ - surfaceMinZ;
  const maxDifference = originalMaxZ - surfaceMaxZ;
  const zRangeOriginal = originalMaxZ - originalMinZ;
  const zRangeSurface = surfaceMaxZ - surfaceMinZ;

  const blockers: string[] = [];
  const warnings: string[] = [];

  // Blockers check
  if (hasNaN) {
    blockers.push('La superficie contiene valores indefinidos (NaN). El cálculo de curvas está bloqueado.');
  }
  if (hasInfinity) {
    blockers.push('La superficie contiene valores infinitos. El cálculo de curvas está bloqueado.');
  }
  if (cellCount === 0) {
    blockers.push('La superficie no contiene celdas. Genere una superficie válida primero.');
  }

  // IDW property: interpolated elevations MUST lie within the range of original points
  // We use an epsilon of 0.01 to account for floating point decimal rounding.
  if (surfaceMinZ < originalMinZ - 0.01) {
    blockers.push(`Cota mínima interpolada (${surfaceMinZ.toFixed(3)}m) menor que la cota mínima original (${originalMinZ.toFixed(3)}m). Anomalía matemática de interpolación.`);
  }
  if (surfaceMaxZ > originalMaxZ + 0.01) {
    blockers.push(`Cota máxima interpolada (${surfaceMaxZ.toFixed(3)}m) mayor que la cota máxima original (${originalMaxZ.toFixed(3)}m). Anomalía matemática de interpolación.`);
  }

  // Warnings check
  if (zRangeOriginal > 0.001) {
    const rangeRatio = zRangeSurface / zRangeOriginal;
    if (rangeRatio < 0.5) {
      warnings.push(`Atenuación severa del relieve: la superficie interpolada cubre solo el ${(rangeRatio * 100).toFixed(1)}% del rango altimétrico original. El terreno se ha suavizado de forma significativa.`);
    }
  }

  if (surface.power === 1) {
    warnings.push('Potencia IDW baja (p=1.0): La interpolación suaviza en exceso los relieves locales y puede aplanar crestas.');
  } else if (surface.power === 4) {
    warnings.push('Potencia IDW alta (p=4.0): La interpolación puede generar artefactos "bull\'s eye" (picos localizados) alrededor de los puntos.');
  }

  // Check for outliers in original dataset
  // Let's perform a simple statistical check here (Tukey method)
  if (points.length >= 5) {
    const zSorted = points.map(p => p.z).sort((a, b) => a - b);
    const getPercentile = (arr: number[], pct: number): number => {
      const k = (arr.length - 1) * (pct / 100);
      const idx = Math.floor(k);
      const frac = k - idx;
      if (idx + 1 < arr.length) return (1 - frac) * arr[idx] + frac * arr[idx + 1];
      return arr[idx];
    };
    const q1 = getPercentile(zSorted, 25);
    const q3 = getPercentile(zSorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const originalOutliers = points.filter(p => p.z < lowerBound || p.z > upperBound);
    if (originalOutliers.length > 0) {
      warnings.push(`El dataset original contiene ${originalOutliers.length} outliers altimétricos, lo que puede distorsionar localmente la superficie interpolada.`);
    }
  }

  const isStable = blockers.length === 0;

  return {
    originalMinZ,
    originalMaxZ,
    surfaceMinZ: surfaceMinZ === Infinity ? 0 : surfaceMinZ,
    surfaceMaxZ: surfaceMaxZ === -Infinity ? 0 : surfaceMaxZ,
    minDifference,
    maxDifference,
    hasNaN,
    hasInfinity,
    gridRows,
    gridCols,
    cellCount,
    zRangeOriginal,
    zRangeSurface,
    isStable,
    warnings,
    blockers,
  };
}
