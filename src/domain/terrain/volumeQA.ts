import { IDWSurfaceResult } from './interpolation';
import { VolumeOptions, VolumeResult, calculatePolygonArea, isPointInPolygon } from './volume';

export interface VolumeQAResult {
  isValid: boolean;
  warnings: string[];
  blockers: string[];
}

/**
 * Checks if line segment AB intersects segment CD.
 */
function doSegmentsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number }
): boolean {
  const ccw = (p1: typeof a, p2: typeof a, p3: typeof a) => {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  };
  return (ccw(a, c, d) !== ccw(b, c, d)) && (ccw(a, b, c) !== ccw(a, b, d));
}

/**
 * Checks if a polygon's boundary self-intersects.
 */
export function hasSelfIntersection(polygon: { x: number; y: number }[]): boolean {
  const n = polygon.length;
  if (n < 4) return false;

  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // Skip adjacent segments
      const c = polygon[j];
      const d = polygon[(j + 1) % n];
      if (doSegmentsIntersect(a, b, c, d)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates the parameters and geometry of a volume estimation calculation.
 */
export function validateVolumeAnalysis(
  surface: IDWSurfaceResult | null,
  polygon: { x: number; y: number }[],
  options: VolumeOptions,
  selectedCRS: string,
  metrics: { minX: number; maxX: number; minY: number; maxY: number } | null
): VolumeQAResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Surface existence
  if (!surface) {
    blockers.push('No existe una superficie IDW interpolada sobre la cual calcular volumen.');
    return { isValid: false, warnings, blockers };
  }

  // 2. Coordinate range verification (Geographic lat/lon check)
  if (metrics) {
    const isGeographic = 
      metrics.minX >= -180 && 
      metrics.maxX <= 180 && 
      metrics.minY >= -90 && 
      metrics.maxY <= 90;
      
    if (isGeographic) {
      blockers.push('Las coordenadas parecen geográficas (grados lat/lon). TerrenoLab aún no reproyecta coordenadas, por lo que no puede calcular volúmenes en m³.');
      return { isValid: false, warnings, blockers };
    }
  }

  // 3. Polygon structure
  if (polygon.length === 0) {
    blockers.push('No se ha dibujado ningún polígono de análisis.');
  } else if (polygon.length < 3) {
    blockers.push('El polígono de análisis está incompleto: requiere al menos 3 vértices.');
  } else {
    // Area check
    const area = calculatePolygonArea(polygon);
    if (area <= 0) {
      blockers.push('El área del polígono de análisis es cero o negativa.');
    }

    // Self-intersection check
    if (hasSelfIntersection(polygon)) {
      blockers.push('El polígono de análisis contiene auto-intersecciones (se cruza a sí mismo). Revise los vértices.');
    }

    // Cells inside check
    let cellsInside = 0;
    const cols = surface.gridX.length;
    const rows = surface.gridY.length;
    for (let r = 0; r < rows; r++) {
      const cy = surface.gridY[r];
      for (let c = 0; c < cols; c++) {
        const cx = surface.gridX[c];
        if (isPointInPolygon(cx, cy, polygon)) {
          cellsInside++;
        }
      }
    }

    if (cellsInside === 0) {
      blockers.push('Ninguna celda de la grilla de superficie IDW cae dentro del polígono seleccionado. Dibuje un área más amplia o sobre el terreno.');
    }
  }

  // 4. Target elevation
  if (options.targetElevation === undefined || isNaN(options.targetElevation) || !isFinite(options.targetElevation)) {
    blockers.push('La cota objetivo no está definida o no es un valor numérico finito.');
  }

  // 5. Factors positive checks
  if (options.compactionFactor <= 0 || isNaN(options.compactionFactor) || !isFinite(options.compactionFactor)) {
    blockers.push('El factor de compactación debe ser un valor numérico positivo mayor a cero.');
  }
  if (options.wasteFactor <= 0 || isNaN(options.wasteFactor) || !isFinite(options.wasteFactor)) {
    blockers.push('El factor de pérdida / contingencia debe ser un valor numérico positivo mayor a cero.');
  }

  // 6. Pricing negative checks
  if (options.materialPricePerM3 !== undefined && options.materialPricePerM3 < 0) {
    blockers.push('El precio por m³ ingresado no puede ser negativo.');
  }
  if (options.fixedTransportCost !== undefined && options.fixedTransportCost < 0) {
    blockers.push('El costo fijo de transporte ingresado no puede ser negativo.');
  }

  // 7. Local CRS warning
  if (selectedCRS === 'LOCAL') {
    warnings.push('El sistema de coordenadas es local XY (descriptivo). Confirme que X e Y están expresados en metros antes de calcular volumen.');
  }

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers
  };
}
