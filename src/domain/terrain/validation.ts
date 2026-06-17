import { TerrainPoint } from './types';
import { DEMMetadata } from '../../lib/dem/demTypes';
import { DEMQAResult } from './demQA';

export interface ColumnMapping {
  idColumn: string; // empty if none mapped
  xColumn: string;
  yColumn: string;
  zColumn: string;
}

export interface ValidationError {
  rowNumber: number; // 1-indexed row in the spreadsheet
  message: string;
}

export interface ValidationWarning {
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  validPoints: TerrainPoint[];
  rejectedRows: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    duplicatedXY: number;
    minZ: number;
    maxZ: number;
    deltaZ: number;
  };
  demMetadata?: DEMMetadata;
  demQA?: DEMQAResult;
}

/**
 * Normalizes, cleans and validates raw CSV rows into valid terrain points.
 * Handles decimal separators, empty values, NaNs, duplicates and height ranges.
 */
export function normalizeTerrainRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ValidationResult {
  const validPoints: TerrainPoint[] = [];
  const rejectedRows: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const seenCoords = new Set<string>();
  let duplicatedXY = 0;

  let minZ = Infinity;
  let maxZ = -Infinity;

  const totalRows = rows.length;

  for (let i = 0; i < totalRows; i++) {
    const rawRow = rows[i];
    const rowNumber = i + 2; // Row 1 is the header row, so index 0 is Row 2.

    const idRaw = mapping.idColumn ? rawRow[mapping.idColumn] : '';
    const xRaw = rawRow[mapping.xColumn];
    const yRaw = rawRow[mapping.yColumn];
    const zRaw = rawRow[mapping.zColumn];

    // Check empty fields
    if (xRaw === undefined || yRaw === undefined || zRaw === undefined) {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Falta mapear una columna obligatoria.`,
      });
      continue;
    }

    const xTrim = xRaw.trim();
    const yTrim = yRaw.trim();
    const zTrim = zRaw.trim();

    if (xTrim === '' || yTrim === '') {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenada X o Y vacía.`,
      });
      continue;
    }

    if (zTrim === '') {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenada Z vacía o nula.`,
      });
      continue;
    }

    // Clean and parse numbers
    const x = parseCleanNumber(xTrim);
    const y = parseCleanNumber(yTrim);
    const z = parseCleanNumber(zTrim);

    // Check NaN & Infinity
    if (isNaN(x) || isNaN(y)) {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenada X/Y no es numérica. Valores leídos: X='${xRaw}', Y='${yRaw}'`,
      });
      continue;
    }

    if (isNaN(z)) {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenada Z (Cota) no es numérica. Valor leído: Z='${zRaw}'`,
      });
      continue;
    }

    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenadas contienen valores infinitos inválidos.`,
      });
      continue;
    }

    // Check Z elevation bounds (-500m <= Z <= 9000m)
    if (z < -500 || z > 9000) {
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Altura Z fuera de rango permitido (-500m <= Z <= 9000m). Valor leído: Z=${z}m`,
      });
      continue;
    }

    // Check duplicates on X,Y coordinate pair
    const coordKey = `${x.toFixed(3)}_${y.toFixed(3)}`;
    if (seenCoords.has(coordKey)) {
      duplicatedXY++;
      rejectedRows.push({
        rowNumber,
        message: `Fila ${rowNumber}: Coordenada X/Y duplicada. Valores: X=${x}, Y=${y}`,
      });
      continue;
    }
    seenCoords.add(coordKey);

    // Generate Point ID if missing
    const id = idRaw ? idRaw.trim() : `P${validPoints.length + 1}`;

    // Track elevations
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    validPoints.push({
      id,
      x,
      y,
      z,
    });
  }

  // Check minimum 3 points count
  if (validPoints.length < 3) {
    rejectedRows.push({
      rowNumber: 0,
      message: `El dataset contiene solo ${validPoints.length} puntos válidos. Se requieren al menos 3 puntos para el modelado digital de terreno.`,
    });
  }

  // Warning for flat terrain
  if (validPoints.length >= 3 && minZ === maxZ) {
    warnings.push({
      message: 'El terreno es completamente plano (Delta Z = 0). Las curvas de nivel no podrán ser generadas.',
    });
  }

  const hasCriticalErrors = rejectedRows.some(e => e.rowNumber === 0 || e.message.includes('Mínimo') || e.message.includes('Falta'));
  const isValid = validPoints.length >= 3 && !hasCriticalErrors;

  // Truncar lista de errores si es excesivamente grande
  const maxErrorsToShow = 50;
  const originalRejectedCount = rejectedRows.length;
  let finalRejectedRows = rejectedRows;

  if (finalRejectedRows.length > maxErrorsToShow) {
    finalRejectedRows = finalRejectedRows.slice(0, maxErrorsToShow);
    finalRejectedRows.push({
      rowNumber: 0,
      message: `Se han omitido ${originalRejectedCount - maxErrorsToShow} errores adicionales.`,
    });
  }

  return {
    isValid,
    validPoints,
    rejectedRows: finalRejectedRows,
    warnings,
    summary: {
      totalRows,
      validRows: validPoints.length,
      rejectedRows: originalRejectedCount,
      duplicatedXY,
      minZ: validPoints.length > 0 ? minZ : 0,
      maxZ: validPoints.length > 0 ? maxZ : 0,
      deltaZ: validPoints.length > 0 ? maxZ - minZ : 0,
    },
  };
}

/**
 * Helper to clean space segments and parse numeric strings.
 * Supports comma (,) as decimal separator if dot (.) is not present.
 */
function parseCleanNumber(val: string): number {
  let cleaned = val.replace(/\s/g, ''); // strip whitespace
  
  // Replace comma decimal with dot if there is no dot
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }

  return Number(cleaned);
}
