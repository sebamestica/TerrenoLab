export interface DEMPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface DEMMetadata {
  width: number;
  height: number;
  sourceFormat: "TIF" | "GeoTIFF";
  crsName?: string;
  epsg?: number | null;
  pixelSizeX?: number | null;
  pixelSizeY?: number | null;
  noDataValue?: number | null;
  originalCellCount: number;
  sampledPointCount: number;
  discardedPointCount: number;
  samplingStep: number;
  minZ: number;
  maxZ: number;
  integerValueRatio: number;
  repeatedValueRatio: number;
  readTimeMs?: number;
  samplingTimeMs?: number;
  processingTimeMs?: number;
}

export interface DEMParseResult {
  points: DEMPoint[];
  metadata: DEMMetadata;
  warnings: string[];
}
