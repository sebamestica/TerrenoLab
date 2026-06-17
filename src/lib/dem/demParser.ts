import * as GeoTIFF from 'geotiff';
import { DEMParseResult, DEMMetadata } from './demTypes';
import { sampleDEM } from './demSampler';

export async function parseDEM(buffer: ArrayBuffer, fileName: string): Promise<DEMParseResult> {
  const warnings: string[] = [];
  const startTotal = performance.now();
  
  try {
    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    
    const width = image.getWidth();
    const height = image.getHeight();
    
    if (width <= 0 || height <= 0) {
      throw new Error('El raster tiene dimensiones inválidas (ancho o alto <= 0).');
    }

    if (width * height > 50_000_000) {
      throw new Error('El raster excede el límite de celdas permitidas para esta versión en navegador. Límite: 50 millones.');
    }

    const fd = image.getFileDirectory();

    let noDataValue: number | null = null;
    if ((fd as any).GDAL_NODATA) {
      noDataValue = parseFloat((fd as any).GDAL_NODATA);
    } else if (image.getGDALNoData) {
      const gdalNoData = image.getGDALNoData();
      if (gdalNoData !== null) noDataValue = gdalNoData;
    }

    const t0 = performance.now();
    const rasterData = await image.readRasters() as Float32Array[] | number[][];
    if (!rasterData || rasterData.length === 0) {
      throw new Error('No se encontraron bandas de datos (raster sin bandas) en el GeoTIFF.');
    }
    const data = rasterData[0] as Float32Array | number[];
    const readTimeMs = performance.now() - t0;

    // Extract spatial reference and transformation
    let transform: number[] | null = null;
    let pixelSizeX: number | null = null;
    let pixelSizeY: number | null = null;
    
    const tiepoint = (image.getFileDirectory() as any).ModelTiepoint;
    const pixelScale = (image.getFileDirectory() as any).ModelPixelScale;

    if (tiepoint && tiepoint.length >= 6 && pixelScale && pixelScale.length >= 2) {
      // transform: [OriginX, PixelSizeX, OriginY, PixelSizeY]
      // tiepoint is usually [i, j, k, x, y, z] -> [0, 0, 0, originX, originY, originZ]
      const originX = tiepoint[3];
      const originY = tiepoint[4];
      pixelSizeX = pixelScale[0];
      pixelSizeY = -pixelScale[1]; // Usually Y scale is negative to go downwards
      
      transform = [originX, pixelSizeX, originY, pixelSizeY];
    } else {
      warnings.push("El archivo no contiene georreferenciación detectable. Se usará un sistema local XY.");
    }

    const t1 = performance.now();
    const { points, samplingStep, minZ, maxZ, discardedPointCount, integerValueRatio, repeatedValueRatio } = sampleDEM(width, height, data, noDataValue, transform);
    const samplingTimeMs = performance.now() - t1;

    if (points.length < 3) {
      throw new Error("El archivo no contiene suficientes puntos válidos después de limpiar datos sin valor (NoData) o fuera de rango. Mínimo requerido: 3.");
    }

    const geoKeys = image.getGeoKeys ? await image.getGeoKeys() : (image as any).geoKeys;
    const epsg = geoKeys ? geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey : null;
    const crsName = epsg ? `EPSG:${epsg}` : 'Local';

    const sourceFormat = fileName.toLowerCase().endsWith('.tif') || fileName.toLowerCase().endsWith('.tiff') ? 'TIF' : 'GeoTIFF';

    const processingTimeMs = performance.now() - startTotal;

    const metadata: DEMMetadata = {
      width,
      height,
      sourceFormat,
      crsName,
      epsg,
      pixelSizeX,
      pixelSizeY,
      noDataValue,
      originalCellCount: width * height,
      sampledPointCount: points.length,
      discardedPointCount,
      samplingStep,
      minZ,
      maxZ,
      integerValueRatio,
      repeatedValueRatio,
      readTimeMs,
      samplingTimeMs,
      processingTimeMs
    };

    return {
      points,
      metadata,
      warnings
    };

  } catch (err: any) {
    throw new Error(`Error al leer GeoTIFF: ${err.message || err}`);
  }
}
