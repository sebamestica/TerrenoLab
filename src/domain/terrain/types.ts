export interface TerrainPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface TerrainDataset {
  name: string;
  points: TerrainPoint[];
  source: 'csv' | 'sample';
  createdAt: string;
}

export interface TerrainMetrics {
  pointCount: number;
  minZ: number;
  maxZ: number;
  deltaZ: number;
  boundingBoxArea: number;
  pointDensity: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
