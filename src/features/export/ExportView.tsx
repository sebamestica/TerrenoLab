import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Image, FileJson, RefreshCw, AlertTriangle, CheckCircle, Download, Loader2, Info, Spline } from 'lucide-react';
import { TerrainPoint, TerrainDataset, TerrainMetrics } from '../../domain/terrain/types';
import { ValidationResult } from '../../domain/terrain/validation';
import { TopographicQAResult } from '../../domain/terrain/qa';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { SurfaceQAResult } from '../../domain/terrain/surfaceQA';
import { ContourResult } from '../../domain/terrain/contours';
import { ContourQAResult } from '../../domain/terrain/contourQA';
import { ContourViewer } from '../../components/viewers/ContourViewer';
import { SurfaceRasterViewer } from '../../components/viewers/SurfaceRasterViewer';
import { Terrain2DViewer } from '../../components/viewers/Terrain2DViewer';
import { 
  exportToCSV, 
  exportValidationErrorsToCSV, 
  downloadFile, 
  sanitizeFilename,
  exportContoursToDXF,
  exportContoursToGeoJSON
} from '../../lib/export/exportUtils';
import { 
  validateCleanCSVExport, 
  validateErrorsCSVExport, 
  validateJSONExport, 
  validateDXFExport,
  validateGeoJSONExport,
  CSVQAResult, 
  QAValidationResult,
  ExportQAResult
} from '../../domain/terrain/exportQA';
import { Button } from '../../components/ui/Button';
import { VolumeOptions, VolumeResult } from '../../domain/terrain/volume';
import { VolumeQAResult } from '../../domain/terrain/volumeQA';
import { VolumeAuditResult } from '../../domain/terrain/volumeAudit';

export type ExportStatus = 'idle' | 'exporting' | 'completed' | 'error';

interface ExportViewProps {
  points: TerrainPoint[];
  metrics: TerrainMetrics | null;
  dataset: TerrainDataset | null;
  validation: ValidationResult | null;
  qaResult: TopographicQAResult | null;
  surface: IDWSurfaceResult | null;
  surfaceQA: SurfaceQAResult | null;
  contoursResult: ContourResult | null;
  contourQA: ContourQAResult | null;
  onReset: () => void;
  exportStatus: ExportStatus;
  setExportStatus: (val: ExportStatus) => void;
  isProcessing?: boolean; // compatibility with page.tsx
  isExporting: boolean;
  setIsExporting: (val: boolean) => void;
  setLastExportTime: (val: string) => void;

  // Lifted selection states
  exportCSV: boolean;
  setExportCSV: (val: boolean) => void;
  includeValidationErrors: boolean;
  setIncludeValidationErrors: (val: boolean) => void;
  exportPNG: boolean;
  setExportPNG: (val: boolean) => void;
  exportJSON: boolean;
  setExportJSON: (val: boolean) => void;
  exportDXF: boolean;
  setExportDXF: (val: boolean) => void;
  exportGeoJSON: boolean;
  setExportGeoJSON: (val: boolean) => void;

  // Lifted QA audit results & callbacks
  exportQA: ExportQAResult | null;
  pngQA: { isValid: boolean; message: string } | null;
  onPNGQAChange: (isValid: boolean, message: string) => void;

  selectedCRS: string;
  viewerMode: 'light' | 'technical';

  // Volume Props
  volumeOptions?: VolumeOptions;
  volumeResult?: VolumeResult | null;
  volumeQA?: VolumeQAResult | null;
  volumeAudit?: VolumeAuditResult | null;
}

const getCRSLabelAndEPSG = (crs: string) => {
  switch (crs) {
    case 'WGS84_18S':
      return 'EPSG:32718 • WGS 84 / UTM Zona 18S';
    case 'WGS84_19S':
      return 'EPSG:32719 • WGS 84 / UTM Zona 19S';
    case 'WGS84_20S':
      return 'EPSG:32720 • WGS 84 / UTM Zona 20S';
    case 'SIRGAS_18S':
      return 'EPSG:5362 • SIRGAS-Chile 2002 / UTM Zona 18S';
    case 'SIRGAS_19S':
      return 'EPSG:5361 • SIRGAS-Chile 2002 / UTM Zona 19S';
    case 'LOCAL':
    default:
      return 'Sistema local XY • CRS: no especificado • EPSG: no aplica';
  }
};

const getCRSMetadata = (crs: string) => {
  switch (crs) {
    case 'WGS84_18S':
      return {
        type: 'EPSG',
        name: 'WGS 84 / UTM Zona 18S',
        epsg: 32718,
        reprojectionApplied: false,
      };
    case 'WGS84_19S':
      return {
        type: 'EPSG',
        name: 'WGS 84 / UTM Zona 19S',
        epsg: 32719,
        reprojectionApplied: false,
      };
    case 'WGS84_20S':
      return {
        type: 'EPSG',
        name: 'WGS 84 / UTM Zona 20S',
        epsg: 32720,
        reprojectionApplied: false,
      };
    case 'SIRGAS_18S':
      return {
        type: 'EPSG',
        name: 'SIRGAS-Chile 2002 / UTM Zona 18S',
        epsg: 5362,
        reprojectionApplied: false,
      };
    case 'SIRGAS_19S':
      return {
        type: 'EPSG',
        name: 'SIRGAS-Chile 2002 / UTM Zona 19S',
        epsg: 5361,
        reprojectionApplied: false,
      };
    case 'LOCAL':
    default:
      return {
        type: 'LOCAL',
        name: 'Sistema local XY',
        epsg: null,
        reprojectionApplied: false,
      };
  }
};

export function ExportView({
  points,
  metrics,
  dataset,
  validation,
  qaResult,
  surface,
  surfaceQA,
  contoursResult,
  contourQA,
  onReset,
  exportStatus,
  setExportStatus,
  isExporting,
  setIsExporting,
  setLastExportTime,
  exportCSV,
  setExportCSV,
  includeValidationErrors,
  setIncludeValidationErrors,
  exportPNG,
  setExportPNG,
  exportJSON,
  setExportJSON,
  exportDXF,
  setExportDXF,
  exportGeoJSON,
  setExportGeoJSON,
  exportQA,
  pngQA,
  onPNGQAChange,
  selectedCRS,
  viewerMode,
  volumeOptions,
  volumeResult,
  volumeQA,
  volumeAudit,
}: ExportViewProps) {
  // Reference for offscreen viewer canvas capture
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);

  // Checks for technical warnings
  const hasWarnings = 
    (surfaceQA && surfaceQA.warnings.length > 0) || 
    (contourQA && contourQA.warnings.length > 0);

  // Generates the technical JSON metadata summary
  const generateTechnicalJSON = () => {
    return {
      project: {
        name: dataset?.name || 'terrenolab_proyecto',
        createdAt: dataset?.createdAt || new Date().toISOString(),
        source: dataset?.source || 'csv',
      },
      dataset: {
        pointCount: points.length,
        validRows: validation?.summary.validRows ?? points.length,
        rejectedRows: validation?.summary.rejectedRows ?? 0,
        minZ: metrics?.minZ ?? 0,
        maxZ: metrics?.maxZ ?? 0,
        deltaZ: metrics?.deltaZ ?? 0,
      },
      topographicQA: qaResult ? {
        datasetType: qaResult.classification.datasetType,
        score: qaResult.quality.score,
        label: qaResult.quality.label,
        recommendations: qaResult.quality.recommendations,
        coverageRatio: qaResult.spatialCoverage.coverageRatio,
        pointDensity: qaResult.spatialCoverage.pointDensity,
        outliersCount: qaResult.outlierResult.outlierCount,
        outliersRatio: qaResult.outlierResult.outlierRatio
      } : null,
      surface: {
        method: surface?.method || 'IDW',
        resolution: surface ? (surface.gridX.length === 40 ? 'low' : surface.gridX.length === 80 ? 'medium' : 'high') : 'medium',
        power: surface?.power ?? 2,
        gridRows: surface?.gridY.length ?? 0,
        gridCols: surface?.gridX.length ?? 0,
      },
      surfaceQA: surfaceQA ? {
        originalMinZ: surfaceQA.originalMinZ,
        originalMaxZ: surfaceQA.originalMaxZ,
        surfaceMinZ: surfaceQA.surfaceMinZ,
        surfaceMaxZ: surfaceQA.surfaceMaxZ,
        minDifference: surfaceQA.minDifference,
        maxDifference: surfaceQA.maxDifference,
        hasNaN: surfaceQA.hasNaN,
        hasInfinity: surfaceQA.hasInfinity,
        cellCount: surfaceQA.cellCount,
        isStable: surfaceQA.isStable,
        warningsCount: surfaceQA.warnings.length,
        blockersCount: surfaceQA.blockers.length
      } : null,
      contours: {
        interval: contoursResult?.interval ?? 0,
        levels: contoursResult?.lineCount ?? 0,
        segments: contoursResult?.segmentCount ?? 0,
      },
      contourQA: contourQA ? {
        isValid: contourQA.isValid,
        levelCount: contourQA.levelCount,
        segmentCount: contourQA.segmentCount,
        outOfBoundsSegments: contourQA.outOfBoundsSegments,
        duplicateSegments: contourQA.duplicateSegments,
        emptyLevels: contourQA.emptyLevels,
        minLevel: contourQA.minLevel,
        maxLevel: contourQA.maxLevel,
        warningsCount: contourQA.warnings.length,
        blockersCount: contourQA.blockers.length
      } : null,
      crs: getCRSMetadata(selectedCRS),
      volume: volumeResult ? {
        method: "Cell-based cut/fill over IDW surface",
        targetElevation: volumeResult.targetElevation,
        rawFillVolume: volumeResult.rawFillVolume,
        rawCutVolume: volumeResult.rawCutVolume,
        netVolume: volumeResult.netVolume,
        recommendedFillVolume: volumeResult.recommendedFillVolume,
        compactionFactor: volumeResult.compactionFactor,
        wasteFactor: volumeResult.wasteFactor,
        materialPricePerM3: volumeResult.materialPricePerM3 ?? null,
        fixedTransportCost: volumeOptions?.fixedTransportCost ?? null,
        estimatedMaterialCost: volumeResult.estimatedMaterialCost ?? null,
        estimatedTotalCost: volumeResult.estimatedTotalCost ?? null,
        cellsInsidePolygon: volumeResult.cellsInsidePolygon,
        volumeQA: volumeQA ? {
          isValid: volumeQA.isValid,
          blockers: volumeQA.blockers,
          warnings: volumeQA.warnings
        } : null,
        volumeAudit: volumeAudit ? {
          isValid: volumeAudit.isValid,
          blockers: volumeAudit.blockers,
          warnings: volumeAudit.warnings,
          cellArea: volumeAudit.cellArea,
          polygonArea: volumeAudit.polygonArea,
          sampledArea: volumeAudit.sampledArea,
          areaCoverageRatio: volumeAudit.areaCoverageRatio,
          fillCutBalanceCheck: volumeAudit.fillCutBalanceCheck,
          estimatedResolution: volumeAudit.estimatedResolution
        } : null
      } : null,
      generatedBy: 'TerrenoLab',
      version: 'MVP-Phase-7.1',
    };
  };

  // Run dynamic verification audits for PNG canvas only
  useEffect(() => {
    const checkCanvas = () => {
      const canvas = hiddenContainerRef.current?.querySelector('canvas');
      if (!canvas) {
        onPNGQAChange(false, 'No hay visor técnico disponible para exportar.');
        return;
      }
      
      if (canvas.width < 300 || canvas.height < 250) {
        onPNGQAChange(false, 'Dimensiones del visor insuficientes.');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onPNGQAChange(false, 'Contexto 2D no disponible.');
        return;
      }

      // Check if canvas is completely white or transparent
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let hasDrawings = false;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        // Non-white or non-transparent pixel found
        if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
          hasDrawings = true;
          break;
        }
      }

      if (!hasDrawings) {
        onPNGQAChange(false, 'El visor técnico está vacío.');
      } else {
        onPNGQAChange(true, 'Listo');
      }
    };

    // Delay to let React render cycle mount and draw canvas
    const timer = setTimeout(checkCanvas, 150);
    return () => clearTimeout(timer);
  }, [points, contoursResult, surface, metrics, onPNGQAChange]);

  // Perform multiple file exports sequentially
  const handleExportAll = async () => {
    if (!exportCSV && !exportPNG && !exportJSON && !exportDXF && !exportGeoJSON) return;
    
    const isCSVValid = validateCleanCSVExport(points, exportToCSV(points)).isValid;
    const isJSONValid = validateJSONExport(generateTechnicalJSON()).isValid;
    const isDXFValid = !exportDXF || !contoursResult ? true : validateDXFExport(exportContoursToDXF(points, contoursResult.lines, selectedCRS)).isValid;
    const isGeoJSONValid = !exportGeoJSON || !contoursResult ? true : validateGeoJSONExport(exportContoursToGeoJSON(contoursResult.lines, selectedCRS, contoursResult.interval), selectedCRS === 'LOCAL').isValid;

    // Safety blockers check
    if (exportCSV && !isCSVValid) return;
    if (exportPNG && pngQA && !pngQA.isValid) return;
    if (exportJSON && !isJSONValid) return;
    if (exportDXF && !isDXFValid) return;
    if (exportGeoJSON && !isGeoJSONValid) return;

    setIsExporting(true);
    setExportStatus('exporting');

    setTimeout(() => {
      try {
        const baseProjectName = dataset?.name || 'terrenolab_proyecto';
        const sanitizedProjectName = sanitizeFilename(baseProjectName);
        
        const lastDot = sanitizedProjectName.lastIndexOf('.');
        const prefix = lastDot !== -1 ? sanitizedProjectName.substring(0, lastDot) : sanitizedProjectName;

        // 1. Export CSV
        if (exportCSV) {
          const csvText = exportToCSV(points);
          downloadFile(csvText, `${prefix}_puntos_limpios.csv`, 'text/csv');

          if (includeValidationErrors && validation && validation.rejectedRows.length > 0) {
            const errsCSV = exportValidationErrorsToCSV(validation.rejectedRows);
            downloadFile(errsCSV, `${prefix}_errores_validacion.csv`, 'text/csv');
          }
        }

        // 2. Export PNG
        if (exportPNG) {
          const canvas = hiddenContainerRef.current?.querySelector('canvas');
          if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `${prefix}_visor.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error('Canvas offscreen no encontrado');
          }
        }

        // 3. Export JSON Metadata
        if (exportJSON) {
          const techData = generateTechnicalJSON();
          downloadFile(JSON.stringify(techData, null, 2), `${prefix}_analisis.json`, 'application/json');
        }

        // 4. Export DXF curves
        if (exportDXF && contoursResult) {
          const dxfText = exportContoursToDXF(points, contoursResult.lines, selectedCRS);
          downloadFile(dxfText, `${prefix}_curvas.dxf`, 'image/vnd.dxf');
        }

        // 5. Export GeoJSON curves
        if (exportGeoJSON && contoursResult) {
          const geojsonText = exportContoursToGeoJSON(contoursResult.lines, selectedCRS, contoursResult.interval);
          downloadFile(geojsonText, `${prefix}_curvas.geojson`, 'application/geo+json');
        }

        setExportStatus('completed');
        setLastExportTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error during exports:', err);
        setExportStatus('error');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  // Renders the hidden offscreen viewer matching current workflow priority
  const renderHiddenViewer = () => {
    const minZ = metrics?.minZ || 0;
    const maxZ = metrics?.maxZ || 0;

    if (contoursResult && contoursResult.lines.length > 0) {
      return (
        <ContourViewer
          points={points}
          contours={contoursResult}
          showPoints={true}
          showGrid={true}
          minZ={minZ}
          maxZ={maxZ}
          viewerMode={viewerMode}
        />
      );
    }
    
    if (surface) {
      return (
        <SurfaceRasterViewer
          points={points}
          surface={surface}
          showPoints={true}
          showGrid={true}
          viewerMode={viewerMode}
        />
      );
    }

    return (
      <Terrain2DViewer
        points={points}
        metrics={metrics}
        grid={null}
        contours={[]}
        showGrid={true}
        showContours={false}
        showPoints={true}
        viewerMode={viewerMode}
      />
    );
  };

  // Get human readable status label and colors
  const getStatusDisplay = () => {
    switch (exportStatus) {
      case 'exporting':
        return (
          <span className="text-[#0891B2] font-semibold flex items-center gap-1.5 font-mono text-[12px]">
            <Loader2 className="animate-spin" size={14} />
            Exportando...
          </span>
        );
      case 'completed':
        return (
          <span className="text-[#16A34A] font-bold flex items-center gap-1.5 font-mono text-[12.5px]">
            ✓ Exportación completada
          </span>
        );
      case 'error':
        return (
          <span className="text-[#EF4444] font-bold flex items-center gap-1.5 font-mono text-[12.5px]">
            ⚠ Error al exportar
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="text-[#64748B] font-medium font-mono text-[12.5px]">
            Listo para exportar
          </span>
        );
    }
  };

  const isCSVValid = validateCleanCSVExport(points, exportToCSV(points)).isValid;
  const isJSONValid = validateJSONExport(generateTechnicalJSON()).isValid;
  const isErrorsCSVValid = 
    !includeValidationErrors ||
    !validation ||
    validation.rejectedRows.length === 0 ||
    validateErrorsCSVExport(validation, exportValidationErrorsToCSV(validation.rejectedRows)).isValid;

  const isDXFValid = !exportDXF || !contoursResult ? true : validateDXFExport(exportContoursToDXF(points, contoursResult.lines, selectedCRS)).isValid;
  const isGeoJSONValid = !exportGeoJSON || !contoursResult ? true : validateGeoJSONExport(exportContoursToGeoJSON(contoursResult.lines, selectedCRS, contoursResult.interval), selectedCRS === 'LOCAL').isValid;

  const isExportButtonDisabled = 
    isExporting || 
    (!exportCSV && !exportPNG && !exportJSON && !exportDXF && !exportGeoJSON) ||
    (exportCSV && !isCSVValid) ||
    (exportCSV && includeValidationErrors && !isErrorsCSVValid) ||
    (exportPNG && pngQA && !pngQA.isValid) ||
    (exportJSON && !isJSONValid) ||
    (exportDXF && !isDXFValid) ||
    (exportGeoJSON && !isGeoJSONValid);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-xl mx-auto w-full select-none bg-white font-sans">
      {/* Offscreen rendering box */}
      <div 
        ref={hiddenContainerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '800px',
          height: '600px',
          pointerEvents: 'none',
        }}
      >
        {renderHiddenViewer()}
      </div>

      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <h1 className="text-[18px] font-semibold text-[#0F172A]">
          Exportar Resultados
        </h1>
        <p className="text-[13px] text-[#64748B]">
          Seleccione los archivos estructurados que desea descargar del análisis actual.
        </p>
      </div>

      {/* Warnings Callout (Yellow) */}
      {hasWarnings && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[13px] font-semibold text-[#78350F]">
              Advertencias técnicas de QA
            </h4>
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              Los resultados tienen advertencias técnicas. Revise el QA antes de usar los archivos.
            </p>
          </div>
        </div>
      )}

      {/* Success Callout */}
      {!hasWarnings && (
        <div className="bg-[#F0FDF4] border border-[#10B981]/20 rounded p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-[#10B981] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[13px] font-semibold text-[#14532D]">
              Procesamiento Completado con Éxito
            </h4>
            <p className="text-[12px] text-[#166534] leading-relaxed">
              La nube de puntos e isolíneas cumplen rigurosamente con los criterios de estabilidad matemática.
            </p>
          </div>
        </div>
      )}

      {/* Análisis Completo Card */}
      <div className="border border-[#E2E8F0] rounded-lg p-4 space-y-3 bg-[#F8FAFC]">
        <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0891B2] border-b border-slate-200/60 pb-1.5 mb-2">
          Resumen: Análisis Completo
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px] font-sans">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">Puntos válidos:</span>
            <span className="font-semibold text-[#0F172A]">{points.length}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">Filas rechazadas:</span>
            <span className={`font-semibold ${validation?.summary.rejectedRows && validation.summary.rejectedRows > 0 ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
              {validation?.summary.rejectedRows ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">QA Topográfico:</span>
            <span className="font-semibold text-[#0F172A]" title={qaResult?.quality.recommendations.join('\n')}>
              {qaResult?.quality.label ?? '---'} ({qaResult?.quality.score ?? 0}/100)
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">Superficie IDW:</span>
            <span className="font-semibold text-[#0F172A]">
              {surface ? `${surface.gridX.length}x${surface.gridY.length} (${surface.power.toFixed(1)}p)` : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">QA Superficie:</span>
            {surfaceQA ? (
              <span className={`font-semibold ${surfaceQA.isStable ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                {surfaceQA.isStable ? 'Estable' : 'Inestable'} ({surfaceQA.blockers.length} blq)
              </span>
            ) : (
              <span className="text-slate-400">---</span>
            )}
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">Curvas generadas:</span>
            <span className="font-semibold text-[#0F172A]">
              {contoursResult ? `${contoursResult.lineCount} líneas` : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">QA Curvas:</span>
            {contourQA ? (
              <span className={`font-semibold ${contourQA.isValid ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                {contourQA.isValid ? 'Estable' : 'Bloqueado'}
              </span>
            ) : (
              <span className="text-slate-400">---</span>
            )}
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
            <span className="text-[#64748B]">Exportación:</span>
            <span className={`font-semibold ${exportQA?.isValid ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
              {exportQA?.isValid ? 'Apto' : 'No Apto'}
            </span>
          </div>
        </div>
      </div>

      {/* Verification section */}
      <div className="border border-[#E2E8F0] rounded p-4 space-y-2 bg-[#F8FAFC]">
        <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200/60 pb-1.5 mb-2">
          Verificación de archivos
        </h4>
        <div className="text-[13px] font-sans space-y-2.5">
          {/* CSV Clean Status */}
          <div className="flex justify-between items-center">
            <span className="text-[#334155] font-medium">CSV limpio:</span>
            {isCSVValid ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                Listo
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                Bloqueado
              </span>
            )}
          </div>

          {/* PNG Viewer Status */}
          <div className="flex justify-between items-center">
            <span className="text-[#334155] font-medium">PNG visor:</span>
            {pngQA?.isValid ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                Listo
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold" title={pngQA?.message}>
                Bloqueado
              </span>
            )}
          </div>

          {/* JSON Status */}
          <div className="flex justify-between items-center">
            <span className="text-[#334155] font-medium">JSON técnico:</span>
            {isJSONValid ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                Listo
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                Bloqueado
              </span>
            )}
          </div>

          {/* DXF Status */}
          <div className="flex justify-between items-center">
            <span className="text-[#334155] font-medium">DXF curvas:</span>
            {!contoursResult ? (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[11px] font-bold">
                Sin curvas
              </span>
            ) : isDXFValid ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                Listo
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                Bloqueado
              </span>
            )}
          </div>

          {/* GeoJSON Status */}
          <div className="flex justify-between items-center">
            <span className="text-[#334155] font-medium">GeoJSON curvas:</span>
            {!contoursResult ? (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[11px] font-bold">
                Sin curvas
              </span>
            ) : isGeoJSONValid ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                Listo
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                Bloqueado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Export Form checkboxes */}
      <div className="border border-[#E2E8F0] rounded p-4 space-y-4">
        {/* CSV Checkbox block */}
        <div className="flex items-start justify-between p-3 border border-[#E2E8F0] rounded bg-slate-50/50">
          <div className="flex gap-3">
            <input
              type="checkbox"
              id="exportCSVCheck"
              checked={exportCSV}
              onChange={(e) => setExportCSV(e.target.checked)}
              className="accent-[#0891B2] rounded mt-1 cursor-pointer"
            />
            <div>
              <label htmlFor="exportCSVCheck" className="text-[13px] font-semibold text-[#0F172A] cursor-pointer block">
                CSV limpio de puntos válidos
              </label>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Listado depurado de coordenadas (id, x, y, z).
              </span>
              
              {exportCSV && validation && validation.rejectedRows.length > 0 && (
                <div className="mt-2.5 pl-1">
                  <label className="flex items-center gap-2 text-[12px] text-[#64748B] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={includeValidationErrors}
                      onChange={(e) => setIncludeValidationErrors(e.target.checked)}
                      className="accent-[#0891B2] rounded"
                    />
                    Incluir resumen de errores de validación ({validation.rejectedRows.length} filas)
                  </label>
                </div>
              )}
            </div>
          </div>
          <FileSpreadsheet className={exportCSV ? 'text-[#0891B2]' : 'text-slate-300'} size={20} />
        </div>

        {/* PNG Checkbox block */}
        <div className="flex items-start justify-between p-3 border border-[#E2E8F0] rounded bg-slate-50/50">
          <div className="flex gap-3">
            <input
              type="checkbox"
              id="exportPNGCheck"
              checked={exportPNG}
              onChange={(e) => setExportPNG(e.target.checked)}
              className="accent-[#0891B2] rounded mt-1 cursor-pointer"
            />
            <div>
              <label htmlFor="exportPNGCheck" className="text-[13px] font-semibold text-[#0F172A] cursor-pointer block">
                PNG del visor actual
              </label>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Instantánea técnica con proporción de aspecto y leyenda integrada.
              </span>
            </div>
          </div>
          <Image className={exportPNG ? 'text-[#0891B2]' : 'text-slate-300'} size={20} />
        </div>

        {/* JSON Checkbox block */}
        <div className="flex items-start justify-between p-3 border border-[#E2E8F0] rounded bg-slate-50/50">
          <div className="flex gap-3">
            <input
              type="checkbox"
              id="exportJSONCheck"
              checked={exportJSON}
              onChange={(e) => setExportJSON(e.target.checked)}
              className="accent-[#0891B2] rounded mt-1 cursor-pointer"
            />
            <div>
              <label htmlFor="exportJSONCheck" className="text-[13px] font-semibold text-[#0F172A] cursor-pointer block">
                JSON técnico del análisis
              </label>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Resumen estructurado de estadísticas y resultados de QA.
              </span>
            </div>
          </div>
          <FileJson className={exportJSON ? 'text-[#0891B2]' : 'text-slate-300'} size={20} />
        </div>

        {/* Formatos técnicos header */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
            Formatos técnicos
          </h4>
          <p className="text-[12px] text-[#64748B] leading-normal italic">
            DXF y GeoJSON exportan las curvas generadas desde la superficie IDW validada.
          </p>
        </div>

        {/* DXF Checkbox block */}
        <div className="flex items-start justify-between p-3 border border-[#E2E8F0] rounded bg-slate-50/50">
          <div className="flex gap-3">
            <input
              type="checkbox"
              id="exportDXFCheck"
              checked={exportDXF}
              onChange={(e) => setExportDXF(e.target.checked)}
              disabled={!contoursResult}
              className="accent-[#0891B2] rounded mt-1 cursor-pointer disabled:opacity-50"
            />
            <div>
              <label htmlFor="exportDXFCheck" className={`text-[13px] font-semibold block ${contoursResult ? 'text-[#0F172A] cursor-pointer' : 'text-slate-400'}`}>
                DXF de curvas de nivel
              </label>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Isolíneas y nube de puntos para AutoCAD, Civil 3D y software CAD compatible.
              </span>
            </div>
          </div>
          <Spline className={exportDXF && contoursResult ? 'text-[#0891B2]' : 'text-slate-300'} size={20} />
        </div>

        {/* GeoJSON Checkbox block */}
        <div className="flex items-start justify-between p-3 border border-[#E2E8F0] rounded bg-slate-50/50">
          <div className="flex gap-3">
            <input
              type="checkbox"
              id="exportGeoJSONCheck"
              checked={exportGeoJSON}
              onChange={(e) => setExportGeoJSON(e.target.checked)}
              disabled={!contoursResult}
              className="accent-[#0891B2] rounded mt-1 cursor-pointer disabled:opacity-50"
            />
            <div>
              <label htmlFor="exportGeoJSONCheck" className={`text-[13px] font-semibold block ${contoursResult ? 'text-[#0F172A] cursor-pointer' : 'text-slate-400'}`}>
                GeoJSON de curvas de nivel
              </label>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Curvas georreferenciadas con atributos (level, index, interval) para QGIS y software GIS.
              </span>
            </div>
          </div>
          <FileJson className={exportGeoJSON && contoursResult ? 'text-[#0891B2]' : 'text-slate-300'} size={20} />
        </div>
      </div>

      {/* Action Trigger Row */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        {getStatusDisplay()}
        <Button 
          variant="primary" 
          onClick={handleExportAll} 
          disabled={isExportButtonDisabled}
          className="px-5 py-2 font-semibold shadow-sm justify-center"
        >
          <Download size={14} className="mr-1.5" />
          Exportar seleccionados
        </Button>
      </div>

      {/* Reset analysis */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
        <div className="text-[12px] text-amber-700 bg-amber-50/50 border border-amber-200/40 rounded p-2 flex items-start gap-1.5 leading-snug">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={13} />
          <span>
            El CRS seleccionado solo describe el sistema de coordenadas del archivo cargado. TerrenoLab no reproyecta coordenadas todavía.
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#64748B] font-mono">
            {getCRSLabelAndEPSG(selectedCRS)}
          </span>
          <Button variant="ghost" onClick={onReset}>
            <RefreshCw size={14} className="mr-1.5" />
            Nuevo Análisis
          </Button>
        </div>
      </div>
    </div>
  );
}
