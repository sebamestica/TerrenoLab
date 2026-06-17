import { DEMPoint } from './demTypes';
import { TERRAIN_LIMITS } from '../../config/limits';

const MAX_POINTS = TERRAIN_LIMITS.maxProcessedPoints;

/**
 * Samples a DEM raster down to a maximum of 20,000 points.
 * Cleans data by removing NoData, NaN, Infinity, and extreme values (-500 > z > 9000).
 */
export function sampleDEM(
  width: number,
  height: number,
  rasterData: number[] | Float32Array,
  noDataValue: number | null,
  transform: number[] | null
): { points: DEMPoint[]; samplingStep: number; minZ: number; maxZ: number; discardedPointCount: number; integerValueRatio: number; repeatedValueRatio: number } {
  const totalCells = width * height;
  let samplingStep = 1;

  if (totalCells > MAX_POINTS) {
    // We want approximately MAX_POINTS.
    // (width / step) * (height / step) = MAX_POINTS
    // step^2 = (width * height) / MAX_POINTS
    samplingStep = Math.ceil(Math.sqrt(totalCells / MAX_POINTS));
  }

  const points: DEMPoint[] = [];
  let minZ = Infinity;
  let maxZ = -Infinity;
  let discardedPointCount = 0;
  let integerCount = 0;
  const uniqueZs = new Set<number>();
  let totalConsidered = 0;

  for (let y = 0; y < height; y += samplingStep) {
    for (let x = 0; x < width; x += samplingStep) {
      const index = y * width + x;
      const z = rasterData[index];

      totalConsidered++;

      // Clean data
      if (
        z === noDataValue ||
        Number.isNaN(z) ||
        !Number.isFinite(z) ||
        z < -500 ||
        z > 9000
      ) {
        discardedPointCount++;
        continue;
      }

      if (Math.floor(z) === z) {
        integerCount++;
      }
      uniqueZs.add(z);

      // Calculate coordinates
      let realX = x;
      let realY = y;

      if (transform) {
        // Affine transform: [ScaleX, 0, 0, ScaleY, OriginX, OriginY] or similar
        // Typically ModelPixelScale and ModelTiepoint are used, we assume standard origin and scale
        // transform array: [OriginX, PixelSizeX, OriginY, PixelSizeY]
        realX = transform[0] + x * transform[1];
        realY = transform[2] + y * transform[3];
      }

      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;

      points.push({
        id: `dem_${points.length}`,
        x: realX,
        y: realY,
        z: z,
      });

      if (points.length >= MAX_POINTS) {
        break; // Double ensure we don't exceed limit
      }
    }
    if (points.length >= MAX_POINTS) break;
  }

  const validCount = points.length;
  const integerValueRatio = validCount > 0 ? integerCount / validCount : 0;
  const repeatedValueRatio = validCount > 0 ? 1 - (uniqueZs.size / validCount) : 0;

  return { 
    points, 
    samplingStep, 
    minZ: minZ === Infinity ? 0 : minZ, 
    maxZ: maxZ === -Infinity ? 0 : maxZ,
    discardedPointCount,
    integerValueRatio,
    repeatedValueRatio
  };
}
