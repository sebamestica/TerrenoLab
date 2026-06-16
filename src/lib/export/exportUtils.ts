import { TerrainPoint } from '../../domain/terrain/types';
import { ContourLine } from '../../domain/terrain/contours';
import { ValidationError } from '../../domain/terrain/validation';

/**
 * Sanitizes a filename:
 * - removes invalid characters \/:*?"<>|
 * - replaces spaces with underscores
 * - limits length to 80 characters
 * - handles empty/null input safely
 */
export function sanitizeFilename(name: string): string {
  if (!name) return 'archivo';
  
  // Remove slashes and invalid Windows characters
  let sanitized = name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\.-]/g, '');

  if (!sanitized) {
    sanitized = 'archivo';
  }

  // Clamps to 80 characters, preserving the file extension if possible
  const extIndex = sanitized.lastIndexOf('.');
  if (extIndex !== -1 && sanitized.length - extIndex <= 10) {
    const ext = sanitized.substring(extIndex);
    const base = sanitized.substring(0, extIndex);
    const maxBaseLen = 80 - ext.length;
    if (base.length > maxBaseLen) {
      sanitized = base.substring(0, maxBaseLen) + ext;
    }
  } else {
    if (sanitized.length > 80) {
      sanitized = sanitized.substring(0, 80);
    }
  }

  return sanitized;
}

/**
 * Helper to get descriptive CRS metadata.
 */
export function getCRSMetadata(crs: string) {
  switch (crs) {
    case 'WGS84_18S':
      return {
        type: 'EPSG' as const,
        name: 'WGS 84 / UTM Zona 18S',
        epsg: 32718,
        reprojectionApplied: false,
      };
    case 'WGS84_19S':
      return {
        type: 'EPSG' as const,
        name: 'WGS 84 / UTM Zona 19S',
        epsg: 32719,
        reprojectionApplied: false,
      };
    case 'WGS84_20S':
      return {
        type: 'EPSG' as const,
        name: 'WGS 84 / UTM Zona 20S',
        epsg: 32720,
        reprojectionApplied: false,
      };
    case 'SIRGAS_18S':
      return {
        type: 'EPSG' as const,
        name: 'SIRGAS-Chile 2002 / UTM Zona 18S',
        epsg: 5362,
        reprojectionApplied: false,
      };
    case 'SIRGAS_19S':
      return {
        type: 'EPSG' as const,
        name: 'SIRGAS-Chile 2002 / UTM Zona 19S',
        epsg: 5361,
        reprojectionApplied: false,
      };
    case 'LOCAL':
    default:
      return {
        type: 'LOCAL' as const,
        name: 'Sistema local XY',
        epsg: null,
        reprojectionApplied: false,
      };
  }
}

/**
 * Generates a standard CAD DXF string representing points, bounding box and contour lines.
 */
export function exportContoursToDXF(
  points: TerrainPoint[],
  contours: ContourLine[],
  crs: string
): string {
  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let minZ = 0;
  if (points.length > 0) {
    minZ = points[0].z;
  }
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
    if (pt.z < minZ) minZ = pt.z;
  }

  const crsMetadata = getCRSMetadata(crs);
  const dateStr = new Date().toISOString();

  let dxf = '';
  
  // 1. HEADER section
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '999\nTerrenoLab DXF Export\n';
  dxf += `999\nDate: ${dateStr}\n`;
  dxf += `999\nCRS: ${crsMetadata.name}\n`;
  if (crsMetadata.epsg) {
    dxf += `999\nEPSG: ${crsMetadata.epsg}\n`;
  }
  dxf += '999\nReprojection Applied: false\n';
  if (crs === 'LOCAL') {
    dxf += '999\nWarning: Cartesian Local coordinates. Do not use for geographic mapping.\n';
  }
  dxf += '0\nENDSEC\n';

  // 2. TABLES section with LAYER definitions
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n4\n';
  dxf += '0\nLAYER\n2\nCONTOURS\n70\n0\n62\n4\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nINDEX_CONTOURS\n70\n0\n62\n1\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nTERRAIN_POINTS\n70\n0\n62\n3\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nBOUNDING_BOX\n70\n0\n62\n2\n6\nCONTINUOUS\n';
  dxf += '0\nENDTAB\n0\nENDSEC\n';

  // 3. BLOCKS section (standard empty block)
  dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';

  // 4. ENTITIES section
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // A. Export Bounding Box as 4 LINE entities in BOUNDING_BOX layer
  if (points.length > 0 && minX !== Infinity) {
    const bbox = [
      { x1: minX, y1: minY, x2: maxX, y2: minY },
      { x1: maxX, y1: minY, x2: maxX, y2: maxY },
      { x1: maxX, y1: maxY, x2: minX, y2: maxY },
      { x1: minX, y1: maxY, x2: minX, y2: minY },
    ];
    for (const b of bbox) {
      dxf += '0\nLINE\n8\nBOUNDING_BOX\n';
      dxf += `10\n${b.x1}\n20\n${b.y1}\n30\n${minZ}\n`;
      dxf += `11\n${b.x2}\n21\n${b.y2}\n31\n${minZ}\n`;
    }
  }

  // B. Export points as POINT entities in TERRAIN_POINTS layer
  for (const pt of points) {
    dxf += '0\nPOINT\n8\nTERRAIN_POINTS\n';
    dxf += `10\n${pt.x}\n20\n${pt.y}\n30\n${pt.z}\n`;
  }

  // C. Export contours as LINE entities in CONTOURS or INDEX_CONTOURS layer
  for (const contour of contours) {
    const layer = contour.isIndex ? 'INDEX_CONTOURS' : 'CONTOURS';
    const level = contour.level;
    for (const seg of contour.segments) {
      dxf += '0\nLINE\n999\n';
      dxf += `Elevation: ${level}\n8\n${layer}\n`;
      dxf += `10\n${seg.x1}\n20\n${seg.y1}\n30\n${level}\n`;
      dxf += `11\n${seg.x2}\n21\n${seg.y2}\n31\n${level}\n`;
    }
  }

  dxf += '0\nENDSEC\n0\nEOF\n';
  return dxf;
}

/**
 * Backward compatibility alias.
 */
export function exportToDXF(points: TerrainPoint[], contours: ContourLine[]): string {
  return exportContoursToDXF(points, contours, 'LOCAL');
}

/**
 * Exports terrain points back into a CSV string.
 * Columns: id,x,y,z
 */
export function exportToCSV(points: TerrainPoint[]): string {
  let csv = 'id,x,y,z\n';
  for (const pt of points) {
    csv += `${pt.id},${pt.x},${pt.y},${pt.z}\n`;
  }
  return csv;
}

/**
 * Serializes validation errors to a CSV string.
 * Columns: row,type,message
 */
export function exportValidationErrorsToCSV(errors: ValidationError[]): string {
  let csv = 'row,type,message\n';
  for (const err of errors) {
    // Escape message double quotes for CSV compliance
    const escapedMsg = err.message.replace(/"/g, '""');
    csv += `${err.rowNumber},Error,"${escapedMsg}"\n`;
  }
  return csv;
}

/**
 * Exports contour lines as a GeoJSON FeatureCollection.
 */
export function exportContoursToGeoJSON(
  contours: ContourLine[],
  crs: string,
  interval: number
): string {
  const crsMetadata = getCRSMetadata(crs);

  const features = contours.map((contour) => {
    // represent segments as a MultiLineString coordinate list
    const coordinates = contour.segments.map(seg => [
      [seg.x1, seg.y1, contour.level],
      [seg.x2, seg.y2, contour.level]
    ]);

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'MultiLineString' as const,
        coordinates: coordinates
      },
      properties: {
        level: contour.level,
        isIndex: contour.isIndex,
        interval: interval,
        source: 'TerrenoLab',
        method: 'IDW + Marching Squares',
        crsName: crsMetadata.name,
        epsg: crsMetadata.epsg,
        reprojectionApplied: false
      }
    };
  });

  const geojson: any = {
    type: 'FeatureCollection',
    metadata: {
      crs: {
        type: crsMetadata.type,
        name: crsMetadata.name,
        epsg: crsMetadata.epsg,
        reprojectionApplied: false
      },
      generatedBy: 'TerrenoLab',
      version: 'MVP-Phase-6'
    },
    features: features
  };

  if (crsMetadata.epsg) {
    geojson.crs = {
      type: 'name',
      properties: {
        name: `urn:ogc:def:crs:EPSG::${crsMetadata.epsg}`
      }
    };
  }

  if (crs === 'LOCAL') {
    geojson.warning = 'Advertencia: Las coordenadas son locales Cartesianas (XY) y no representan longitud/latitud geográfica real.';
  }

  return JSON.stringify(geojson, null, 2);
}

/**
 * Backward compatibility alias.
 */
export function exportToGeoJSON(contours: ContourLine[]): string {
  return exportContoursToGeoJSON(contours, 'LOCAL', 1.0);
}

/**
 * Triggers a browser file download of a string content.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
