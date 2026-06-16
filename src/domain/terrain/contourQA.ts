import { IDWSurfaceResult } from './interpolation';
import { SurfaceQAResult } from './surfaceQA';
import { ContourResult } from './contours';

export interface ContourQAResult {
  isValid: boolean;
  levelCount: number;
  segmentCount: number;
  outOfBoundsSegments: number;
  duplicateSegments: number;
  emptyLevels: number;
  minLevel: number;
  maxLevel: number;
  expectedMinLevel: number;
  expectedMaxLevel: number;
  warnings: string[];
  blockers: string[];
}

/**
 * Analyzes the geometric and mathematical quality of generated contour lines.
 */
export function analyzeContourQuality(
  surface: IDWSurfaceResult | null,
  contourResult: ContourResult | null,
  surfaceQA?: SurfaceQAResult | null
): ContourQAResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Initialize return properties
  let levelCount = 0;
  let segmentCount = 0;
  let outOfBoundsSegments = 0;
  let duplicateSegments = 0;
  let emptyLevels = 0;
  let minLevel = 0;
  let maxLevel = 0;
  let expectedMinLevel = 0;
  let expectedMaxLevel = 0;

  // 1. Validation: Check if surface exists
  if (!surface) {
    blockers.push('No hay superficie de interpolación disponible.');
    return {
      isValid: false,
      levelCount,
      segmentCount,
      outOfBoundsSegments,
      duplicateSegments,
      emptyLevels,
      minLevel,
      maxLevel,
      expectedMinLevel,
      expectedMaxLevel,
      warnings,
      blockers,
    };
  }

  // 2. Check if surface QA has blockers
  if (surfaceQA && surfaceQA.blockers.length > 0) {
    for (const surfaceBlocker of surfaceQA.blockers) {
      blockers.push(`La superficie base tiene un error crítico de QA: ${surfaceBlocker}`);
    }
  }

  // Calculate expected levels based on current surface range and contour interval
  const interval = contourResult?.interval || 2.0;
  expectedMinLevel = Math.ceil(surface.minZ / interval) * interval;
  expectedMaxLevel = Math.floor(surface.maxZ / interval) * interval;

  // 3. Validation: Check if contour result is null
  if (!contourResult) {
    blockers.push('No se han generado curvas de nivel.');
    return {
      isValid: false,
      levelCount,
      segmentCount,
      outOfBoundsSegments,
      duplicateSegments,
      emptyLevels,
      minLevel,
      maxLevel,
      expectedMinLevel,
      expectedMaxLevel,
      warnings,
      blockers,
    };
  }

  levelCount = contourResult.lineCount;
  segmentCount = contourResult.segmentCount;
  minLevel = contourResult.minLevel;
  maxLevel = contourResult.maxLevel;

  // 4. Validation: Check contourResult generator errors
  if (contourResult.error === 'TOO_MANY_LEVELS') {
    blockers.push('El intervalo seleccionado genera demasiados niveles (más de 300).');
  }
  if (contourResult.error === 'INSUFFICIENT_RANGE') {
    blockers.push('Rango altimétrico insuficiente para el intervalo de curvas seleccionado.');
  }

  // 5. Validation: Geometrical checks
  let hasNaN = false;
  let hasInfinity = false;
  let hasLevelOutOfBounds = false;
  const tolerance = 0.01;
  const { minX, maxX, minY, maxY } = surface.bounds;

  if (contourResult.lines) {
    for (const line of contourResult.lines) {
      const H = line.level;

      // Check level bounds against surface Z range
      if (H < surface.minZ - tolerance || H > surface.maxZ + tolerance) {
        hasLevelOutOfBounds = true;
        blockers.push(`Se detectó un nivel de curva (${H}m) fuera del rango altimétrico de la superficie (${surface.minZ.toFixed(2)}m - ${surface.maxZ.toFixed(2)}m).`);
      }

      if (line.segments.length === 0) {
        emptyLevels++;
      }

      // Check duplicates per level
      const seen = new Set<string>();

      for (const seg of line.segments) {
        const { x1, y1, x2, y2 } = seg;

        // Check NaN/Infinity
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
          hasNaN = true;
        }
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
          hasInfinity = true;
        }

        // Check if segment is outside bounding box
        if (
          x1 < minX - tolerance || x1 > maxX + tolerance ||
          y1 < minY - tolerance || y1 > maxY + tolerance ||
          x2 < minX - tolerance || x2 > maxX + tolerance ||
          y2 < minY - tolerance || y2 > maxY + tolerance
        ) {
          outOfBoundsSegments++;
        }

        // Duplicates detection (rounded to 5 decimal places)
        const p1 = `${x1.toFixed(5)},${y1.toFixed(5)}`;
        const p2 = `${x2.toFixed(5)},${y2.toFixed(5)}`;
        const key1 = `${p1}_${p2}`;
        const key2 = `${p2}_${p1}`;

        if (seen.has(key1) || seen.has(key2)) {
          duplicateSegments++;
        } else {
          seen.add(key1);
        }
      }
    }
  }

  // Blocker conditions from geometrical checks
  if (hasNaN) {
    blockers.push('Se detectaron coordenadas indefinidas (NaN) en los segmentos de las curvas.');
  }
  if (hasInfinity) {
    blockers.push('Se detectaron coordenadas infinitas en los segmentos de las curvas.');
  }
  if (outOfBoundsSegments > 0) {
    blockers.push(`Se detectaron ${outOfBoundsSegments} segmentos fuera del bounding box del terreno.`);
  }
  if (contourResult.levels.length > 300) {
    blockers.push(`Se generaron ${contourResult.levels.length} niveles, superando el límite de 300.`);
  }

  // Warning conditions
  if (contourResult.levels.length === 0) {
    warnings.push('No se trazaron niveles altimétricos.');
  }
  if (emptyLevels > 0) {
    warnings.push(`Se detectaron ${emptyLevels} niveles vacíos (sin segmentos delineados).`);
  }
  if (duplicateSegments > 0) {
    warnings.push(`Se detectaron ${duplicateSegments} segmentos duplicados.`);
  }

  // Small relief warning
  const surfaceZRange = surface.maxZ - surface.minZ;
  if (surfaceZRange < 0.1) {
    warnings.push(`El rango altimétrico de la superficie (${surfaceZRange.toFixed(3)}m) es extremadamente pequeño, lo que puede producir curvas poco estables.`);
  }

  // Interval consistency verification check
  const expectedLevelsFor05 = Math.floor(surfaceZRange / 0.5) + 1;
  const expectedLevelsFor5 = Math.floor(surfaceZRange / 5.0) + 1;
  if (expectedLevelsFor05 > 1 && expectedLevelsFor5 > 1 && expectedLevelsFor05 < expectedLevelsFor5) {
    warnings.push('Anomalía matemática: La estimación de niveles para equidistancia 0.5m es menor que para 5.0m.');
  }

  const isValid = blockers.length === 0;

  return {
    isValid,
    levelCount,
    segmentCount,
    outOfBoundsSegments,
    duplicateSegments,
    emptyLevels,
    minLevel,
    maxLevel,
    expectedMinLevel,
    expectedMaxLevel,
    warnings,
    blockers,
  };
}
