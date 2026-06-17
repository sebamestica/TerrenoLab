import { FillMaterialLayer, MaterialLayerVolume } from './materialLayers';
import { VolumeResult } from './volume';

export interface MaterialLayersQAResult {
  isValid: boolean;
  warnings: string[];
  blockers: string[];
}

export function validateMaterialLayers(
  layers: FillMaterialLayer[],
  volumeResult: VolumeResult | null,
  options?: {
    unassignedFillVolume?: number;
    layerVolumes?: MaterialLayerVolume[];
  }
): MaterialLayersQAResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Check if volume is calculated
  if (!volumeResult) {
    blockers.push("No se ha calculado volumen.");
    return { isValid: false, warnings, blockers };
  }
  
  if (volumeResult.rawFillVolume <= 0) {
    // Es un proyecto solo de corte, los materiales de relleno no aplican
    warnings.push("No hay volumen de relleno. Las capas de materiales no aplican.");
    return { isValid: true, warnings, blockers };
  }

  // 2. Validate layers list
  const maxFillHeight = volumeResult ? Math.max(0, volumeResult.targetElevation - volumeResult.minExistingZ) : 0;

  // Let's validate color format
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const namedColors = ['gris', 'café', 'verde', 'rojo', 'azul', 'amarillo', 'naranja', 'morado', 'negro', 'blanco', 'gray', 'brown', 'green', 'blue', 'red', 'yellow', 'orange', 'purple', 'black', 'white'];

  layers.forEach((layer, idx) => {
    const layerName = layer.name ? layer.name.trim() : '';
    if (!layerName) {
      blockers.push(`La capa en la posición ${idx + 1} no tiene nombre.`);
    }

    const col = layer.color ? layer.color.trim().toLowerCase() : '';
    if (!col || (!hexRegex.test(col) && !namedColors.includes(col))) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un color inválido o vacío.`);
    }

    if (layer.fromThickness < 0) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un espesor inicial negativo (${layer.fromThickness} m).`);
    }

    if (layer.toThickness <= layer.fromThickness) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un espesor final inválido (${layer.toThickness} m <= ${layer.fromThickness} m).`);
    }

    if (layer.compactionFactor <= 0) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un factor de compactación inválido (${layer.compactionFactor} <= 0).`);
    }

    if (layer.wasteFactor <= 0) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un factor de pérdida inválido (${layer.wasteFactor} <= 0).`);
    }

    if (layer.pricePerM3 !== undefined && layer.pricePerM3 !== null && layer.pricePerM3 < 0) {
      blockers.push(`La capa "${layerName || idx + 1}" tiene un precio por m³ negativo ($${layer.pricePerM3}).`);
    }

    // Warnings
    if (layer.pricePerM3 === undefined || layer.pricePerM3 === null) {
      warnings.push(`La capa "${layerName || idx + 1}" no tiene precio por m³ configurado. Se omitirá del costo total.`);
    }

    if (volumeResult && maxFillHeight <= layer.fromThickness) {
      warnings.push(`La capa "${layerName || idx + 1}" está configurada para espesores mayores a la altura máxima de relleno (${maxFillHeight.toFixed(2)} m) y no recibirá volumen.`);
    }
  });

  // Check overlaps
  const sortedLayers = [...layers].sort((a, b) => a.fromThickness - b.fromThickness);
  for (let i = 0; i < sortedLayers.length - 1; i++) {
    if (sortedLayers[i].toThickness > sortedLayers[i + 1].fromThickness) {
      blockers.push(`Las capas "${sortedLayers[i].name}" y "${sortedLayers[i + 1].name}" se solapan en sus rangos de espesor.`);
    }
  }

  // Check unassigned fill volume
  const unassigned = options?.unassignedFillVolume ?? 0;
  if (unassigned > 0.001) {
    blockers.push(`Existe volumen de relleno sin capa asignada (${unassigned.toFixed(2)} m³ sin asignar). Amplíe el espesor de sus capas.`);
  }

  // Check top layer thickness vs max fill height
  if (volumeResult && maxFillHeight > 0 && sortedLayers.length > 0) {
    const maxToThickness = sortedLayers[sortedLayers.length - 1].toThickness;
    if (maxToThickness < maxFillHeight) {
      warnings.push(`La capa superior no alcanza la altura máxima de relleno (${maxFillHeight.toFixed(2)} m).`);
    }
  }

  // Too many visual layers warning
  if (layers.length > 5) {
    warnings.push("Se han configurado demasiadas capas de materiales (más de 5). La visualización en la interfaz podría verse saturada.");
  }

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers,
  };
}
