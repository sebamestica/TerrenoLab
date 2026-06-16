import { TerrainPoint, TerrainMetrics } from './types';
import { calculateBoundingBox, calculateBoundingBoxArea } from './geometry';

/**
 * Computes metrics for a dataset of terrain points.
 */
export function computeTerrainMetrics(points: TerrainPoint[]): TerrainMetrics {
  const pointCount = points.length;
  
  if (pointCount === 0) {
    return {
      pointCount: 0,
      minZ: 0,
      maxZ: 0,
      deltaZ: 0,
      boundingBoxArea: 0,
      pointDensity: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    };
  }

  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const p of points) {
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const bbox = calculateBoundingBox(points);
  const boundingBoxArea = calculateBoundingBoxArea(bbox);
  const pointDensity = boundingBoxArea > 0 ? pointCount / boundingBoxArea : 0;

  return {
    pointCount,
    minZ,
    maxZ,
    deltaZ: maxZ - minZ,
    boundingBoxArea,
    pointDensity,
    minX: bbox.minX,
    maxX: bbox.maxX,
    minY: bbox.minY,
    maxY: bbox.maxY,
  };
}
