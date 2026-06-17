import { TERRAIN_LIMITS } from '../../config/limits';
import { sanitizeText } from '../security/sanitizeText';

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  delimiter: ',' | ';';
}

/**
 * Parses raw CSV text and extracts headers, raw rows, and delimiter.
 * Supports comma (,) and semicolon (;) delimiters, skips empty rows,
 * and strips spaces and surrounding quotes.
 * Applies strict limits to prevent memory abuse.
 */
export function parseCSV(text: string): CSVParseResult {
  if (!text || text.trim() === '') {
    throw new Error('El archivo está vacío.');
  }

  // Split lines and filter out empty rows
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length === 0) {
    throw new Error('El archivo no contiene filas válidas.');
  }

  // Detect delimiter based on character counts in the header line
  const headerLine = lines[0];
  if (headerLine.length > 5000) {
    throw new Error('La cabecera del archivo es absurdamente larga. Formato inválido.');
  }

  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Extract headers and strip surrounding quotes
  const rawHeaders = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  if (rawHeaders.length > 100) {
    throw new Error(`El archivo tiene demasiadas columnas (${rawHeaders.length}). Límite: 100.`);
  }

  const headers = rawHeaders.map(h => sanitizeText(h, 50));

  const rows: Record<string, string>[] = [];
  
  // Limitar a maxPoints + 100 de tolerancia antes de abortar para no bloquear RAM
  const maxRowsToProcess = TERRAIN_LIMITS.maxProcessedPoints + 100;

  for (let i = 1; i < lines.length; i++) {
    if (rows.length > maxRowsToProcess) {
      throw new Error(`El archivo excede el límite máximo de puntos (${TERRAIN_LIMITS.maxProcessedPoints}).`);
    }

    if (lines[i].length > 5000) {
      continue; // Skip extremely long rows to prevent freeze
    }

    const rawCells = lines[i].split(delimiter);
    
    // Check if the row is completely empty
    const isEmpty = rawCells.every(cell => cell.trim() === '');
    if (isEmpty) continue;

    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const cellVal = rawCells[c] !== undefined ? rawCells[c].trim().replace(/^["']|["']$/g, '') : '';
      row[headers[c]] = sanitizeText(cellVal, 100);
    }
    
    rows.push(row);
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    delimiter,
  };
}
