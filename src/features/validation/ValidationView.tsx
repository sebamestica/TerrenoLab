import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { ValidationResult } from '../../domain/terrain/validation';
import { TopographicQAResult } from '../../domain/terrain/qa';
import { Button } from '../../components/ui/Button';

interface ValidationViewProps {
  validation: ValidationResult;
  qaResult: TopographicQAResult | null;
  onProceed: () => void;
  onReset: () => void;
}

export function ValidationView({ validation, qaResult, onProceed, onReset }: ValidationViewProps) {
  const { isValid, rejectedRows, warnings, summary, validPoints, demMetadata, demQA } = validation;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-3xl mx-auto w-full select-none bg-white overflow-y-auto">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-[18px] font-sans font-semibold text-[#0F172A]">
          2. Validar Levantamiento
        </h1>
        <p className="text-[13px] text-[#64748B]">
          {demMetadata 
            ? 'Revisión técnica de la nube de puntos generada desde el archivo DEM local.' 
            : 'Inspeccione los controles de calidad espacial e integridad de coordenadas antes de revisar en planta.'}
        </p>
      </div>

      {/* DEM Metadata Banner */}
      {demMetadata && demQA && (
        <div className="border border-[#E2E8F0] rounded p-4 space-y-4 bg-[#F8FAFC]">
          <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2 block">
            Diagnóstico DEM ({demMetadata.sourceFormat})
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] text-[#64748B]">
            <div>
              <span className="block mb-0.5">Celdas Originales:</span>
              <span className="font-mono font-semibold text-[#0F172A]">{demQA.diagnostics.originalCellCount}</span>
            </div>
            <div>
              <span className="block mb-0.5">Puntos Generados:</span>
              <span className="font-mono font-semibold text-[#10B981]">{demQA.diagnostics.sampledPointCount}</span>
            </div>
            <div>
              <span className="block mb-0.5">Descartados:</span>
              <span className={`font-mono font-semibold ${demQA.diagnostics.discardedRatio > 0.3 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                {demQA.diagnostics.discardedPointCount} ({(demQA.diagnostics.discardedRatio * 100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="block mb-0.5">Muestreo Aplicado:</span>
              <span className="font-mono font-semibold text-[#0F172A]">Stride {demMetadata.samplingStep}</span>
            </div>
            <div>
              <span className="block mb-0.5">Cota Mínima:</span>
              <span className="font-mono font-semibold text-[#0F172A]">{demQA.diagnostics.minZ.toFixed(2)}</span>
            </div>
            <div>
              <span className="block mb-0.5">Cota Máxima:</span>
              <span className="font-mono font-semibold text-[#0F172A]">{demQA.diagnostics.maxZ.toFixed(2)}</span>
            </div>
            <div>
              <span className="block mb-0.5">Desnivel (ΔZ):</span>
              <span className="font-mono font-semibold text-[#0F172A]">{demQA.diagnostics.deltaZ.toFixed(2)}</span>
            </div>
            <div>
              <span className="block mb-0.5">CRS Detectado:</span>
              <span className="font-mono font-semibold text-[#0F172A]">
                {demQA.diagnostics.hasCRS ? `EPSG:${demQA.diagnostics.epsg}` : 'Local XY'}
              </span>
            </div>
            {demMetadata.processingTimeMs && (
              <div>
                <span className="block mb-0.5">Tiempo de Procesamiento:</span>
                <span className="font-mono font-semibold text-[#0F172A]">{(demMetadata.processingTimeMs / 1000).toFixed(2)}s</span>
              </div>
            )}
            <div>
              <span className="block mb-0.5">Estado DEM:</span>
              <span className={`font-mono font-bold ${
                demQA.label === 'Estable' ? 'text-[#10B981]' : 
                demQA.label === 'Advertencia' ? 'text-[#EAB308]' : 
                'text-[#EF4444]'
              }`}>
                {demQA.label}
              </span>
            </div>
            {demQA.diagnostics.suspectedRasterType !== 'DEM' && demQA.diagnostics.suspectedRasterType !== 'UNKNOWN' && (
              <div>
                <span className="block mb-0.5">Sospecha de Derivado:</span>
                <span className="font-mono font-bold text-[#EAB308]">
                  {demQA.diagnostics.suspectedRasterType} ({demQA.diagnostics.confidence})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Status Alert */}
      <div className={`border rounded p-4 flex items-start gap-3 ${
        (demQA ? demQA.isValid : isValid)
          ? (demQA?.label === 'Advertencia' ? 'bg-[#FEFCE8] border-[#EAB308]/30 text-[#A16207]' : 'bg-[#F0FDF4] border-[#10B981]/20 text-[#10B981]')
          : 'bg-[#FEF2F2] border-[#EF4444]/20 text-[#EF4444]'
      }`}>
        {(demQA ? demQA.isValid : isValid) ? (
          demQA?.label === 'Advertencia' 
            ? <AlertTriangle size={24} className="shrink-0 mt-0.5 text-[#EAB308]" /> 
            : <ShieldCheck size={24} className="shrink-0 mt-0.5 text-[#10B981]" />
        ) : (
          <XCircle size={24} className="shrink-0 mt-0.5 text-[#EF4444]" />
        )}
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-[#0F172A] uppercase tracking-wider">
            {demQA 
              ? (demQA.isValid ? (demQA.label === 'Advertencia' ? 'DEM listo para revisión (con advertencias)' : 'DEM Procesado') : 'DEM Bloqueado')
              : (isValid ? 'Levantamiento Aprobado' : 'Levantamiento Rechazado')}
          </h3>
          <p className="text-[12px] text-[#64748B] leading-relaxed">
            {demQA 
              ? (demQA.isValid 
                ? (demQA.label === 'Advertencia' ? 'Revise el diagnóstico y las advertencias antes de continuar con la generación de superficie.' : 'DEM procesado exitosamente. El archivo es apto para generar superficie.')
                : 'El archivo no es apto para generar superficie debido a errores críticos o formato derivado.')
              : (isValid 
                ? `El archivo contiene ${summary.validRows} puntos conformes. Cumple con los criterios geométricos mínimos para el visor.`
                : `Se detectaron problemas críticos en el archivo. Corrija los errores y cargue una nueva versión.`)}
          </p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-4">
        <div>
          <span className="text-[12px] text-[#64748B] block">{demMetadata ? 'Celdas Evaluadas:' : 'Filas Totales:'}</span>
          <span className="text-[13px] font-semibold text-[#0F172A] block mt-0.5 font-mono">{summary.totalRows}</span>
        </div>
        <div>
          <span className="text-[12px] text-[#64748B] block">Puntos Válidos:</span>
          <span className="text-[13px] font-semibold text-[#10B981] block mt-0.5 font-mono">{summary.validRows}</span>
        </div>
        {!demMetadata && (
          <>
            <div>
              <span className="text-[12px] text-[#64748B] block">Filas Rechazadas:</span>
              <span className={`text-[13px] font-semibold block mt-0.5 font-mono ${summary.rejectedRows > 0 ? 'text-[#EF4444]' : 'text-[#64748B]'}`}>
                {summary.rejectedRows}
              </span>
            </div>
            <div>
              <span className="text-[12px] text-[#64748B] block">Duplicados X/Y:</span>
              <span className={`text-[13px] font-semibold block mt-0.5 font-mono ${summary.duplicatedXY > 0 ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}>
                {summary.duplicatedXY}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Elevation Stats (if points exist) */}
      {summary.validRows >= 3 && (
        <div className="border border-[#E2E8F0] rounded p-4 font-mono text-[12px] space-y-2 bg-[#F8FAFC]/30">
          <span className="text-[12px] font-bold text-[#64748B] block uppercase tracking-wider">Límites de Elevación (Z)</span>
          <div className="grid grid-cols-3 gap-2 text-[#0F172A]">
            <div>Cota Mínima: <span className="font-semibold">{summary.minZ.toFixed(3)} m</span></div>
            <div>Cota Máxima: <span className="font-semibold">{summary.maxZ.toFixed(3)} m</span></div>
            <div>Desnivel ΔZ: <span className="font-semibold">{summary.deltaZ.toFixed(3)} m</span></div>
          </div>
        </div>
      )}

      {/* Diagnóstico Topográfico Avanzado */}
      {qaResult && (
        <div className="border border-[#E2E8F0] rounded p-4 space-y-4 bg-[#F8FAFC]/30">
          <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2 block">
            Diagnóstico topográfico y calidad
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score & Classification */}
            <div className="space-y-3">
              <div>
                <span className="text-[12px] text-[#64748B] block">Clasificación probable de datos:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 border rounded-full text-[12px] font-bold bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]/10">
                    {qaResult.classification.datasetType === 'DEM_GRID' && 'Grilla Regular (DEM)'}
                    {qaResult.classification.datasetType === 'FIELD_SURVEY' && 'Levantamiento Irregular'}
                    {qaResult.classification.datasetType === 'POSSIBLE_HILLSHADE' && 'Hillshade / Imagen (Sospechoso)'}
                    {qaResult.classification.datasetType === 'UNKNOWN' && 'Desconocido'}
                  </span>
                  <span className="text-[12px] text-[#64748B]">
                    (Confianza: {(qaResult.classification.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
                {qaResult.classification.reasons.length > 0 && (
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    Razones: {qaResult.classification.reasons.join(' ')}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[12px] text-[#64748B] block">Score de Calidad Altimétrica:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        qaResult.quality.label === 'Excelente' || qaResult.quality.label === 'Buena'
                          ? 'bg-[#10B981]' 
                          : qaResult.quality.label === 'Regular'
                          ? 'bg-[#F59E0B]' 
                          : 'bg-[#EF4444]'
                      }`}
                      style={{ width: `${qaResult.quality.score}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-bold font-mono text-[#0F172A] w-12 text-right">
                    {qaResult.quality.score}/100
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Categoría: <span className="font-semibold text-[#334155]">{qaResult.quality.label}</span>
                </span>
              </div>

              {/* Interpolation status banner */}
              <div className={`p-2 rounded text-[12px] border ${
                qaResult.quality.canInterpolate
                  ? 'bg-[#F0FDF4] border-[#10B981]/10 text-[#059669]'
                  : 'bg-[#FEF2F2] border-[#EF4444]/10 text-[#EF4444]'
              }`}>
                {qaResult.quality.canInterpolate
                  ? '✓ Este dataset será apto para interpolación futura.'
                  : '⚠ NO APTO para interpolación futura. Se detectaron bloqueadores críticos.'}
              </div>
            </div>

            {/* Spatial & Density metrics */}
            <div className="space-y-2 border-l border-[#E2E8F0] pl-4 font-mono text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">BBox Área:</span>
                <span className="text-[#0F172A] font-semibold">{(qaResult.spatialCoverage.boundingBoxArea / 10000).toFixed(3)} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Convex Hull Área:</span>
                <span className="text-[#0F172A] font-semibold">{(qaResult.spatialCoverage.convexHullArea / 10000).toFixed(3)} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Cobertura espacial:</span>
                <span className="text-[#0F172A] font-semibold">{(qaResult.spatialCoverage.coverageRatio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-[#E2E8F0]/60 pt-1.5 mt-1.5">
                <span className="text-[#64748B]">Espaciamiento NN medio:</span>
                <span className="text-[#0F172A] font-semibold">{qaResult.spatialCoverage.averageNearestNeighborDistance.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Distancia NN Mín:</span>
                <span className="text-[#0F172A] font-semibold">{qaResult.spatialCoverage.minNearestNeighborDistance.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Distancia NN Máx:</span>
                <span className="text-[#0F172A] font-semibold">{qaResult.spatialCoverage.maxNearestNeighborDistance.toFixed(3)} m</span>
              </div>
            </div>
          </div>

          {/* Recommendations, blockers & warnings */}
          <div className="space-y-1.5 border-t border-[#E2E8F0] pt-3 text-[12px] font-sans text-[#475569]">
            {qaResult.quality.blockers.map((b, idx) => (
              <div key={idx} className="flex gap-1.5 text-[#EF4444] font-medium leading-relaxed">
                <span>• Bloqueador:</span>
                <span>{b}</span>
              </div>
            ))}
            {qaResult.quality.warnings.map((w, idx) => (
              <div key={idx} className="flex gap-1.5 text-[#D97706] leading-relaxed">
                <span>• Advertencia:</span>
                <span>{w}</span>
              </div>
            ))}
            {qaResult.quality.recommendations.map((r, idx) => (
              <div key={idx} className="flex gap-1.5 text-[#334155] leading-relaxed">
                <span className="font-semibold text-[#64748B]">Recomendación:</span>
                <span>{r}</span>
              </div>
            ))}
          </div>

          {/* Outliers Table if any exist */}
          {qaResult.outlierResult.outlierCount > 0 && (
            <div className="border border-[#EF4444]/20 rounded p-3 bg-[#FFF5F5]/20 space-y-2">
              <span className="text-[12px] font-bold text-[#EF4444] block font-mono">
                OUTLIERS DE ELEVACIÓN DETECTADOS ({qaResult.outlierResult.outlierCount})
              </span>
              <p className="text-[11px] text-[#64748B] font-sans">
                Límites estadísticos IQR: cota inferior a {qaResult.outlierResult.lowerLimit.toFixed(2)}m o superior a {qaResult.outlierResult.upperLimit.toFixed(2)}m.
              </p>
              <div className="max-h-[100px] overflow-y-auto">
                <table className="w-full text-left font-mono text-[11px] text-[#DC2626]">
                  <thead>
                    <tr className="border-b border-[#EF4444]/10 bg-[#FFF5F5]/40 text-[#DC2626] font-bold">
                      <th className="p-1">PUNTO ID</th>
                      <th className="p-1">X (ESTE)</th>
                      <th className="p-1">Y (NORTE)</th>
                      <th className="p-1">Z (COTA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaResult.outlierResult.outliers.map((o, idx) => (
                      <tr key={idx} className="border-b border-[#EF4444]/5 hover:bg-[#FFF5F5]/40">
                        <td className="p-1">{o.id}</td>
                        <td className="p-1">{o.x.toFixed(3)}</td>
                        <td className="p-1">{o.y.toFixed(3)}</td>
                        <td className="p-1 font-bold">{o.z.toFixed(3)} m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Errors List (Errores Agrupados) */}
      {demQA && demQA.blockers.length > 0 && (
            <div className="space-y-2">
              {demQA.blockers.map((error, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-[#FEF2F2] border border-[#EF4444]/20 text-[#EF4444] text-[12px] p-3 rounded">
                  <XCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {!demQA && rejectedRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2 block">
                Filas de datos rechazadas
              </span>
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {rejectedRows.map((err, idx) => (
              <div key={idx} className="text-[12px] p-2 bg-[#FEF2F2] border border-[#EF4444]/10 text-[#EF4444] rounded font-mono">
                {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings List */}
      {demQA && demQA.warnings.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2 block mt-6">
                Advertencias del DEM
              </span>
              {demQA.warnings.map((warning, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-[#FEFCE8] border border-[#EAB308]/30 text-[#A16207] text-[12px] p-3 rounded">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {!demQA && warnings.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2 block mt-6">
                Advertencias de parsing
              </span>
          <div className="space-y-2">
            {warnings.map((warn, idx) => (
              <div key={idx} className="text-[12px] p-2 bg-[#FFFBEB] border border-[#F59E0B]/10 text-[#F59E0B] rounded font-mono">
                {warn.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Preview Table */}
      {validPoints.length > 0 && (
        <div className="border border-[#E2E8F0] rounded p-4">
          <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2 mb-3 block">
            Tabla compacta de inspección (Primeros 10 puntos válidos)
          </span>
          <div className="overflow-x-auto max-h-[220px]">
            <table className="w-full border-collapse font-mono text-[12px] text-left text-[#0F172A]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0">
                  <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#64748B]">PUNTO ID</th>
                  <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#64748B]">X (ESTE)</th>
                  <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#64748B]">Y (NORTE)</th>
                  <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#64748B]">Z (COTA)</th>
                </tr>
              </thead>
              <tbody>
                {validPoints.slice(0, 10).map((pt, idx) => (
                  <tr key={idx} className="border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC]/55">
                    <td className="p-2 border-r border-[#E2E8F0]/40">{pt.id}</td>
                    <td className="p-2 border-r border-[#E2E8F0]/40">{pt.x.toFixed(3)}</td>
                    <td className="p-2 border-r border-[#E2E8F0]/40">{pt.y.toFixed(3)}</td>
                    <td className="p-2 border-r border-[#E2E8F0]/40">{pt.z.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer controls: Clickable continue if canReview is true */}
      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-4 shrink-0">
        {qaResult && !qaResult.quality.canInterpolate && qaResult.quality.canReview && (
          <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded p-3 text-[12px] text-[#D97706] font-sans flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#F59E0B] shrink-0" />
            <span>El dataset puede revisarse visualmente, pero no es apto para interpolación.</span>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          {(demQA ? demQA.isValid : (isValid && qaResult?.quality.canReview)) ? (
            <>
              <Button variant="ghost" onClick={onReset}>
                <RefreshCw size={12} className="mr-1.5" />
                Subir Otro
              </Button>
              <Button variant="primary" onClick={onProceed}>
                Continuar a Revisión
                <ArrowRight size={12} className="ml-1.5" />
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onReset}>
              <RefreshCw size={12} className="mr-1.5" />
              Corregir Archivo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
