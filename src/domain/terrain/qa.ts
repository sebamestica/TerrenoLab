import { TerrainPoint } from './types';
import { calculateBoundingBox, calculateBoundingBoxArea } from './geometry';

export interface ElevationStats {
  minZ: number;
  maxZ: number;
  meanZ: number;
  medianZ: number;
  stdZ: number;
  deltaZ: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface OutlierResult {
  outlierCount: number;
  outlierRatio: number;
  lowerLimit: number;
  upperLimit: number;
  outliers: TerrainPoint[];
}

export interface SpatialCoverageResult {
  boundingBoxArea: number;
  convexHullArea: number;
  coverageRatio: number;
  pointDensity: number;
  averageNearestNeighborDistance: number;
  minNearestNeighborDistance: number;
  maxNearestNeighborDistance: number;
}

export type DatasetType = 'DEM_GRID' | 'FIELD_SURVEY' | 'POSSIBLE_HILLSHADE' | 'UNKNOWN';

export interface ClassifierResult {
  datasetType: DatasetType;
  confidence: number;
  reasons: string[];
}

export interface QualityScoreResult {
  score: number; // 0 to 100
  label: 'Excelente' | 'Buena' | 'Regular' | 'Baja' | 'Crítica';
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  canReview: boolean;
  canInterpolate: boolean;
}

export interface TopographicQAResult {
  elevationStats: ElevationStats;
  outlierResult: OutlierResult;
  spatialCoverage: SpatialCoverageResult;
  classification: ClassifierResult;
  quality: QualityScoreResult;
}

/**
 * Computes Convex Hull for a set of points using the Monotone Chain algorithm.
 */
export function computeConvexHull(points: TerrainPoint[]): TerrainPoint[] {
  if (points.length <= 1) return [...points];
  
  // Sort by X, then by Y as tie-breaker
  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  const crossProduct = (o: TerrainPoint, a: TerrainPoint, b: TerrainPoint) => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  };

  const lower: TerrainPoint[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: TerrainPoint[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Calculates the polygon area using the Shoelace formula.
 */
export function computePolygonArea(hull: TerrainPoint[]): number {
  if (hull.length < 3) return 0;
  let area = 0;
  const n = hull.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += hull[i].x * hull[j].y - hull[j].x * hull[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Main function to perform comprehensive Topographic QA on a dataset.
 */
export function performTopographicQA(points: TerrainPoint[]): TopographicQAResult {
  const n = points.length;

  // Fallback for empty/insufficient points
  if (n === 0) {
    const emptyStats = { minZ: 0, maxZ: 0, meanZ: 0, medianZ: 0, stdZ: 0, deltaZ: 0, q1: 0, q3: 0, iqr: 0 };
    const emptyOutliers = { outlierCount: 0, outlierRatio: 0, lowerLimit: 0, upperLimit: 0, outliers: [] };
    const emptyCoverage = { boundingBoxArea: 0, convexHullArea: 0, coverageRatio: 0, pointDensity: 0, averageNearestNeighborDistance: 0, minNearestNeighborDistance: 0, maxNearestNeighborDistance: 0 };
    return {
      elevationStats: emptyStats,
      outlierResult: emptyOutliers,
      spatialCoverage: emptyCoverage,
      classification: { datasetType: 'UNKNOWN', confidence: 0, reasons: ['No hay datos suficientes para clasificar'] },
      quality: { score: 0, label: 'Crítica', blockers: ['El dataset está vacío.'], warnings: [], recommendations: [], canReview: false, canInterpolate: false }
    };
  }

  // 1. Elevation Stats
  const zValues = points.map(p => p.z).sort((a, b) => a - b);
  const minZ = zValues[0];
  const maxZ = zValues[n - 1];
  const deltaZ = maxZ - minZ;
  
  const sumZ = zValues.reduce((acc, val) => acc + val, 0);
  const meanZ = sumZ / n;

  const mid = Math.floor(n / 2);
  const medianZ = n % 2 === 0 ? (zValues[mid - 1] + zValues[mid]) / 2 : zValues[mid];

  const varianceZ = zValues.reduce((acc, val) => acc + Math.pow(val - meanZ, 2), 0) / n;
  const stdZ = Math.sqrt(varianceZ);

  const getPercentile = (arr: number[], pct: number): number => {
    const k = (arr.length - 1) * (pct / 100);
    const idx = Math.floor(k);
    const frac = k - idx;
    if (idx + 1 < arr.length) {
      return (1 - frac) * arr[idx] + frac * arr[idx + 1];
    }
    return arr[idx];
  };

  const q1 = getPercentile(zValues, 25);
  const q3 = getPercentile(zValues, 75);
  const iqr = q3 - q1;

  const elevationStats: ElevationStats = { minZ, maxZ, meanZ, medianZ, stdZ, deltaZ, q1, q3, iqr };

  // 2. Detección de Outliers Z
  const lowerLimit = q1 - 1.5 * iqr;
  const upperLimit = q3 + 1.5 * iqr;
  const outliers = points.filter(p => p.z < lowerLimit || p.z > upperLimit);
  const outlierCount = outliers.length;
  const outlierRatio = outlierCount / n;

  const outlierResult: OutlierResult = { outlierCount, outlierRatio, lowerLimit, upperLimit, outliers };

  // 3. Análisis Espacial & Bounding Box
  const bbox = calculateBoundingBox(points);
  const boundingBoxArea = calculateBoundingBoxArea(bbox);
  
  const hull = computeConvexHull(points);
  const convexHullArea = computePolygonArea(hull);
  const coverageRatio = boundingBoxArea > 0 ? convexHullArea / boundingBoxArea : 0;
  const pointDensity = boundingBoxArea > 0 ? n / boundingBoxArea : 0;

  // Nearest Neighbor Calculation (with Sampling safety for large datasets)
  let targetPoints = points;
  let isSampled = false;
  if (n > 10000) {
    isSampled = true;
    // Sample 2000 points randomly for performance
    const sampledIndices = new Set<number>();
    while (sampledIndices.size < Math.min(2000, n)) {
      sampledIndices.add(Math.floor(Math.random() * n));
    }
    targetPoints = Array.from(sampledIndices).map(idx => points[idx]);
  }

  const nnDistances: number[] = [];
  let minNearestNeighborDistance = Infinity;
  let maxNearestNeighborDistance = -Infinity;

  for (let i = 0; i < targetPoints.length; i++) {
    const p1 = targetPoints[i];
    let nearestDist = Infinity;
    for (let j = 0; j < n; j++) {
      const p2 = points[j];
      if (p1.id === p2.id) continue;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) nearestDist = dist;
    }
    if (nearestDist !== Infinity) {
      nnDistances.push(nearestDist);
      if (nearestDist < minNearestNeighborDistance) minNearestNeighborDistance = nearestDist;
      if (nearestDist > maxNearestNeighborDistance) maxNearestNeighborDistance = nearestDist;
    }
  }

  const nnSum = nnDistances.reduce((acc, d) => acc + d, 0);
  const averageNearestNeighborDistance = nnDistances.length > 0 ? nnSum / nnDistances.length : 0;
  const finalMinNND = minNearestNeighborDistance === Infinity ? 0 : minNearestNeighborDistance;
  const finalMaxNND = maxNearestNeighborDistance === -Infinity ? 0 : maxNearestNeighborDistance;

  const spatialCoverage: SpatialCoverageResult = {
    boundingBoxArea,
    convexHullArea,
    coverageRatio,
    pointDensity,
    averageNearestNeighborDistance,
    minNearestNeighborDistance: finalMinNND,
    maxNearestNeighborDistance: finalMaxNND,
  };

  // 4. Detección de Raster Sospechoso / Tipo de Dataset
  let datasetType: DatasetType = 'UNKNOWN';
  let confidence = 0.5;
  const reasons: string[] = [];

  // Check integer properties for Possible Hillshade
  const integerZCount = points.filter(p => Math.abs(p.z - Math.round(p.z)) < 1e-4).length;
  const integerRatio = integerZCount / n;
  const allZInColorRange = points.every(p => p.z >= 0 && p.z <= 255);
  const uniqueZCount = new Set(points.map(p => p.z)).size;

  // Check unique X and Y grid alignment
  const uniqueXCount = new Set(points.map(p => p.x)).size;
  const uniqueYCount = new Set(points.map(p => p.y)).size;
  
  // Compute coefficient of variation of NN distances
  let stdDevNN = 0;
  if (nnDistances.length > 0) {
    const nnVariance = nnDistances.reduce((acc, d) => acc + Math.pow(d - averageNearestNeighborDistance, 2), 0) / nnDistances.length;
    stdDevNN = Math.sqrt(nnVariance);
  }
  const cvNN = averageNearestNeighborDistance > 0 ? stdDevNN / averageNearestNeighborDistance : 0;

  if (n >= 3 && allZInColorRange && integerRatio > 0.85 && uniqueZCount <= 256) {
    datasetType = 'POSSIBLE_HILLSHADE';
    confidence = Math.max(0.7, integerRatio);
    reasons.push(`El 100% de los valores Z están en el rango [0, 255].`);
    reasons.push(`El ${(integerRatio * 100).toFixed(1)}% de las cotas son números enteros.`);
    reasons.push(`Hay ${uniqueZCount} valores únicos de cota (típico de imágenes raster en escala de grises).`);
  } else if (n >= 9 && cvNN < 0.09 && uniqueXCount * uniqueYCount < n * 1.5 && uniqueXCount < n * 0.5 && uniqueYCount < n * 0.5) {
    datasetType = 'DEM_GRID';
    confidence = 1 - cvNN;
    reasons.push(`La distancia al vecino más cercano es extremadamente constante (coeficiente de variación = ${(cvNN * 100).toFixed(2)}%).`);
    reasons.push(`Los puntos están alineados en una grilla regular de ${uniqueXCount} columnas por ${uniqueYCount} filas.`);
  } else if (n >= 3) {
    datasetType = 'FIELD_SURVEY';
    confidence = 0.8;
    reasons.push(`Las coordenadas y distancias entre puntos son irregulares.`);
    reasons.push(`Hay una variación de espaciamiento normal entre estaciones topográficas.`);
  }

  const classification: ClassifierResult = { datasetType, confidence, reasons };

  // 5. Score de Calidad
  let score = 100;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Rules based on point count
  if (n < 3) {
    score = 0;
    blockers.push('Se requieren al menos 3 puntos para el modelado digital de terreno.');
  } else if (n < 10) {
    score -= 20;
    warnings.push('El conjunto contiene muy pocos puntos (menos de 10) para un análisis de relieve confiable.');
    recommendations.push('Aumente la densidad del levantamiento cargando más puntos de control.');
  }

  // Rules based on possible Hillshade
  if (datasetType === 'POSSIBLE_HILLSHADE') {
    score = Math.max(10, score - 80);
    blockers.push('Los datos cargados parecen ser un Hillshade / Imagen raster y no elevaciones reales.');
    recommendations.push('Verifique que no haya importado una columna de intensidad visual o índice de gris en lugar de la cota real del terreno.');
  }

  // Outliers penalty
  if (outlierCount > 0 && n >= 5) {
    const penalty = Math.min(25, Math.round(outlierRatio * 100));
    score -= penalty;
    warnings.push(`Se detectó un ${(outlierRatio * 100).toFixed(1)}% de outliers en las cotas de elevación (${outlierCount} puntos).`);
    recommendations.push(`Revise en la tabla inferior los puntos marcados como outliers (cota inferior a ${lowerLimit.toFixed(2)}m o superior a ${upperLimit.toFixed(2)}m).`);
  }

  // Coverage penalty
  if (n >= 4 && coverageRatio < 0.45 && boundingBoxArea > 1) {
    score -= 15;
    warnings.push(`Baja cobertura espacial: el área convexa del levantamiento cubre solo el ${(coverageRatio * 100).toFixed(1)}% de la caja de contención.`);
    recommendations.push('Agregue puntos de control en los márgenes exteriores para evitar extrapolaciones erróneas.');
  }

  // Flat terrain warning
  if (n >= 3 && deltaZ === 0) {
    score -= 10;
    warnings.push('El terreno es completamente plano (Delta Z = 0 m).');
    recommendations.push('Aunque es válido, recuerde que no se podrán modelar curvas de nivel sobre un plano horizontal.');
  }

  // Large dataset warning
  if (isSampled) {
    warnings.push('Dataset grande (> 10,000 puntos): el espaciamiento de vecinos se estimó mediante muestreo estadístico.');
  }

  // Recommended labels
  let label: 'Excelente' | 'Buena' | 'Regular' | 'Baja' | 'Crítica' = 'Excelente';
  if (score >= 85) label = 'Excelente';
  else if (score >= 70) label = 'Buena';
  else if (score >= 50) label = 'Regular';
  else if (score >= 30) label = 'Baja';
  else label = 'Crítica';

  // Overriding label based on blockers
  if (blockers.length > 0) {
    label = 'Crítica';
  }

  const canReview = n >= 3;
  const hasExtremelyLowCoverage = n >= 4 && coverageRatio < 0.35;
  const hasExtremeOutliers = n >= 5 && outlierRatio > 0.15;
  const isSuspiciousHillshade = datasetType === 'POSSIBLE_HILLSHADE' && confidence >= 0.85;

  const canInterpolate = canReview && 
                         label !== 'Crítica' && 
                         !isSuspiciousHillshade && 
                         !hasExtremelyLowCoverage && 
                         !hasExtremeOutliers;

  const quality: QualityScoreResult = {
    score,
    label,
    blockers,
    warnings,
    recommendations: recommendations.length > 0 ? recommendations : ['El dataset es conforme y apto para ser procesado.'],
    canReview,
    canInterpolate,
  };

  return {
    elevationStats,
    outlierResult,
    spatialCoverage,
    classification,
    quality,
  };
}
