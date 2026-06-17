import { IDWSurfaceResult } from './interpolation';
import { isPointInPolygon } from './volume';

export interface FillMaterialLayer {
  id: string;
  name: string;
  color: string;
  fromThickness: number;
  toThickness: number;
  pricePerM3?: number | null;
  compactionFactor: number;
  wasteFactor: number;
}

export interface MaterialLayerVolume {
  layerId: string;
  name: string;
  color: string;
  fromThickness: number;
  toThickness: number;
  rawVolume: number;
  recommendedVolume: number;
  pricePerM3?: number | null;
  estimatedCost?: number | null;
}

export interface MaterialLayerResult {
  totalRawFillVolume: number;
  totalRecommendedVolume: number;
  totalEstimatedCost: number | null;
  unassignedFillVolume: number;
  layers: MaterialLayerVolume[];
}

export const DEFAULT_MATERIAL_LAYERS: FillMaterialLayer[] = [
  {
    id: 'base-granular',
    name: 'Base granular',
    color: 'gris',
    fromThickness: 0.0,
    toThickness: 0.3,
    pricePerM3: null,
    compactionFactor: 1.15,
    wasteFactor: 1.05,
  },
  {
    id: 'relleno-seleccionado',
    name: 'Relleno seleccionado',
    color: 'café',
    fromThickness: 0.3,
    toThickness: 1.2,
    pricePerM3: null,
    compactionFactor: 1.2,
    wasteFactor: 1.05,
  },
  {
    id: 'tierra-vegetal',
    name: 'Terminación / tierra vegetal',
    color: 'verde',
    fromThickness: 1.2,
    toThickness: 1.5,
    pricePerM3: null,
    compactionFactor: 1.05,
    wasteFactor: 1.03,
  },
];

/**
 * Calculates raw and recommended volumes and estimated costs for each material layer.
 * Any fill volume that does not fall within the configured thickness layers is classified as unassigned.
 */
export function calculateMaterialLayerVolumes(
  surface: IDWSurfaceResult,
  polygon: { x: number; y: number }[],
  targetElevation: number,
  layers: FillMaterialLayer[]
): MaterialLayerResult {
  const rawVolumeMap: Record<string, number> = {};
  for (const layer of layers) {
    rawVolumeMap[layer.id] = 0;
  }
  let unassignedFillVolume = 0;

  if (polygon.length >= 3) {
    const cols = surface.gridX.length;
    const rows = surface.gridY.length;
    const dx = (surface.bounds.maxX - surface.bounds.minX) / (cols - 1 || 1);
    const dy = (surface.bounds.maxY - surface.bounds.minY) / (rows - 1 || 1);
    const cellArea = dx * dy;

    for (let r = 0; r < rows; r++) {
      const cy = surface.gridY[r];
      for (let c = 0; c < cols; c++) {
        const cx = surface.gridX[c];
        if (isPointInPolygon(cx, cy, polygon)) {
          const currentZ = surface.gridZ[r][c];
          const fillHeight = targetElevation - currentZ;
          if (fillHeight > 0) {
            let cellAssignedHeight = 0;
            for (const layer of layers) {
              // The intersection between fillHeight and the layer's thickness range [fromThickness, toThickness]
              const thicknessUsed = Math.max(0, Math.min(layer.toThickness, fillHeight) - layer.fromThickness);
              rawVolumeMap[layer.id] += thicknessUsed * cellArea;
              cellAssignedHeight += thicknessUsed;
            }
            const cellUnassignedHeight = Math.max(0, fillHeight - cellAssignedHeight);
            unassignedFillVolume += cellUnassignedHeight * cellArea;
          }
        }
      }
    }
  }

  let totalRawFillVolume = 0;
  let totalRecommendedVolume = 0;
  let hasNullCostForActiveLayer = false;

  const resultLayers: MaterialLayerVolume[] = layers.map((layer) => {
    const rawVolume = rawVolumeMap[layer.id];
    const recommendedVolume = rawVolume * layer.compactionFactor * layer.wasteFactor;
    
    let estimatedCost: number | null = null;
    if (layer.pricePerM3 !== undefined && layer.pricePerM3 !== null) {
      estimatedCost = recommendedVolume * layer.pricePerM3;
    }

    if (rawVolume > 0 && (layer.pricePerM3 === undefined || layer.pricePerM3 === null)) {
      hasNullCostForActiveLayer = true;
    }

    totalRawFillVolume += rawVolume;
    totalRecommendedVolume += recommendedVolume;

    return {
      layerId: layer.id,
      name: layer.name,
      color: layer.color,
      fromThickness: layer.fromThickness,
      toThickness: layer.toThickness,
      rawVolume,
      recommendedVolume,
      pricePerM3: layer.pricePerM3,
      estimatedCost,
    };
  });

  totalRawFillVolume += unassignedFillVolume;

  let totalEstimatedCost: number | null = 0;
  if (hasNullCostForActiveLayer) {
    totalEstimatedCost = null;
  } else {
    let sum = 0;
    for (const rLayer of resultLayers) {
      if (rLayer.estimatedCost !== null && rLayer.estimatedCost !== undefined) {
        sum += rLayer.estimatedCost;
      }
    }
    totalEstimatedCost = sum;
  }

  return {
    totalRawFillVolume,
    totalRecommendedVolume,
    totalEstimatedCost,
    unassignedFillVolume,
    layers: resultLayers,
  };
}
