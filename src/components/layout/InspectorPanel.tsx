import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Spline, Compass, Info } from 'lucide-react';
import { WorkflowState } from '../../domain/workflow/workflowTypes';
import { TerrainDataset, TerrainMetrics } from '../../domain/terrain/types';
import { ValidationResult } from '../../domain/terrain/validation';
import { TopographicQAResult } from '../../domain/terrain/qa';
import { IDWSurfaceResult } from '../../domain/terrain/interpolation';
import { SurfaceQAResult } from '../../domain/terrain/surfaceQA';
import { ContourResult } from '../../domain/terrain/contours';
import { ContourQAResult } from '../../domain/terrain/contourQA';
import { ExportQAResult } from '../../domain/terrain/exportQA';
import { VolumeOptions, VolumeResult } from '../../domain/terrain/volume';
import { VolumeQAResult } from '../../domain/terrain/volumeQA';
import { VolumeAuditResult } from '../../domain/terrain/volumeAudit';
import { Badge } from '../ui/Badge';
import { InspectorViewHeader } from '../inspector/InspectorViewHeader';
import { InspectorStatus } from '../inspector/InspectorStatusBadge';

// Material Layers
import { FillMaterialLayer, MaterialLayerResult } from '../../domain/terrain/materialLayers';
import { MaterialLayersQAResult } from '../../domain/terrain/materialLayersQA';


interface InspectorPanelProps {
  currentState: WorkflowState;
  dataset: TerrainDataset | null;
  metrics: TerrainMetrics | null;
  validation: ValidationResult | null;
  qaResult?: TopographicQAResult | null;
  resolution: 'low' | 'medium' | 'high';
  power: number;
  contourInterval: number;
  surface: IDWSurfaceResult | null;
  surfaceQA: SurfaceQAResult | null;
  contours: ContourResult | null;
  contourQA?: ContourQAResult | null;
  includeIndexContours: boolean;
  indexEvery: number;
  isProcessing?: boolean;
  exportStatus?: string;
  exportQA?: ExportQAResult | null;
  selectedCRS?: string;
  polygon?: Array<{ x: number; y: number }>;
  volumeOptions?: VolumeOptions;
  onVolumeOptionsChange?: (val: VolumeOptions) => void;
  volumeResult?: VolumeResult | null;
  volumeQA?: VolumeQAResult | null;
  volumeAudit?: VolumeAuditResult | null;
  materialLayers?: FillMaterialLayer[];
  onMaterialLayersChange?: (layers: FillMaterialLayer[]) => void;
  materialLayersResult?: MaterialLayerResult | null;
  materialLayersQA?: MaterialLayersQAResult | null;
  onCRSChange?: (val: string) => void;
  onResolutionChange?: (val: 'low' | 'medium' | 'high') => void;
  onPowerChange?: (val: number) => void;
  onContourIntervalChange?: (val: number) => void;
  onIncludeIndexContoursChange?: (val: boolean) => void;
  onIndexEveryChange?: (val: number) => void;
  onGenerateSurface?: () => void;
  onGenerateContours?: () => void;
  showPoints?: boolean;
  setShowPoints?: (val: boolean) => void;
  showGrid?: boolean;
  setShowGrid?: (val: boolean) => void;
  showContours?: boolean;
  setShowContours?: (val: boolean) => void;
  polygonMode?: 'idle' | 'drawing' | 'editing';
  lastPolygonEditTime?: string | null;
  skippedVolume?: boolean;
  skippedContours?: boolean;
}

const getCRSLabel = (crs: string) => {
  switch (crs) {
    case 'WGS84_18S': return 'WGS 84 / UTM Zona 18S';
    case 'WGS84_19S': return 'WGS 84 / UTM Zona 19S';
    case 'WGS84_20S': return 'WGS 84 / UTM Zona 20S';
    case 'SIRGAS_18S': return 'SIRGAS-Chile 2002 / UTM Zona 18S';
    case 'SIRGAS_19S': return 'SIRGAS-Chile 2002 / UTM Zona 19S';
    case 'LOCAL':
    default:
      return 'CRS: no especificado';
  }
};

const getEPGLabel = (crs: string) => {
  switch (crs) {
    case 'WGS84_18S': return 'EPSG:32718';
    case 'WGS84_19S': return 'EPSG:32719';
    case 'WGS84_20S': return 'EPSG:32720';
    case 'SIRGAS_18S': return 'EPSG:5362';
    case 'SIRGAS_19S': return 'EPSG:5361';
    case 'LOCAL':
    default:
      return 'EPSG: no aplica';
  }
};

export function InspectorPanel({
  currentState,
  dataset,
  metrics,
  validation,
  qaResult,
  resolution,
  power,
  contourInterval,
  surface,
  surfaceQA,
  contours,
  contourQA,
  includeIndexContours,
  indexEvery,
  isProcessing = false,
  onResolutionChange,
  onPowerChange,
  onContourIntervalChange,
  onIncludeIndexContoursChange,
  onIndexEveryChange,
  onGenerateSurface,
  onGenerateContours,
  showPoints = true,
  setShowPoints,
  showGrid = false,
  setShowGrid,
  showContours = true,
  setShowContours,
  exportStatus = 'idle',
  exportQA = null,
  selectedCRS = 'LOCAL',
  onCRSChange,
  polygon = [],
  volumeOptions = { targetElevation: 0, compactionFactor: 1.2, wasteFactor: 1.05 },
  onVolumeOptionsChange,
  volumeResult = null,
  volumeQA = null,
  volumeAudit = null,
  materialLayers = [],
  onMaterialLayersChange,
  materialLayersResult = null,
  materialLayersQA = null,
  polygonMode = 'idle',
  lastPolygonEditTime = null,
  skippedVolume = false,
  skippedContours = false,
}: InspectorPanelProps) {
  const getTerrainReviewStatus = (): InspectorStatus => {
    if (!qaResult) return 'Bloqueado';
    if (qaResult.quality.blockers.length > 0 || !qaResult.quality.canInterpolate) {
      return 'Bloqueado';
    }
    if (qaResult.quality.warnings.length > 0 || qaResult.quality.label === 'Baja' || qaResult.quality.label === 'Regular') {
      return 'Requiere revisión';
    }
    return 'Apto para interpolación';
  };

  const getSurfaceStatus = (): InspectorStatus => {
    if (!surface) return 'Pendiente';
    if (!surfaceQA) return 'Estable';
    if (surfaceQA.blockers.length > 0) return 'Crítico';
    if (surfaceQA.warnings.length > 0) return 'Advertencia';
    return 'Estable';
  };

  const getContourStatus = (): InspectorStatus => {
    if (skippedContours) return 'Omitido';
    if (!contours) return 'Pendiente';
    if (!contourQA) return 'Estable';
    if (contourQA.blockers.length > 0) return 'Crítico';
    if (contourQA.warnings.length > 0) return 'Advertencia';
    return 'Estable';
  };

  const getVolumeStatus = (): InspectorStatus => {
    if (skippedVolume) return 'Omitido';
    if (polygon.length === 0) return 'Pendiente';
    if (polygon.length < 3) return 'Pendiente';

    const hasCriticalBlockers = 
      (volumeQA && volumeQA.blockers.some(b => 
        b !== 'No se ha dibujado ningún polígono de análisis.' &&
        b !== 'El polígono de análisis está incompleto: requiere al menos 3 vértices.'
      )) || 
      (volumeAudit && volumeAudit.blockers.length > 0) ||
      (materialLayersQA && materialLayersQA.blockers.length > 0);

    if (hasCriticalBlockers) return 'Crítico';

    const hasWarnings = 
      (volumeQA && volumeQA.warnings.length > 0) || 
      (volumeAudit && volumeAudit.warnings.length > 0) ||
      (materialLayersQA && materialLayersQA.warnings.length > 0);

    if (hasWarnings) return 'Advertencia';

    if (volumeResult) return 'Estable';
    return 'Pendiente';
  };

  const getExportStatus = (): InspectorStatus => {
    const isContoursBlocked = contourQA ? contourQA.blockers.length > 0 : false;
    const isSurfaceBlocked = surfaceQA ? surfaceQA.blockers.length > 0 : false;
    const hasContoursGenerated = contours !== null && contours !== undefined;
    
    if (isContoursBlocked || isSurfaceBlocked || !hasContoursGenerated) {
      return 'Bloqueado';
    }
    
    const hasContoursWarnings = contourQA ? contourQA.warnings.length > 0 : false;
    const hasSurfaceWarnings = surfaceQA ? surfaceQA.warnings.length > 0 : false;
    if (hasContoursWarnings || hasSurfaceWarnings) {
      return 'Advertencia';
    }
    
    return 'Listo';
  };

  const renderContextualHeader = () => {
    let mode: 'Puntos' | 'Superficie' | 'Curvas' | 'Volumen' | 'Exportacion' = 'Puntos';
    let title = '';
    let description = '';
    let status: InspectorStatus = 'Pendiente';

    switch (currentState) {
      case 'TERRAIN_REVIEWED':
        mode = 'Puntos';
        title = 'Revisión de terreno';
        description = 'Distribución planimétrica del levantamiento';
        status = getTerrainReviewStatus();
        break;
      case 'SURFACE_READY':
        mode = 'Superficie';
        title = 'Superficie interpolada';
        description = 'Modelo raster IDW del terreno';
        status = getSurfaceStatus();
        break;
      case 'CONTOURS_READY':
        mode = 'Curvas';
        title = 'Curvas de nivel';
        description = 'Trazado vectorial mediante Marching Squares';
        status = getContourStatus();
        break;
      case 'VOLUME_READY':
        mode = 'Volumen';
        title = 'Corte y relleno';
        description = 'Estimación volumétrica sobre polígono';
        status = getVolumeStatus();
        break;
      case 'EXPORT_READY':
        mode = 'Exportacion';
        title = 'Exportación';
        description = 'Descarga de entregables técnicos';
        status = getExportStatus();
        break;
      default:
        mode = 'Puntos';
        title = 'Preparación del análisis';
        description = 'Configure los datos iniciales';
        status = 'Pendiente';
        break;
    }

    return (
      <InspectorViewHeader
        mode={mode}
        title={title}
        description={description}
        status={status}
      />
    );
  };

  const renderQABox = () => {
    if (!qaResult) return null;
    const { classification, quality, spatialCoverage, outlierResult } = qaResult;
    
    const getDatasetTypeLabel = (type: string) => {
      switch (type) {
        case 'DEM_GRID': return 'Grilla Regular (DEM)';
        case 'FIELD_SURVEY': return 'Levantamiento Irregular';
        case 'POSSIBLE_HILLSHADE': return 'Hillshade / Imagen (Sospechoso)';
        case 'UNKNOWN':
        default:
          return 'Desconocido';
      }
    };

    const getScoreBadgeColor = (label: string) => {
      switch (label) {
        case 'Excelente': return 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20';
        case 'Buena': return 'bg-[#ECFDF5] text-[#059669] border-[#059669]/20';
        case 'Regular': return 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20';
        case 'Baja': return 'bg-[#FFF5F5] text-[#DC2626] border-[#DC2626]/20';
        case 'Crítica':
        default:
          return 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20';
      }
    };

    return (
      <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3">
        <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
          QA Topográfico
        </h4>
        <div className="space-y-2 text-[13px] font-sans">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Tipo dataset:</span>
            <span className="text-[#0F172A] font-semibold">{getDatasetTypeLabel(classification.datasetType)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Score:</span>
            <span className={`px-2 py-0.5 border rounded-full text-[12px] font-bold ${getScoreBadgeColor(quality.label)}`}>
              {quality.score} ({quality.label})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Cobertura:</span>
            <span className="text-[#0F172A] font-mono text-[12px]">{(spatialCoverage.coverageRatio * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Densidad:</span>
            <span className="text-[#0F172A] font-mono text-[12px]">{spatialCoverage.pointDensity.toFixed(5)} pt/m²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Outliers Z:</span>
            <span className={`font-mono text-[12px] ${outlierResult.outlierCount > 0 ? 'text-[#EF4444] font-semibold' : 'text-[#64748B]'}`}>
              {outlierResult.outlierCount} pts ({ (outlierResult.outlierRatio * 100).toFixed(1) }%)
            </span>
          </div>
          <div className="text-[12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-[#475569] leading-relaxed">
            <span className="font-semibold block text-[#334155] mb-0.5">Recomendación:</span>
            {quality.recommendations[0]}
          </div>
          
          <div className={`text-[12px] font-semibold p-2 border rounded mt-2 ${
            quality.canInterpolate 
              ? 'bg-[#F0FDF4] border-[#10B981]/20 text-[#059669]' 
              : 'bg-[#FEF2F2] border-[#EF4444]/20 text-[#EF4444]'
          }`}>
            {quality.canInterpolate 
              ? '✓ Este dataset será apto para interpolación futura.' 
              : '⚠ NO APTO para interpolación futura.'}
          </div>
        </div>
      </div>
    );
  };

  const renderContextualInspector = () => {
    switch (currentState) {
      case 'EMPTY':
        return (
          <div className="space-y-4">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2">
              <Info size={14} className="text-[#06B6D4]" />
              Instrucciones
            </h3>
            <p className="text-[13px] text-[#64748B] leading-relaxed font-sans">
              Cargue un levantamiento topográfico de ejemplo o suba su propio archivo CSV para inicializar el inspector de datos espaciales.
            </p>
          </div>
        );

      case 'FILE_SELECTED':
        return (
          <div className="space-y-4">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2">
              Importación
            </h3>
            <div className="space-y-3 font-sans text-[13px]">
              <div>
                <span className="text-[12px] text-[#64748B] block">Formato Esperado:</span>
                <span className="text-[#0F172A] font-medium block">CSV delimitado (, o ;)</span>
              </div>
              <div>
                <span className="text-[12px] text-[#64748B] block">Columnas Requeridas:</span>
                <span className="text-[#0F172A] font-medium block">Easting (X), Northing (Y), Elevation (Z)</span>
              </div>
              <div>
                <span className="text-[12px] text-[#64748B] block">Estado del Archivo:</span>
                <span className="text-[#10B981] font-semibold block">Listo. Mapeando columnas...</span>
              </div>
            </div>
          </div>
        );

      case 'VALIDATED':
        return (
          <div className="space-y-4">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#10B981]" />
              Resultado QA
            </h3>
            {validation && (
              <div className="space-y-3 text-[13px] font-sans">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Columnas mapeadas:</span>
                  <span className="text-[#0F172A] font-medium font-mono text-[12px]">X, Y, Z</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Filas válidas:</span>
                  <span className="text-[#0F172A] font-semibold">{validation.summary.validRows} puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Filas rechazadas:</span>
                  <span className={`font-semibold ${validation.summary.rejectedRows > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                    {validation.summary.rejectedRows}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Duplicados X/Y:</span>
                  <span className={`font-semibold ${validation.summary.duplicatedXY > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                    {validation.summary.duplicatedXY}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2">
                  <span className="text-[#64748B]">Rango Z:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">
                    {validation.summary.minZ.toFixed(2)}m a {validation.summary.maxZ.toFixed(2)}m
                  </span>
                </div>
              </div>
            )}
            {renderQABox()}
          </div>
        );

      case 'TERRAIN_REVIEWED':
        return (
          <div className="space-y-4">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2">
              Estado Levantamiento
            </h3>
            {metrics && validation && (
              <div className="space-y-3 text-[13px] font-sans">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Puntos válidos:</span>
                  <span className="text-[#0F172A] font-semibold">{metrics.pointCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Filas rechazadas:</span>
                  <span className={`font-semibold ${validation.summary.rejectedRows > 0 ? 'text-[#EF4444]' : 'text-[#64748B]'}`}>
                    {validation.summary.rejectedRows}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Cota mínima:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">{metrics.minZ.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Cota máxima:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">{metrics.maxZ.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 font-semibold">
                  <span className="text-[#64748B]">Desnivel:</span>
                  <span className="text-[#0F172A] font-mono">{metrics.deltaZ.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Área bounding box:</span>
                  <span className="text-[#0F172A] font-mono">{(metrics.boundingBoxArea / 10000).toFixed(2)} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Densidad de puntos:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">{metrics.pointDensity.toFixed(5)} pt/m²</span>
                </div>
                
                {validation.warnings.length > 0 && (
                  <div className="border-t border-[#E2E8F0] pt-2 space-y-1">
                    <span className="text-[12px] text-[#F59E0B] font-semibold block uppercase tracking-wider">Advertencias:</span>
                    {validation.warnings.map((w, idx) => (
                      <div key={idx} className="text-[12px] text-[#F59E0B] font-mono leading-tight">
                        • {w.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {renderQABox()}
          </div>
        );

      case 'SURFACE_READY': {
        const hasSurface = surface !== null;
        return (
          <div className="space-y-4 font-sans text-[13px]">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2">
              Superficie Grid
            </h3>

            {/* Resolution Selector */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] font-semibold block">Resolución de Grilla:</label>
              <select
                value={resolution}
                onChange={(e) => onResolutionChange?.(e.target.value as 'low' | 'medium' | 'high')}
                disabled={isProcessing}
                className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
              >
                <option value="low">Baja (40x40 - 1,600 celdas)</option>
                <option value="medium">Media (80x80 - 6,400 celdas)</option>
                <option value="high">Alta (120x120 - 14,400 celdas)</option>
              </select>
            </div>

            {/* Power Exponent */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[12px] text-[#64748B] font-semibold block">Exponente de Distancia (p):</label>
                <span className="font-mono text-[12px] font-bold text-[#0F172A]">{power.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.5"
                value={power}
                onChange={(e) => onPowerChange?.(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full accent-[#0891B2] cursor-pointer"
              />
              <span className="text-[11px] text-[#94A3B8] block">Valores típicos: 2.0 (Gravedad), 1.0 a 3.0.</span>
            </div>

            {/* Calculation Button */}
            <button
              onClick={onGenerateSurface}
              disabled={isProcessing}
              className={`w-full py-2 px-3 rounded text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isProcessing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#0891B2] hover:bg-[#06b6d4] text-white'
              }`}
            >
              <Cpu size={14} />
              {isProcessing ? 'Procesando IDW...' : hasSurface ? 'Recalcular Superficie' : 'Generar Superficie'}
            </button>

            {/* Calculation Stats */}
            {hasSurface && surface && (
              <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-[13px]">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Estadísticas de Cálculo
                </h4>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Método:</span>
                  <span className="text-[#0F172A] font-semibold">{surface.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Dimensiones:</span>
                  <span className="text-[#0F172A] font-semibold font-mono text-[12px]">
                    {surface.resolution} x {surface.resolution}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Celdas:</span>
                  <span className="text-[#0F172A] font-semibold font-mono text-[12px]">
                    {(surface.resolution * surface.resolution).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Tiempo:</span>
                  <span className="text-[#0F172A] font-semibold font-mono text-[12px]">
                    {surface.processingTimeMs} ms
                  </span>
                </div>
              </div>
            )}

            {/* QA de Superficie Section */}
            {hasSurface && surface && surfaceQA && (
              <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-[13px]">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  QA de Superficie
                </h4>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Contiene NaN:</span>
                  <span className={`font-semibold ${surfaceQA.hasNaN ? 'text-red-600' : 'text-green-600'}`}>
                    {surfaceQA.hasNaN ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Contiene Infinity:</span>
                  <span className={`font-semibold ${surfaceQA.hasInfinity ? 'text-red-600' : 'text-green-600'}`}>
                    {surfaceQA.hasInfinity ? 'Sí' : 'No'}
                  </span>
                </div>
                
                <div className="text-[12px] text-slate-500 font-mono mt-1 mb-1">
                  <span className="font-semibold block text-[#64748B] font-sans">Límites de cotas (Z):</span>
                </div>
                <div className="grid grid-cols-3 text-[11px] text-slate-700 bg-slate-50 border border-slate-200/50 rounded p-1.5 text-center font-mono">
                  <div className="border-r border-slate-200">
                    <span className="text-[#64748B] text-[9px] block font-sans uppercase">Origen</span>
                    <span>{surfaceQA.originalMinZ.toFixed(2)}m</span>
                    <span className="block border-t border-slate-200 mt-1 pt-1">{surfaceQA.originalMaxZ.toFixed(2)}m</span>
                  </div>
                  <div className="border-r border-slate-200">
                    <span className="text-[#64748B] text-[9px] block font-sans uppercase">Grid</span>
                    <span>{surfaceQA.surfaceMinZ.toFixed(2)}m</span>
                    <span className="block border-t border-slate-200 mt-1 pt-1">{surfaceQA.surfaceMaxZ.toFixed(2)}m</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[9px] block font-sans uppercase">Dif</span>
                    <span className={`${Math.abs(surfaceQA.minDifference) > 0.05 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                      {surfaceQA.minDifference.toFixed(2)}m
                    </span>
                    <span className={`block border-t border-slate-200 mt-1 pt-1 ${Math.abs(surfaceQA.maxDifference) > 0.05 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                      {surfaceQA.maxDifference.toFixed(2)}m
                    </span>
                  </div>
                </div>

                <div className="flex justify-between font-mono text-[12px] pt-1">
                  <span className="text-[#64748B]">Rango Z original:</span>
                  <span className="text-slate-700 font-semibold">{surfaceQA.zRangeOriginal.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between font-mono text-[12px]">
                  <span className="text-[#64748B]">Rango Z interpolado:</span>
                  <span className="text-slate-700 font-semibold">{surfaceQA.zRangeSurface.toFixed(2)} m</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                  <span className="text-[#64748B] font-semibold">Estado de Superficie:</span>
                  {surfaceQA.blockers.length > 0 ? (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-mono text-[11px] font-bold">
                      Crítico
                    </span>
                  ) : surfaceQA.warnings.length > 0 ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-mono text-[11px] font-bold">
                      Advertencia
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full font-mono text-[11px] font-bold">
                      Estable
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Diagnóstico técnico por resoluciones y potencia IDW */}
            <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-[12px]">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                Diagnóstico de Parámetros
              </h4>
              <div className="bg-slate-50 border border-slate-100 rounded p-2 text-[#475569] space-y-1.5 font-sans leading-relaxed">
                <div>
                  <span className="font-semibold block text-[#334155] text-[11px]">Impacto de Resolución:</span>
                  <span className="text-[11px] block text-[#64748B] mb-0.5">
                    • <strong>Baja (40x40):</strong> Pre-análisis instantáneo.
                  </span>
                  <span className="text-[11px] block text-[#64748B] mb-0.5">
                    • <strong>Media (80x80):</strong> Recomendado, balanceado.
                  </span>
                  <span className="text-[11px] block text-[#64748B]">
                    • <strong>Alta (120x120):</strong> Nitidez y curvas precisas.
                  </span>
                  <p className="text-[10.5px] text-[#64748B] italic mt-1 border-t border-slate-200/60 pt-1">
                    La forma general del relieve se mantiene constante entre resoluciones ya que el modelo matemático IDW es estable.
                  </p>
                </div>
                <div className="border-t border-slate-200/60 pt-1.5">
                  <span className="font-semibold block text-[#334155] text-[11px]">Impacto de Potencia:</span>
                  <p className="text-[11px] text-[#64748B]">
                    Potencias mayores dan más peso a puntos cercanos y pueden generar variaciones más locales (efecto "bull's eye" o picos), mientras que potencias menores suavizan en exceso el terreno.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Warning */}
            <div className="bg-[#FFF8E7] border border-[#F59E0B]/20 rounded p-2.5 text-[12px] text-[#854D0E] leading-relaxed flex gap-1.5 items-start">
              <Info size={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
              <p>
                <strong>Nota técnica:</strong> IDW es una interpolación aproximada. No reemplaza un levantamiento topográfico profesional.
              </p>
            </div>
          </div>
        );
      }

      case 'CONTOURS_READY': {
        const hasContours = contours !== null;
        return (
          <div className="space-y-4 font-sans text-[13px]">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2">
              Curvas de Nivel
            </h3>

            {/* Interval Configuration */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] font-semibold block">Equidistancia (Intervalo):</label>
              <select
                value={contourInterval}
                onChange={(e) => onContourIntervalChange?.(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
              >
                <option value="0.5">0.5 m (Alta Densidad)</option>
                <option value="1">1.0 m (Detallado)</option>
                <option value="2">2.0 m (Normal)</option>
                <option value="5">5.0 m (Macro)</option>
              </select>
            </div>

            {/* Master Curves Options */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIndexContours}
                  onChange={(e) => onIncludeIndexContoursChange?.(e.target.checked)}
                  disabled={isProcessing}
                  className="accent-[#0891B2] rounded"
                />
                Curvas maestras (índice)
              </label>

              {includeIndexContours && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[12px] text-slate-500">Cada:</span>
                  <select
                    value={indexEvery}
                    onChange={(e) => onIndexEveryChange?.(parseInt(e.target.value))}
                    disabled={isProcessing}
                    className="bg-white border border-[#E2E8F0] rounded p-1 text-[12px] text-[#0F172A] font-semibold focus:outline-none"
                  >
                    <option value="5">5 líneas</option>
                    <option value="10">10 líneas</option>
                  </select>
                </div>
              )}
            </div>

            {/* Run Button in Sidebar */}
            <button
              onClick={onGenerateContours}
              disabled={isProcessing || !surface}
              className={`w-full py-2 px-3 rounded text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isProcessing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#0891B2] hover:bg-[#06b6d4] text-white'
              }`}
            >
              <Spline size={14} />
              {isProcessing ? 'Calculando Curvas...' : hasContours ? 'Recalcular Curvas' : 'Generar Curvas'}
            </button>

            {/* Statistics */}
            {hasContours && contours && (
              <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-[13px]">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Métricas de Contorno
                </h4>
                
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Estado:</span>
                  {contours.error ? (
                    <span className="text-red-600 font-semibold">Error de Rango</span>
                  ) : (
                    <span className="text-green-600 font-semibold">Trazado Realizado</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Intervalo:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">{contours.interval.toFixed(2)} m</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Niveles trazados:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">{contours.lineCount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Segmentos:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">
                    {contours.segmentCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Curvas maestras:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">
                    {contours.lines.filter(l => l.isIndex).length}
                  </span>
                </div>

                {contours.levels.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Rango de cotas:</span>
                    <span className="text-[#0F172A] font-semibold font-mono">
                      {contours.minLevel.toFixed(2)}m a {contours.maxLevel.toFixed(2)}m
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Tiempo de cálculo:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">
                    {contours.processingTimeMs} ms
                  </span>
                </div>
              </div>
            )}

            {/* QA de Curvas Section */}
            {hasContours && contours && contourQA && (
              <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-[13px]">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  QA de Curvas
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Estado:</span>
                  {contourQA.blockers.length > 0 ? (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-mono text-[11px] font-bold">
                      Crítico
                    </span>
                  ) : contourQA.warnings.length > 0 ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-mono text-[11px] font-bold">
                      Advertencia
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full font-mono text-[11px] font-bold">
                      Estable
                    </span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Niveles:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">{contourQA.levelCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Segmentos:</span>
                  <span className="text-[#0F172A] font-semibold font-mono">{contourQA.segmentCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Segmentos fuera de límite:</span>
                  <span className={`font-mono text-[12px] ${contourQA.outOfBoundsSegments > 0 ? 'text-[#EF4444] font-semibold' : 'text-[#64748B]'}`}>
                    {contourQA.outOfBoundsSegments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Niveles vacíos:</span>
                  <span className={`font-mono text-[12px] ${contourQA.emptyLevels > 0 ? 'text-[#EF4444] font-semibold' : 'text-[#64748B]'}`}>
                    {contourQA.emptyLevels}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Duplicados:</span>
                  <span className={`font-mono text-[12px] ${contourQA.duplicateSegments > 0 ? 'text-amber-600 font-semibold' : 'text-[#64748B]'}`}>
                    {contourQA.duplicateSegments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Rango esperado:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">
                    {contourQA.expectedMinLevel.toFixed(2)}m a {contourQA.expectedMaxLevel.toFixed(2)}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Rango generado:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">
                    {contourQA.minLevel.toFixed(2)}m a {contourQA.maxLevel.toFixed(2)}m
                  </span>
                </div>

                {/* Show blockers list if any */}
                {contourQA.blockers.length > 0 && (
                  <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded p-2 text-red-700 text-[11px] space-y-1">
                    <span className="font-bold block text-red-800">Bloqueadores de curvas:</span>
                    {contourQA.blockers.map((b, idx) => (
                      <div key={idx} className="leading-tight">• {b}</div>
                    ))}
                  </div>
                )}

                {/* Show warnings list if any */}
                {contourQA.warnings.length > 0 && (
                  <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded p-2 text-amber-700 text-[11px] space-y-1">
                    <span className="font-bold block text-amber-800">Advertencias de curvas:</span>
                    {contourQA.warnings.map((w, idx) => (
                      <div key={idx} className="leading-tight">• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technical Warning */}
            <div className="bg-[#FFF8E7] border border-[#F59E0B]/20 rounded p-2.5 text-[12px] text-[#854D0E] leading-relaxed flex gap-1.5 items-start">
              <Info size={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
              <p>
                <strong>Nota:</strong> Las curvas de nivel provienen de una superficie IDW interpolada. Son aproximadas.
              </p>
            </div>
          </div>
        );
      }

      case 'VOLUME_READY': {
        const handleTargetElevationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = parseFloat(e.target.value);
          onVolumeOptionsChange?.({
            ...volumeOptions,
            targetElevation: isNaN(val) ? 0 : val
          });
        };

        const handleCompactionFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = parseFloat(e.target.value);
          onVolumeOptionsChange?.({
            ...volumeOptions,
            compactionFactor: isNaN(val) ? 1.0 : val
          });
        };

        const handleWasteFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = parseFloat(e.target.value);
          onVolumeOptionsChange?.({
            ...volumeOptions,
            wasteFactor: isNaN(val) ? 1.0 : val
          });
        };

        const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
          onVolumeOptionsChange?.({
            ...volumeOptions,
            materialPricePerM3: val === undefined || isNaN(val) ? undefined : val
          });
        };

        const handleTransportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
          onVolumeOptionsChange?.({
            ...volumeOptions,
            fixedTransportCost: val === undefined || isNaN(val) ? undefined : val
          });
        };

        const hasPolygonPoints = polygon.length >= 3;

        // Collect all QA messages to check if there are any
        const qaBlockers = [
          ...(volumeQA && polygon.length >= 3 ? volumeQA.blockers : []),
          ...(volumeAudit ? volumeAudit.blockers : []),
          ...(materialLayersQA ? materialLayersQA.blockers : [])
        ].filter(b => 
          b !== 'No se ha dibujado ningún polígono de análisis.' &&
          b !== 'El polígono de análisis está incompleto: requiere al menos 3 vértices.'
        );

        const qaWarnings = [
          ...(volumeQA && polygon.length >= 3 ? volumeQA.warnings : []),
          ...(volumeAudit ? volumeAudit.warnings : []),
          ...(materialLayersQA ? materialLayersQA.warnings : [])
        ];

        const hasQAItems = qaBlockers.length > 0 || qaWarnings.length > 0;

        return (
          <div className="space-y-4 font-sans text-[13px]">
            {/* 1. Editor de polígono */}
            <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2 bg-[#F8FAFC]">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0891B2] border-b border-slate-200/60 pb-1 mb-1.5">
                1. Editor de Polígono
              </h4>
              <div className="space-y-1.5 text-[12.5px] font-sans">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Modo actual:</span>
                  <span className="font-semibold text-[#0F172A] capitalize">
                    {polygonMode === 'drawing' ? 'Dibujando' : polygonMode === 'editing' ? 'Editando' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Vértices:</span>
                  <span className="font-semibold text-[#0F172A] font-mono">{polygon.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Área:</span>
                  <span className="font-semibold text-[#0F172A] font-mono">
                    {volumeResult ? `${volumeResult.polygonArea.toFixed(2)} m²` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Perímetro:</span>
                  <span className="font-semibold text-[#0F172A] font-mono">
                    {volumeResult ? `${volumeResult.polygonPerimeter.toFixed(2)} m` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Estado:</span>
                  {polygon.length === 0 ? (
                    <span className="text-[#64748B] font-bold">Pendiente</span>
                  ) : polygon.length < 3 ? (
                    <span className="text-amber-600 font-bold">Incompleto</span>
                  ) : qaBlockers.length > 0 ? (
                    <span className="text-red-600 font-bold">Inválido</span>
                  ) : (
                    <span className="text-green-600 font-bold">Válido</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Última edición:</span>
                  <span className="text-[#0F172A] font-mono text-[11px] text-slate-500">
                    {lastPolygonEditTime ? lastPolygonEditTime : 'Sin editar'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Parámetros de cubicación */}
            <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2 bg-white">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200/60 pb-1 mb-1.5">
                2. Parámetros de Cubicación
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[11.5px] text-[#64748B] font-semibold block mb-1">
                    Cota Objetivo (m):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={volumeOptions.targetElevation}
                    onChange={handleTargetElevationChange}
                    className="w-full bg-white border border-[#E2E8F0] rounded p-1.5 text-[12.5px] text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                      F. Compactación:
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      value={volumeOptions.compactionFactor}
                      onChange={handleCompactionFactorChange}
                      className="w-full bg-white border border-[#E2E8F0] rounded p-1 text-[12.5px] text-[#0F172A] font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold block mb-1">
                      F. Pérdida / Cont.:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      value={volumeOptions.wasteFactor}
                      onChange={handleWasteFactorChange}
                      className="w-full bg-white border border-[#E2E8F0] rounded p-1 text-[12.5px] text-[#0F172A] font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Resultados de volumen */}
            <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2 bg-[#F8FAFC]">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200/60 pb-1 mb-1.5">
                3. Resultados de Volumen
              </h4>
              {!hasPolygonPoints ? (
                <div className="text-[12px] text-[#64748B] italic p-2 text-center">
                  Cálculo pendiente: dibuje un polígono.
                </div>
              ) : volumeResult ? (
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-[#64748B]">Relleno Bruto:</span>
                    <span className="text-green-600 font-bold font-mono">+{volumeResult.rawFillVolume.toFixed(1)} m³</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-[#64748B]">Corte Bruto:</span>
                    <span className="text-red-600 font-bold font-mono">-{volumeResult.rawCutVolume.toFixed(1)} m³</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-0.5">
                    <span className="text-[#64748B]">Balance Neto:</span>
                    <span className={`font-bold font-mono ${volumeResult.netVolume > 0 ? 'text-green-600' : volumeResult.netVolume < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {volumeResult.netVolume > 0 ? '+' : ''}{volumeResult.netVolume.toFixed(1)} m³
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#0F172A]">Volumen Recomendado:</span>
                    <span className="text-[#0891B2] font-bold font-mono">{volumeResult.recommendedFillVolume.toFixed(1)} m³</span>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-red-600 italic p-2 text-center">
                  Error de validación del cálculo.
                </div>
              )}
            </div>

            {/* 4. Materiales por capas */}
            <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2 bg-white">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200/60 pb-1 mb-1.5 flex justify-between items-center">
                <span>4. Materiales por Capas</span>
                {hasPolygonPoints && volumeResult && (
                  <button
                    onClick={() => {
                      const el = document.getElementById('materiales-tabla-header');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] text-[#0891B2] hover:underline font-bold capitalize outline-none"
                  >
                    Editar &rarr;
                  </button>
                )}
              </h4>
              {!hasPolygonPoints ? (
                <div className="text-[12px] text-[#64748B] italic p-1 text-center">
                  Requiere área de análisis.
                </div>
              ) : (
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Cantidad de capas:</span>
                    <span className="font-semibold">{materialLayers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Volumen asignado:</span>
                    <span className="font-semibold font-mono text-[#0891B2]">
                      {materialLayersResult ? (materialLayersResult.totalRawFillVolume - materialLayersResult.unassignedFillVolume).toFixed(1) : '0.0'} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Volumen sin asignar:</span>
                    <span className={`font-semibold font-mono ${materialLayersResult && materialLayersResult.unassignedFillVolume > 0.001 ? 'text-red-500 font-bold animate-pulse' : 'text-slate-600'}`}>
                      {materialLayersResult ? materialLayersResult.unassignedFillVolume.toFixed(1) : '0.0'} m³
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <span className="text-[#64748B]">Costo total por materiales:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {materialLayersResult && materialLayersResult.totalEstimatedCost !== null ? (
                        `$${materialLayersResult.totalEstimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      ) : (
                        '---'
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Costos */}
            <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2 bg-[#F8FAFC]">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200/60 pb-1 mb-1.5">
                5. Costos
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#64748B] block mb-0.5">Precio General ($/m³):</label>
                    <input
                      type="number"
                      placeholder="Ej. 1500"
                      value={volumeOptions.materialPricePerM3 === undefined ? '' : volumeOptions.materialPricePerM3}
                      onChange={handlePriceChange}
                      className="w-full bg-white border border-[#E2E8F0] rounded p-1 text-[12.5px] text-[#0F172A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] block mb-0.5">Transporte Fijo ($):</label>
                    <input
                      type="number"
                      placeholder="Ej. 50000"
                      value={volumeOptions.fixedTransportCost === undefined ? '' : volumeOptions.fixedTransportCost}
                      onChange={handleTransportChange}
                      className="w-full bg-white border border-[#E2E8F0] rounded p-1 text-[12.5px] text-[#0F172A] focus:outline-none"
                    />
                  </div>
                </div>

                {hasPolygonPoints && volumeResult && (
                  <div className="space-y-1 text-[12.5px] border-t border-slate-200/50 pt-2">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Costo por materiales:</span>
                      <span className="font-semibold font-mono">
                        {materialLayersResult && materialLayersResult.totalEstimatedCost !== null ? (
                          `$${materialLayersResult.totalEstimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        ) : volumeResult.estimatedMaterialCost !== undefined ? (
                          `$${volumeResult.estimatedMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        ) : (
                          '---'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Costo de transporte:</span>
                      <span className="font-semibold font-mono">
                        {volumeOptions.fixedTransportCost !== undefined ? (
                          `$${volumeOptions.fixedTransportCost.toLocaleString()}`
                        ) : (
                          '---'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-[#0891B2] border-t border-slate-100 pt-1.5">
                      <span>Costo estimado total:</span>
                      <span className="font-mono">
                        {materialLayersResult && materialLayersResult.totalEstimatedCost !== null ? (
                          `$${((materialLayersResult.totalEstimatedCost) + (volumeOptions.fixedTransportCost ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        ) : volumeResult.estimatedTotalCost !== undefined ? (
                          `$${volumeResult.estimatedTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        ) : (
                          '---'
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. QA / Advertencias (Only rendered if warning/blocker exists) */}
            {hasPolygonPoints && hasQAItems && (
              <div className="border border-[#F59E0B]/20 rounded-lg p-3 space-y-2 bg-[#FFFBEB]">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D97706] border-b border-[#F59E0B]/20 pb-1 mb-1.5">
                  6. QA / Advertencias
                </h4>
                
                {qaBlockers.length > 0 && (
                  <div className="text-[11.5px] text-red-700 space-y-1 font-sans">
                    <span className="font-bold block text-red-800">Bloqueadores Críticos:</span>
                    {qaBlockers.map((b, idx) => (
                      <div key={`qa-blk-${idx}`} className="leading-tight flex items-start gap-1">
                        <span className="text-red-500 shrink-0">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {qaWarnings.length > 0 && (
                  <div className="text-[11.5px] text-amber-700 space-y-1 font-sans pt-1 border-t border-[#F59E0B]/10">
                    <span className="font-bold block text-amber-800">Advertencias Técnicas:</span>
                    {qaWarnings.map((w, idx) => (
                      <div key={`qa-wrn-${idx}`} className="leading-tight flex items-start gap-1">
                        <span className="text-amber-500 shrink-0">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'EXPORT_READY': {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'exporting': return 'Exportando...';
            case 'completed': return 'Completado';
            case 'error': return 'Error';
            case 'idle':
            default:
              return 'Listo';
          }
        };

        const getStatusBadgeClass = (status: string) => {
          switch (status) {
            case 'exporting': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'error': return 'bg-red-50 text-red-700 border-red-200';
            case 'idle':
            default:
              return 'bg-slate-50 text-slate-700 border-slate-200';
          }
        };

        const hasContoursGenerated = contours !== null && contours !== undefined;
        const isContoursBlocked = contourQA ? contourQA.blockers.length > 0 : false;
        const isSurfaceBlocked = surfaceQA ? surfaceQA.blockers.length > 0 : false;
        const isBlocked = isContoursBlocked || isSurfaceBlocked || !hasContoursGenerated;

        let dxfStatus: 'listo' | 'advertencia' | 'bloqueado' = 'bloqueado';
        let geojsonStatus: 'listo' | 'advertencia' | 'bloqueado' = 'bloqueado';

        if (hasContoursGenerated) {
          if (isContoursBlocked || isSurfaceBlocked) {
            dxfStatus = 'bloqueado';
            geojsonStatus = 'bloqueado';
          } else {
            const hasContoursWarnings = contourQA ? contourQA.warnings.length > 0 : false;
            const hasSurfaceWarnings = surfaceQA ? surfaceQA.warnings.length > 0 : false;
            if (hasContoursWarnings || hasSurfaceWarnings) {
              dxfStatus = 'advertencia';
              geojsonStatus = 'advertencia';
            } else {
              dxfStatus = 'listo';
              geojsonStatus = 'listo';
            }
          }
        }

        const getStatusBadge = (status: 'listo' | 'advertencia' | 'bloqueado') => {
          switch (status) {
            case 'listo':
              return (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-bold">
                  Listo
                </span>
              );
            case 'advertencia':
              return (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-bold">
                  Advertencia
                </span>
              );
            case 'bloqueado':
            default:
              return (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                  Bloqueado
                </span>
              );
          }
        };

        const activeWarnings = [
          ...(surfaceQA?.warnings || []),
          ...(contourQA?.warnings || [])
        ];

        const activeBlockers = [
          ...(surfaceQA?.blockers || []),
          ...(contourQA?.blockers || [])
        ];

        return (
          <div className="space-y-4 font-sans text-[13px]">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2">
              Exportación
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Estado general:</span>
                <span className={`px-2 py-0.5 border rounded-full text-[11px] font-bold ${getStatusBadgeClass(exportStatus)}`}>
                  {getStatusLabel(exportStatus)}
                </span>
              </div>

              <div className="flex justify-between border-t border-[#E2E8F0] pt-2">
                <span className="text-[#64748B]">DXF curvas:</span>
                {getStatusBadge(dxfStatus)}
              </div>

              <div className="flex justify-between">
                <span className="text-[#64748B]">GeoJSON curvas:</span>
                {getStatusBadge(geojsonStatus)}
              </div>

              <div className="flex justify-between border-t border-[#E2E8F0] pt-2">
                <span className="text-[#64748B]">CRS aplicado:</span>
                <span className="text-[#0F172A] font-semibold">Descriptivo</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#64748B]">Reproyección:</span>
                <span className="text-[#0F172A] font-semibold">No aplicada</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#64748B]">Curvas exportables:</span>
                <span className={`font-semibold ${!isBlocked ? 'text-green-600' : 'text-red-600'}`}>
                  {!isBlocked ? 'Sí' : 'No'}
                </span>
              </div>

              {exportQA?.lastExportTime && (
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2">
                  <span className="text-[#64748B]">Última exportación:</span>
                  <span className="text-[#0F172A] font-mono text-[12px]">
                    {exportQA.lastExportTime}
                  </span>
                </div>
              )}
            </div>

            {activeBlockers.length > 0 && (
              <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded p-2 text-red-700 text-[11px] space-y-1">
                <span className="font-bold block text-red-800">Bloqueadores de exportación:</span>
                {activeBlockers.map((b, idx) => (
                  <div key={idx} className="leading-tight">• {b}</div>
                ))}
              </div>
            )}

            {activeWarnings.length > 0 && (
              <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded p-2 text-amber-700 text-[11px] space-y-1">
                <span className="font-bold block text-amber-800">Advertencias de exportación:</span>
                {activeWarnings.map((w, idx) => (
                  <div key={idx} className="leading-tight">• {w}</div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'ERROR':
        return (
          <div className="space-y-4">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#EF4444] border-b border-[#EF4444]/20 pb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-[#EF4444]" />
              Errores QA
            </h3>
            {validation && (
              <div className="space-y-2">
                <span className="text-[12px] text-[#64748B] block">Problemas críticos detectados:</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {validation.rejectedRows.map((err, idx) => (
                    <div key={idx} className="text-[12px] p-2 bg-[#FEF2F2] border border-[#EF4444]/20 text-[#EF4444] rounded font-mono">
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-[320px] border-l border-[#E2E8F0] bg-white flex flex-col h-full select-none shrink-0 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#E2E8F0] h-[56px] flex items-center">
        <h2 className="text-[12px] font-mono uppercase tracking-[0.15em] text-[#64748B] font-bold">
          PROPIEDADES & PARÁMETROS
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {renderContextualHeader()}
        {currentState !== 'EMPTY' && (
          <div className="border-b border-[#E2E8F0] pb-4 space-y-2 font-sans">
            <h3 className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Compass size={14} className="text-[#0891B2]" />
              Sistema de Referencia (CRS)
            </h3>
            
            <div className="space-y-1">
              <select
                value={selectedCRS}
                onChange={(e) => onCRSChange?.(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0891B2] cursor-pointer"
              >
                <option value="LOCAL">Sistema local XY (No especificado)</option>
                <optgroup label="WGS 84 / UTM (Chile)">
                  <option value="WGS84_18S">WGS 84 / UTM Zona 18S (EPSG:32718)</option>
                  <option value="WGS84_19S">WGS 84 / UTM Zona 19S (EPSG:32719)</option>
                  <option value="WGS84_20S">WGS 84 / UTM Zona 20S (EPSG:32720)</option>
                </optgroup>
                <optgroup label="SIRGAS-Chile 2002 / UTM">
                  <option value="SIRGAS_18S">SIRGAS-Chile 2002 / UTM Zona 18S (EPSG:5362)</option>
                  <option value="SIRGAS_19S">SIRGAS-Chile 2002 / UTM Zona 19S (EPSG:5361)</option>
                </optgroup>
              </select>
            </div>

            <div className="text-[11px] text-amber-700 bg-amber-50/50 border border-amber-200/40 rounded p-2 flex items-start gap-1.5 leading-snug">
              <Info size={12} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                El CRS seleccionado solo describe el sistema de coordenadas del archivo cargado. TerrenoLab no reproyecta coordenadas todavía.
              </span>
            </div>

            {selectedCRS === 'LOCAL' ? (
              <div className="text-[12px] text-[#64748B] bg-slate-50 border border-slate-100 rounded p-2.5 flex flex-col gap-1 leading-snug">
                <div className="flex items-start gap-1.5 font-sans font-semibold">
                  <Info size={12} className="text-[#64748B] shrink-0 mt-0.5" />
                  <span>Sistema local XY</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 pl-4.5">
                  • CRS: no especificado
                </div>
                <div className="text-[11px] font-mono text-slate-500 pl-4.5">
                  • EPSG: no aplica
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-[#059669] bg-[#F0FDF4] border border-[#10B981]/15 rounded p-2 flex items-start gap-1.5 leading-snug">
                <ShieldCheck size={12} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Georreferenciación activa ({getEPGLabel(selectedCRS)}).</span>
              </div>
            )}
          </div>
        )}
        {renderContextualInspector()}
      </div>

      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
        <span>{selectedCRS === 'LOCAL' ? 'Sistema local XY' : getCRSLabel(selectedCRS)}</span>
        <span>{selectedCRS === 'LOCAL' ? 'EPSG: no aplica' : getEPGLabel(selectedCRS)}</span>
      </div>
    </aside>
  );
}
