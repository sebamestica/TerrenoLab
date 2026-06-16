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
 */
export function parseCSV(text: string): CSVParseResult {
  if (!text || text.trim() === '') {
    return { headers: [], rows: [], rowCount: 0, delimiter: ',' };
  }

  // Split lines and filter out empty rows
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0, delimiter: ',' };
  }

  // Detect delimiter based on character counts in the header line
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Extract headers and strip surrounding quotes
  const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(delimiter);
    
    // Check if the row is completely empty
    const isEmpty = rawCells.every(cell => cell.trim() === '');
    if (isEmpty) continue;

    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const cellVal = rawCells[c] !== undefined ? rawCells[c].trim().replace(/^["']|["']$/g, '') : '';
      row[headers[c]] = cellVal;
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
