import { DEMParseResult } from '../../lib/dem/demTypes';

export interface DEMQAResult {
  isValid: boolean;
  label: "Estable" | "Advertencia" | "Crítico";
  score: number;
  warnings: string[];
  blockers: string[];
  diagnostics: {
    originalCellCount: number;
    sampledPointCount: number;
    discardedPointCount: number;
    discardedRatio: number;
    minZ: number;
    maxZ: number;
    deltaZ: number;
    integerValueRatio: number;
    repeatedValueRatio: number;
    suspectedRasterType: "DEM" | "HILLSHADE" | "SLOPE" | "ASPECT" | "COLOR_RELIEF" | "UNKNOWN";
    confidence: "low" | "medium" | "high";
    hasCRS: boolean;
    epsg?: number | null;
    pixelSizeX?: number | null;
    pixelSizeY?: number | null;
  };
}

export function analyzeDEMQuality(parseResult: DEMParseResult): DEMQAResult {
  const meta = parseResult.metadata;
  const totalConsidered = meta.sampledPointCount + meta.discardedPointCount;
  const discardedRatio = totalConsidered > 0 ? meta.discardedPointCount / totalConsidered : 0;
  const deltaZ = meta.maxZ - meta.minZ;

  const warnings: string[] = [...parseResult.warnings];
  const blockers: string[] = [];

  // Determine raster type and confidence
  let suspectedRasterType: DEMQAResult["diagnostics"]["suspectedRasterType"] = "UNKNOWN";
  let confidence: "low" | "medium" | "high" = "low";
  
  if (meta.integerValueRatio > 0.8) {
    if (meta.minZ >= 0 && meta.maxZ <= 255 && meta.repeatedValueRatio > 0.5) {
      suspectedRasterType = "HILLSHADE";
      // High confidence if it looks extremely like an 8-bit image
      if (meta.integerValueRatio > 0.95 && meta.repeatedValueRatio > 0.8 && deltaZ >= 200) {
        confidence = "high";
      } else {
        confidence = "medium";
      }
    } else if (meta.minZ >= 0 && meta.maxZ <= 90) {
      suspectedRasterType = "SLOPE";
      confidence = meta.integerValueRatio > 0.9 ? "high" : "medium";
    } else if (meta.minZ >= 0 && meta.maxZ <= 360) {
      suspectedRasterType = "ASPECT";
      confidence = meta.integerValueRatio > 0.9 ? "high" : "medium";
    }
  }

  // Assuming it's a DEM unless proven otherwise
  if (suspectedRasterType === "UNKNOWN" && deltaZ > 0) {
    suspectedRasterType = "DEM";
    confidence = "high";
  }

  // Check blockers
  if (meta.sampledPointCount < 3) {
    blockers.push("El archivo no contiene suficientes puntos válidos después de limpiar datos sin valor (Mínimo: 3).");
  }
  if (discardedRatio > 0.8) {
    blockers.push(`Se descartó el ${(discardedRatio * 100).toFixed(1)}% de los puntos evaluados (valores nulos o anomalías). El archivo no es utilizable.`);
  }
  if (deltaZ === 0 && meta.sampledPointCount > 0) {
    blockers.push("Todos los puntos válidos tienen la misma elevación (Delta Z = 0).");
  }
  if (suspectedRasterType === "HILLSHADE" && confidence === "high") {
    blockers.push("El archivo es casi seguramente una imagen derivada tipo hillshade o mapa de colores (valores enteros 0-255 con altísima repetición), no un DEM de elevación real.");
  }
  
  // Check warnings
  if (suspectedRasterType === "HILLSHADE" && confidence === "medium") {
    warnings.push("El archivo podría ser una imagen derivada tipo hillshade. Revise que corresponda a elevación real antes de continuar.");
  }
  if (meta.crsName === 'Local' || meta.crsName === undefined) {
    warnings.push("No se detectó el sistema de coordenadas. Se utilizará un sistema local XY.");
  }
  if (meta.samplingStep > 10) {
    warnings.push(`El archivo es muy masivo. Se aplicó un sub-muestreo fuerte (1 punto cada ${meta.samplingStep} celdas) para mantener la estabilidad del navegador.`);
  }
  if (discardedRatio > 0.3 && discardedRatio <= 0.8) {
    warnings.push(`El ${(discardedRatio * 100).toFixed(1)}% de las celdas muestreadas fueron descartadas por ser nulas o estar fuera de rango.`);
  }
  if (suspectedRasterType === "SLOPE" || suspectedRasterType === "ASPECT") {
    warnings.push("El archivo podría corresponder a Slope/Aspect y no a elevación. Los resultados pueden ser incorrectos.");
  }
  if (meta.repeatedValueRatio > 0.9 && suspectedRasterType !== "HILLSHADE") {
    warnings.push("Alta repetición de valores de elevación detectada (posible DEM interpolado artificialmente a muy baja resolución).");
  }

  const isValid = blockers.length === 0;
  
  let label: "Estable" | "Advertencia" | "Crítico" = "Estable";
  let score = 100;

  if (!isValid) {
    label = "Crítico";
    score = 0;
  } else if (warnings.length > 0) {
    label = "Advertencia";
    score = Math.max(50, 100 - (warnings.length * 15));
  }

  return {
    isValid,
    label,
    score,
    warnings,
    blockers,
    diagnostics: {
      originalCellCount: meta.originalCellCount,
      sampledPointCount: meta.sampledPointCount,
      discardedPointCount: meta.discardedPointCount,
      discardedRatio,
      minZ: meta.minZ,
      maxZ: meta.maxZ,
      deltaZ,
      integerValueRatio: meta.integerValueRatio,
      repeatedValueRatio: meta.repeatedValueRatio,
      suspectedRasterType,
      confidence,
      hasCRS: meta.crsName !== 'Local' && meta.crsName !== undefined,
      epsg: meta.epsg,
      pixelSizeX: meta.pixelSizeX,
      pixelSizeY: meta.pixelSizeY
    }
  };
}
