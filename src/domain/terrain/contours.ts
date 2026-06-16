import { IDWSurfaceResult } from './interpolation';

export interface ContourOptions {
  interval: number;
  includeIndexContours: boolean;
  indexEvery: number;
}

export interface ContourLine {
  level: number;
  segments: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  isIndex: boolean;
}

export interface ContourResult {
  interval: number;
  levels: number[];
  lines: ContourLine[];
  lineCount: number;
  segmentCount: number;
  minLevel: number;
  maxLevel: number;
  processingTimeMs: number;
  error?: 'TOO_MANY_LEVELS' | 'INSUFFICIENT_RANGE';
}

/**
 * Generates contour lines from an IDW surface result using Marching Squares.
 */
export function generateContours(
  surface: IDWSurfaceResult,
  options: ContourOptions
): ContourResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const { gridX, gridY, gridZ, minZ, maxZ, bounds } = surface;
  const interval = options.interval || 2.0;

  // 1. Calculate elevation levels
  const startZ = Math.ceil(minZ / interval) * interval;
  const endZ = Math.floor(maxZ / interval) * interval;

  const levels: number[] = [];
  for (let z = startZ; z <= endZ; z += interval) {
    levels.push(parseFloat(z.toFixed(4)));
  }

  // 2. Validate thresholds
  if (levels.length > 300) {
    return {
      interval,
      levels,
      lines: [],
      lineCount: 0,
      segmentCount: 0,
      minLevel: startZ,
      maxLevel: endZ,
      processingTimeMs: 0,
      error: 'TOO_MANY_LEVELS'
    };
  }

  if (levels.length === 0) {
    return {
      interval,
      levels: [],
      lines: [],
      lineCount: 0,
      segmentCount: 0,
      minLevel: 0,
      maxLevel: 0,
      processingTimeMs: 0,
      error: 'INSUFFICIENT_RANGE'
    };
  }

  const rows = gridY.length;
  const cols = gridX.length;
  const lines: ContourLine[] = [];
  let totalSegments = 0;

  const clampX = (x: number) => Math.max(bounds.minX, Math.min(bounds.maxX, x));
  const clampY = (y: number) => Math.max(bounds.minY, Math.min(bounds.maxY, y));

  // 3. Marching Squares for each level
  for (let l = 0; l < levels.length; l++) {
    const H = levels[l];
    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (let r = 0; r < rows - 1; r++) {
      const y_bottom = gridY[r];
      const y_top = gridY[r + 1];

      for (let c = 0; c < cols - 1; c++) {
        const x_left = gridX[c];
        const x_right = gridX[c + 1];

        const z_bl = gridZ[r][c];
        const z_br = gridZ[r][c + 1];
        const z_tr = gridZ[r + 1][c + 1];
        const z_tl = gridZ[r + 1][c];

        // Determine active corners: z >= H
        const bl_active = z_bl >= H ? 1 : 0;
        const br_active = z_br >= H ? 1 : 0;
        const tr_active = z_tr >= H ? 1 : 0;
        const tl_active = z_tl >= H ? 1 : 0;

        const caseIndex = (tl_active << 3) | (tr_active << 2) | (br_active << 1) | bl_active;

        if (caseIndex === 0 || caseIndex === 15) {
          continue;
        }

        // Interpolation functions along cell edges
        const getBottomIntersect = () => {
          const t = (H - z_bl) / (z_br - z_bl || 1);
          return { x: clampX(x_left + t * (x_right - x_left)), y: clampY(y_bottom) };
        };

        const getRightIntersect = () => {
          const t = (H - z_br) / (z_tr - z_br || 1);
          return { x: clampX(x_right), y: clampY(y_bottom + t * (y_top - y_bottom)) };
        };

        const getTopIntersect = () => {
          const t = (H - z_tl) / (z_tr - z_tl || 1);
          return { x: clampX(x_left + t * (x_right - x_left)), y: clampY(y_top) };
        };

        const getLeftIntersect = () => {
          const t = (H - z_bl) / (z_tl - z_bl || 1);
          return { x: clampX(x_left), y: clampY(y_bottom + t * (y_top - y_bottom)) };
        };

        // Map case indices to edge crossing coordinates
        switch (caseIndex) {
          case 1: { // BL active
            const p1 = getBottomIntersect();
            const p2 = getLeftIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 2: { // BR active
            const p1 = getBottomIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 3: { // BL, BR active
            const p1 = getLeftIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 4: { // TR active
            const p1 = getTopIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 5: { // BL, TR active (Saddle case)
            const p1 = getBottomIntersect();
            const p2 = getRightIntersect();
            const p3 = getTopIntersect();
            const p4 = getLeftIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            segments.push({ x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y });
            break;
          }
          case 6: { // BR, TR active
            const p1 = getBottomIntersect();
            const p2 = getTopIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 7: { // BL, BR, TR active
            const p1 = getTopIntersect();
            const p2 = getLeftIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 8: { // TL active
            const p1 = getTopIntersect();
            const p2 = getLeftIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 9: { // BL, TL active
            const p1 = getBottomIntersect();
            const p2 = getTopIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 10: { // BR, TL active (Saddle case)
            const p1 = getBottomIntersect();
            const p2 = getLeftIntersect();
            const p3 = getTopIntersect();
            const p4 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            segments.push({ x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y });
            break;
          }
          case 11: { // BL, BR, TL active
            const p1 = getTopIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 12: { // TR, TL active
            const p1 = getLeftIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 13: { // BL, TR, TL active
            const p1 = getBottomIntersect();
            const p2 = getRightIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          case 14: { // BR, TR, TL active
            const p1 = getBottomIntersect();
            const p2 = getLeftIntersect();
            segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            break;
          }
          default:
            break;
        }
      }
    }

    if (segments.length > 0) {
      // Determine if it is a master (index) contour
      const indexInterval = interval * (options.indexEvery || 5);
      const isIndex = options.includeIndexContours && Math.abs(Math.round(H / indexInterval) * indexInterval - H) < 1e-4;

      lines.push({
        level: H,
        segments,
        isIndex,
      });
      totalSegments += segments.length;
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const processingTimeMs = Math.round(endTime - startTime);

  return {
    interval,
    levels,
    lines,
    lineCount: lines.length,
    segmentCount: totalSegments,
    minLevel: levels[0] || 0,
    maxLevel: levels[levels.length - 1] || 0,
    processingTimeMs,
  };
}
