import { IDWSurfaceResult } from './interpolation';
import { VolumeOptions, VolumeResult, calculatePolygonArea } from './volume';

export interface VolumeAuditResult {
  isValid: boolean;
  warnings: string[];
  blockers: string[];
  cellArea: number;
  estimatedResolution: string;
  polygonArea: number;
  sampledArea: number;
  areaCoverageRatio: number;
  fillCutBalanceCheck: number;
  costCheck: {
    materialCostExpected: number | null;
    totalCostExpected: number | null;
    isConsistent: boolean;
  };
}

/**
 * Performs a volumetric and pricing audit on the volume calculations.
 */
export function analyzeVolumeConsistency(
  surface: IDWSurfaceResult,
  polygon: { x: number; y: number }[],
  volumeResult: VolumeResult,
  volumeOptions: VolumeOptions
): VolumeAuditResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const cols = surface.gridX.length;
  const rows = surface.gridY.length;
  const resolutionLabel = cols <= 40 ? 'Baja' : cols <= 80 ? 'Media' : 'Alta';
  const estimatedResolution = `${cols}x${rows} (${resolutionLabel})`;

  // Calculate cell area
  const dx = (surface.bounds.maxX - surface.bounds.minX) / (cols - 1 || 1);
  const dy = (surface.bounds.maxY - surface.bounds.minY) / (rows - 1 || 1);
  const cellArea = dx * dy;

  const polygonArea = volumeResult.polygonArea;
  const sampledArea = volumeResult.cellsInsidePolygon * cellArea;
  const areaCoverageRatio = polygonArea > 0 ? (sampledArea / polygonArea) : 0;
  const fillCutBalanceCheck = volumeResult.rawFillVolume - volumeResult.rawCutVolume;

  // 1. Basic Volume Checks
  if (volumeResult.rawFillVolume < 0) {
    blockers.push('El volumen de relleno bruto no puede ser negativo.');
  }
  if (volumeResult.rawCutVolume < 0) {
    blockers.push('El volumen de corte bruto no puede ser negativo.');
  }
  if (volumeResult.recommendedFillVolume < volumeResult.rawFillVolume - 0.001) {
    blockers.push('El volumen de relleno recomendado no puede ser menor que el volumen geométrico de relleno bruto.');
  }
  if (Math.abs(volumeResult.netVolume - fillCutBalanceCheck) > 0.01) {
    blockers.push('El balance de volumen neto no coincide con la diferencia entre relleno y corte.');
  }

  // 2. Cell Counts Bounds
  if (volumeResult.cellsInsidePolygon > volumeResult.cellsEvaluated) {
    blockers.push('El número de celdas clasificadas dentro del polígono excede las celdas totales evaluadas.');
  }

  // 3. Grid Precision Checks (Step 4)
  if (volumeResult.cellsInsidePolygon < 10) {
    blockers.push('El polígono de análisis es muy pequeño y contiene menos de 10 celdas de la grilla IDW. Aumente el área o la resolución de la superficie para habilitar el cálculo.');
  } else if (volumeResult.cellsInsidePolygon < 25) {
    warnings.push('El área seleccionada contiene pocas celdas de la superficie IDW. La estimación puede ser poco precisa.');
  }

  // 4. Area Check
  if (polygonArea <= 0) {
    blockers.push('El área del polígono seleccionado debe ser mayor a cero.');
  } else {
    // 5. Sampled Area Divergence Check
    const diffRatio = Math.abs(1 - areaCoverageRatio);
    if (diffRatio > 0.3) {
      warnings.push(`El área muestreada por la grilla difiere en un ${(diffRatio * 100).toFixed(1)}% del área real del polígono (baja aproximación geométrica).`);
    }
  }

  // 6. Costing calculations consistency audit
  const price = volumeOptions.materialPricePerM3;
  const transport = volumeOptions.fixedTransportCost;

  let materialCostExpected: number | null = null;
  let totalCostExpected: number | null = null;
  let isConsistent = true;

  if (price !== undefined && price !== null && price > 0) {
    materialCostExpected = volumeResult.recommendedFillVolume * price;
    
    // Check material cost consistency
    if (volumeResult.estimatedMaterialCost === undefined ||
        Math.abs(volumeResult.estimatedMaterialCost - materialCostExpected) > 0.1) {
      isConsistent = false;
    }

    if (transport !== undefined && transport !== null && transport > 0) {
      totalCostExpected = materialCostExpected + transport;
      
      // Check total cost consistency
      if (volumeResult.estimatedTotalCost === undefined ||
          Math.abs(volumeResult.estimatedTotalCost - totalCostExpected) > 0.1) {
        isConsistent = false;
      }
    } else if (transport === undefined || transport === 0) {
      totalCostExpected = materialCostExpected;
      if (volumeResult.estimatedTotalCost === undefined ||
          Math.abs(volumeResult.estimatedTotalCost - totalCostExpected) > 0.1) {
        isConsistent = false;
      }
    }
  }

  if (!isConsistent) {
    blockers.push('Inconsistencia detectada en el cálculo del costo estimado en comparación con los parámetros provistos.');
  }

  const isValid = blockers.length === 0;

  return {
    isValid,
    warnings,
    blockers,
    cellArea,
    estimatedResolution,
    polygonArea,
    sampledArea,
    areaCoverageRatio,
    fillCutBalanceCheck,
    costCheck: {
      materialCostExpected,
      totalCostExpected,
      isConsistent
    }
  };
}
