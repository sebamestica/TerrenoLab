import { TerrainPoint } from './types';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Calculates the bounding box for a set of 2D/3D points.
 */
export function calculateBoundingBox(points: TerrainPoint[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Calculates the horizontal area of the bounding box.
 */
export function calculateBoundingBoxArea(bbox: BoundingBox): number {
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  return width * height;
}
