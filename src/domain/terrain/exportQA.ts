import { TerrainPoint } from './types';
import { ValidationResult } from './validation';

export interface CSVQAResult {
  isValid: boolean;
  rowCount: number;
  expectedRows: number;
  warnings: string[];
  blockers: string[];
}

export interface QAValidationResult {
  isValid: boolean;
  warnings: string[];
  blockers: string[];
}

export interface ExportQAResult {
  isValid: boolean;
  selectedFiles: string[];
  validFiles: string[];
  warnings: string[];
  blockers: string[];
  lastExportTime: string | null;
}

/**
 * Validates a generated clean terrain points CSV string.
 */
export function validateCleanCSVExport(
  points: TerrainPoint[],
  csvText: string
): CSVQAResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!csvText) {
    blockers.push('El contenido del CSV limpio está vacío.');
    return { isValid: false, rowCount: 0, expectedRows: points.length, warnings, blockers };
  }

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    blockers.push('El CSV limpio no contiene líneas.');
    return { isValid: false, rowCount: 0, expectedRows: points.length, warnings, blockers };
  }

  // Header validation
  const header = lines[0];
  if (header !== 'id,x,y,z') {
    blockers.push(`Cabecera CSV incorrecta: se esperaba "id,x,y,z" pero se obtuvo "${header}".`);
  }

  const rowCount = lines.length - 1;
  if (rowCount !== points.length) {
    blockers.push(`Inconsistencia en el conteo de filas: el CSV tiene ${rowCount} filas pero validPoints tiene ${points.length} puntos.`);
  }

  // Evaluate lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');

    if (parts.length !== 4) {
      blockers.push(`Fila ${i + 1} malformada: contiene ${parts.length} columnas en lugar de 4.`);
      continue;
    }

    const [id, xStr, yStr, zStr] = parts;
    const expectedPt = points[i - 1];

    if (expectedPt) {
      if (id !== expectedPt.id) {
        blockers.push(`Fila ${i + 1}: ID inconsistente (Esperado: "${expectedPt.id}", obtenido: "${id}").`);
      }

      const x = parseFloat(xStr);
      const y = parseFloat(yStr);
      const z = parseFloat(zStr);

      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        blockers.push(`Fila ${i + 1} contiene valores indefinidos (NaN).`);
      }
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
        blockers.push(`Fila ${i + 1} contiene valores numéricos infinitos.`);
      }

      // Check decimal dot separator
      if ((xStr.includes('.') === false && x % 1 !== 0) || (yStr.includes('.') === false && y % 1 !== 0) || (zStr.includes('.') === false && z % 1 !== 0)) {
        warnings.push(`Fila ${i + 1}: Una o más coordenadas no parecen usar punto decimal.`);
      }
    }
  }

  const isValid = blockers.length === 0;
  return {
    isValid,
    rowCount,
    expectedRows: points.length,
    warnings,
    blockers,
  };
}

/**
 * Validates a generated validation errors CSV string.
 */
export function validateErrorsCSVExport(
  validation: ValidationResult | null,
  csvText: string
): QAValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validation || validation.rejectedRows.length === 0) {
    return { isValid: true, warnings, blockers };
  }

  if (!csvText) {
    blockers.push('El contenido del CSV de errores está vacío.');
    return { isValid: false, warnings, blockers };
  }

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    blockers.push('El CSV de errores no contiene líneas.');
    return { isValid: false, warnings, blockers };
  }

  // Header validation
  const header = lines[0];
  if (header !== 'row,type,message') {
    blockers.push(`Cabecera de errores CSV incorrecta: se esperaba "row,type,message" pero se obtuvo "${header}".`);
  }

  const rowCount = lines.length - 1;
  if (rowCount !== validation.rejectedRows.length) {
    blockers.push(`Inconsistencia en el conteo de errores: se esperaba ${validation.rejectedRows.length} pero el CSV tiene ${rowCount} filas.`);
  }

  // Audit stack traces or JS technical messages
  const jsTechPatterns = [
    /stack/i,
    /at\s+[\w\.\$<>]/i,
    /TypeError/i,
    /ReferenceError/i,
    /undefined/i,
    /\[object\s+Object\]/i,
    /null/i
  ];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of jsTechPatterns) {
      if (pattern.test(line)) {
        blockers.push(`Fila ${i + 1} de errores contiene trazas técnicas o mensajes sospechosos de JavaScript.`);
        break;
      }
    }
  }

  const isValid = blockers.length === 0;
  return {
    isValid,
    warnings,
    blockers,
  };
}

/**
 * Validates a generated technical JSON metadata summary object.
 */
export function validateJSONExport(jsonData: any): QAValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!jsonData) {
    blockers.push('El JSON técnico de análisis está vacío o no es un objeto válido.');
    return { isValid: false, warnings, blockers };
  }

  // 1. Mandatory sections check
  const requiredKeys = [
    'project',
    'dataset',
    'topographicQA',
    'surface',
    'surfaceQA',
    'contours',
    'contourQA',
    'generatedBy',
    'version',
    'crs'
  ];

  for (const key of requiredKeys) {
    if (jsonData[key] === undefined || jsonData[key] === null) {
      blockers.push(`Falta la sección obligatoria "${key}" en el JSON.`);
    }
  }

  // 2. Metadata verification
  if (jsonData.generatedBy !== 'TerrenoLab') {
    blockers.push(`Metadato de autoría incorrecto: se esperaba "TerrenoLab", se obtuvo "${jsonData.generatedBy}".`);
  }
  if (jsonData.version !== 'MVP-Phase-7.1') {
    blockers.push(`Metadato de versión incorrecto: se esperaba "MVP-Phase-7.1", se obtuvo "${jsonData.version}".`);
  }

  // 3. Prevent heavy arrays dump
  if (jsonData.surface?.gridZ !== undefined || jsonData.surface?.gridX !== undefined || jsonData.surface?.gridY !== undefined) {
    blockers.push('El JSON contiene los vectores completos de celdas o coordenadas IDW, excediendo el límite de peso permitido.');
  }

  // 4. Recursive React internal properties check
  const checkInternalReactProperties = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    for (const key in obj) {
      if (key.startsWith('__react') || key.startsWith('$$typeof') || key.startsWith('_react')) {
        return true;
      }
      if (checkInternalReactProperties(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (checkInternalReactProperties(jsonData)) {
    blockers.push('El JSON contiene referencias a estados internos de React o propiedades duplicadas.');
  }

  // 5. CRS structure check
  if (jsonData.crs) {
    const crs = jsonData.crs;
    if (crs.type === undefined || (crs.type !== 'LOCAL' && crs.type !== 'EPSG')) {
      blockers.push('La sección "crs" tiene un campo "type" inválido o inexistente (debe ser "LOCAL" o "EPSG").');
    }
    if (crs.name === undefined || typeof crs.name !== 'string') {
      blockers.push('La sección "crs" tiene un campo "name" inválido o inexistente.');
    }
    if (crs.epsg === undefined || (crs.epsg !== null && typeof crs.epsg !== 'number')) {
      blockers.push('La sección "crs" tiene un campo "epsg" inválido o inexistente (debe ser un número o null).');
    }
    if (crs.reprojectionApplied === undefined || crs.reprojectionApplied !== false) {
      blockers.push('La sección "crs" tiene un campo "reprojectionApplied" inválido o inexistente (debe ser false).');
    }
  }

  // 6. Volume check if present
  if (jsonData.volume !== undefined && jsonData.volume !== null) {
    const vol = jsonData.volume;
    if (typeof vol.method !== 'string') {
      blockers.push('La sección "volume" tiene un campo "method" inválido o inexistente.');
    }
    const volRequiredKeys = [
      'targetElevation',
      'rawFillVolume',
      'rawCutVolume',
      'netVolume',
      'recommendedFillVolume',
      'compactionFactor',
      'wasteFactor',
      'cellsInsidePolygon'
    ];
    for (const key of volRequiredKeys) {
      if (vol[key] === undefined || typeof vol[key] !== 'number') {
        blockers.push(`La sección "volume" tiene un campo "${key}" inválido o inexistente.`);
      }
    }
    const volOptionalKeys = [
      'materialPricePerM3',
      'estimatedMaterialCost',
      'fixedTransportCost',
      'estimatedTotalCost'
    ];
    for (const key of volOptionalKeys) {
      if (vol[key] !== undefined && vol[key] !== null && typeof vol[key] !== 'number') {
        blockers.push(`La sección "volume" tiene un campo "${key}" con un formato incorrecto (debe ser número o null).`);
      }
    }
    
    // Check volumeQA
    if (!vol.volumeQA || typeof vol.volumeQA !== 'object') {
      blockers.push('Falta el objeto "volumeQA" en la sección de volumen.');
    } else {
      const qa = vol.volumeQA;
      if (typeof qa.isValid !== 'boolean') {
        blockers.push('El campo "isValid" en "volumeQA" debe ser un booleano.');
      }
      if (!Array.isArray(qa.blockers) || !Array.isArray(qa.warnings)) {
        blockers.push('Los campos "blockers" y "warnings" en "volumeQA" deben ser arreglos.');
      }
    }

    // Check volumeAudit
    if (vol.volumeAudit !== undefined && vol.volumeAudit !== null) {
      const audit = vol.volumeAudit;
      if (typeof audit !== 'object') {
        blockers.push('La sección "volumeAudit" debe ser un objeto o null.');
      } else {
        if (typeof audit.isValid !== 'boolean') {
          blockers.push('El campo "isValid" en "volumeAudit" debe ser un booleano.');
        }
        if (!Array.isArray(audit.blockers) || !Array.isArray(audit.warnings)) {
          blockers.push('Los campos "blockers" y "warnings" en "volumeAudit" deben ser arreglos.');
        }
        const auditRequiredKeys = [
          'cellArea',
          'polygonArea',
          'sampledArea',
          'areaCoverageRatio',
          'fillCutBalanceCheck'
        ];
        for (const key of auditRequiredKeys) {
          if (audit[key] === undefined || typeof audit[key] !== 'number') {
            blockers.push(`La sección "volumeAudit" tiene un campo "${key}" inválido o inexistente.`);
          }
        }
        if (typeof audit.estimatedResolution !== 'string') {
          blockers.push('La sección "volumeAudit" tiene un campo "estimatedResolution" inválido o de tipo incorrecto.');
        }
      }
    }
  }

  const isValid = blockers.length === 0;
  return {
    isValid,
    warnings,
    blockers,
  };
}

/**
 * Validates a generated DXF string structure.
 */
export function validateDXFExport(dxfText: string): QAValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!dxfText || dxfText.trim().length === 0) {
    blockers.push('El archivo DXF está vacío.');
    return { isValid: false, warnings, blockers };
  }

  if (!dxfText.includes('HEADER')) {
    blockers.push('El archivo DXF no contiene la sección HEADER básica.');
  }

  if (!dxfText.includes('ENTITIES')) {
    blockers.push('El archivo DXF no contiene la sección ENTITIES.');
  }

  if (!dxfText.includes('LINE')) {
    blockers.push('El archivo DXF no contiene ninguna entidad LINE.');
  }

  if (dxfText.includes('NaN')) {
    blockers.push('El archivo DXF contiene valores inválidos (NaN).');
  }

  if (dxfText.includes('Infinity')) {
    blockers.push('El archivo DXF contiene valores numéricos infinitos.');
  }

  const jsTechPatterns = [
    /stack/i,
    /at\s+[\w\.\$<>]/i,
    /TypeError/i,
    /ReferenceError/i,
    /undefined/i,
    /\[object\s+Object\]/i,
    /null/i
  ];

  for (const pattern of jsTechPatterns) {
    if (pattern.test(dxfText)) {
      blockers.push('El archivo DXF contiene trazas técnicas o mensajes sospechosos de JavaScript.');
      break;
    }
  }

  const expectedLayers = ['CONTOURS', 'INDEX_CONTOURS', 'TERRAIN_POINTS', 'BOUNDING_BOX'];
  for (const layer of expectedLayers) {
    if (!dxfText.includes(layer)) {
      warnings.push(`El archivo DXF no parece contener la capa esperada: ${layer}.`);
    }
  }

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers
  };
}

/**
 * Validates a generated GeoJSON FeatureCollection string structure.
 */
export function validateGeoJSONExport(geojsonText: string, isLocal: boolean): QAValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!geojsonText || geojsonText.trim().length === 0) {
    blockers.push('El archivo GeoJSON está vacío.');
    return { isValid: false, warnings, blockers };
  }

  let data: any;
  try {
    data = JSON.parse(geojsonText);
  } catch (err) {
    blockers.push('El contenido de GeoJSON no es un JSON válido.');
    return { isValid: false, warnings, blockers };
  }

  if (data.type !== 'FeatureCollection') {
    blockers.push('El archivo GeoJSON no tiene el tipo FeatureCollection en la raíz.');
  }

  if (!Array.isArray(data.features) || data.features.length === 0) {
    blockers.push('El archivo GeoJSON no contiene un arreglo de features válido o está vacío.');
  } else {
    // Validate geometries and coordinates
    for (let i = 0; i < data.features.length; i++) {
      const feat = data.features[i];
      if (feat.type !== 'Feature') {
        blockers.push(`Feature ${i + 1} no es de tipo Feature.`);
        continue;
      }
      const geom = feat.geometry;
      if (!geom || (geom.type !== 'LineString' && geom.type !== 'MultiLineString')) {
        blockers.push(`Feature ${i + 1} no tiene una geometría válida de tipo LineString o MultiLineString.`);
        continue;
      }

      const coords = geom.coordinates;
      if (!Array.isArray(coords)) {
        blockers.push(`Feature ${i + 1} tiene coordenadas inválidas.`);
        continue;
      }

      const checkCoords = (arr: any[]): boolean => {
        for (const val of arr) {
          if (Array.isArray(val)) {
            if (!checkCoords(val)) return false;
          } else {
            if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
              return false;
            }
          }
        }
        return true;
      };

      if (!checkCoords(coords)) {
        blockers.push(`Feature ${i + 1} contiene coordenadas que no son numéricas, o contienen NaN/Infinity.`);
      }

      if (feat.properties === undefined || feat.properties.level === undefined) {
        blockers.push(`Feature ${i + 1} no incluye properties.level.`);
      }
    }
  }

  // Check metadata CRS
  if (!data.metadata || !data.metadata.crs) {
    blockers.push('El archivo GeoJSON no contiene el bloque de metadatos de CRS esperado.');
  } else {
    const crs = data.metadata.crs;
    if (crs.type === undefined || (crs.type !== 'LOCAL' && crs.type !== 'EPSG')) {
      blockers.push('Los metadatos CRS en GeoJSON tienen un campo "type" inválido o inexistente.');
    }
    if (crs.name === undefined || typeof crs.name !== 'string') {
      blockers.push('Los metadatos CRS en GeoJSON tienen un campo "name" inválido.');
    }
  }

  if (isLocal) {
    if (!geojsonText.includes('warning') && !data.warning) {
      warnings.push('El GeoJSON usa Sistema Local XY pero no incluye la advertencia de coordenadas locales en la raíz.');
    }
  }

  const strRepresentation = JSON.stringify(data);
  if (strRepresentation.includes('NaN')) {
    blockers.push('El archivo GeoJSON contiene texto "NaN".');
  }
  if (strRepresentation.includes('Infinity')) {
    blockers.push('El archivo GeoJSON contiene texto "Infinity".');
  }

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers
  };
}
