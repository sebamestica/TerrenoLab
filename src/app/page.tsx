'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { getWorkflowSteps, canTransition } from '../domain/workflow/workflowState';
import { WorkflowState } from '../domain/workflow/workflowTypes';
import { TerrainDataset, TerrainMetrics } from '../domain/terrain/types';
import { normalizeTerrainRows, ColumnMapping, ValidationResult } from '../domain/terrain/validation';
import { performTopographicQA, TopographicQAResult } from '../domain/terrain/qa';
import { computeTerrainMetrics } from '../domain/terrain/metrics';
import { generateIDWSurface, InterpolationGrid, IDWSurfaceResult } from '../domain/terrain/interpolation';
import { analyzeSurfaceQuality, SurfaceQAResult } from '../domain/terrain/surfaceQA';
import { generateContours, ContourLine, ContourResult } from '../domain/terrain/contours';
import { analyzeContourQuality, ContourQAResult } from '../domain/terrain/contourQA';
import { 
  validateCleanCSVExport, 
  validateErrorsCSVExport, 
  validateJSONExport, 
  validateDXFExport,
  validateGeoJSONExport,
  ExportQAResult 
} from '../domain/terrain/exportQA';
import { 
  exportToCSV, 
  exportValidationErrorsToCSV, 
  sanitizeFilename,
  exportContoursToDXF,
  exportContoursToGeoJSON,
  getCRSMetadata
} from '../lib/export/exportUtils';
import { parseCSV } from '../lib/csv/csvParser';
import { generateSampleCSVText } from '../lib/sampleData/sampleTerrain';

// Volume Domain & Features
import { VolumeOptions, VolumeResult, calculateCutFillVolume } from '../domain/terrain/volume';
import { validateVolumeAnalysis, VolumeQAResult } from '../domain/terrain/volumeQA';
import { analyzeVolumeConsistency, VolumeAuditResult } from '../domain/terrain/volumeAudit';

// Feature Views
import { StartView } from '../features/start/StartView';
import { ImportView } from '../features/import/ImportView';
import { ValidationView } from '../features/validation/ValidationView';
import { TerrainReviewView } from '../features/terrain/TerrainReviewView';
import { SurfaceView } from '../features/surface/SurfaceView';
import { ContoursView } from '../features/contours/ContoursView';
import { VolumeView } from '../features/volume/VolumeView';
import { ExportView } from '../features/export/ExportView';

export default function TerrenoLabPage() {
  // Workflow States
  const [workflowState, setWorkflowState] = useState<WorkflowState>('EMPTY');
  const [activeView, setActiveView] = useState<WorkflowState>('EMPTY');

  // Input Data States
  const [rawCSVText, setRawCSVText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSampleData, setIsSampleData] = useState<boolean>(false);
  
  // CSV Preview States
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvLinesPreview, setCsvLinesPreview] = useState<string[][]>([]);
  const [autoMapping, setAutoMapping] = useState<ColumnMapping>({
    idColumn: '',
    xColumn: '',
    yColumn: '',
    zColumn: '',
  });
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);

  // Processing States
  const [dataset, setDataset] = useState<TerrainDataset | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [qaResult, setQaResult] = useState<TopographicQAResult | null>(null);

  // Parameter Controls
  const [resolution, setResolution] = useState<'low' | 'medium' | 'high'>('medium');
  const [power, setPower] = useState<number>(2.0);
  const [contourInterval, setContourInterval] = useState<number>(2.0);
  const [includeIndexContours, setIncludeIndexContours] = useState<boolean>(true);
  const [indexEvery, setIndexEvery] = useState<number>(5);
  const [surface, setSurface] = useState<IDWSurfaceResult | null>(null);
  const [surfaceQA, setSurfaceQA] = useState<SurfaceQAResult | null>(null);
  const [contoursResult, setContoursResult] = useState<ContourResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessingContours, setIsProcessingContours] = useState<boolean>(false);

  // Export States
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastExportTime, setLastExportTime] = useState<string | null>(null);
  const [exportCSV, setExportCSV] = useState<boolean>(true);
  const [includeValidationErrors, setIncludeValidationErrors] = useState<boolean>(false);
  const [exportPNG, setExportPNG] = useState<boolean>(true);
  const [exportJSON, setExportJSON] = useState<boolean>(true);
  const [pngQAState, setPngQAState] = useState<{ isValid: boolean; message: string }>({ isValid: false, message: 'Inicializando...' });

  const [viewerMode, setViewerMode] = useState<'light' | 'technical'>('light');
  const [selectedCRS, setSelectedCRS] = useState<string>('LOCAL');

  // DXF / GeoJSON export selection states
  const [exportDXF, setExportDXF] = useState<boolean>(true);
  const [exportGeoJSON, setExportGeoJSON] = useState<boolean>(true);

  // Volume States
  const [polygon, setPolygon] = useState<Array<{ x: number; y: number }>>([]);
  const [volumeOptions, setVolumeOptions] = useState<VolumeOptions>({
    targetElevation: 0,
    compactionFactor: 1.2,
    wasteFactor: 1.05,
    materialPricePerM3: undefined,
    fixedTransportCost: undefined,
  });
  const [volumeResult, setVolumeResult] = useState<VolumeResult | null>(null);

  // Layer Visibility Controls
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);

  // 1. Compute metrics reactively using domain logic
  const metrics = useMemo<TerrainMetrics | null>(() => {
    if (!dataset) return null;
    return computeTerrainMetrics(dataset.points);
  }, [dataset]);

  // 2. Compute Contour QA reactively
  const contourQA = useMemo<ContourQAResult | null>(() => {
    if (!surface || !contoursResult) return null;
    return analyzeContourQuality(surface, contoursResult, surfaceQA);
  }, [surface, contoursResult, surfaceQA]);

  // 3. Compute Volume QA reactively
  const volumeQA = useMemo<VolumeQAResult | null>(() => {
    return validateVolumeAnalysis(surface, polygon, volumeOptions, selectedCRS, metrics);
  }, [surface, polygon, volumeOptions, selectedCRS, metrics]);

  // 4. Compute Volume Audit reactively
  const volumeAudit = useMemo<VolumeAuditResult | null>(() => {
    if (!surface || polygon.length < 3 || !volumeResult) return null;
    return analyzeVolumeConsistency(surface, polygon, volumeResult, volumeOptions);
  }, [surface, polygon, volumeResult, volumeOptions]);

  // 5. Compute Export QA reactively using domain validation functions
  const exportQA = useMemo<ExportQAResult | null>(() => {
    if (activeView !== 'EXPORT_READY') return null;

    const selectedFiles: string[] = [];
    const validFiles: string[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    const baseProjectName = dataset?.name || 'terrenolab_proyecto';
    const sanitizedProjectName = sanitizeFilename(baseProjectName);
    const lastDot = sanitizedProjectName.lastIndexOf('.');
    const filePrefix = lastDot !== -1 ? sanitizedProjectName.substring(0, lastDot) : sanitizedProjectName;

    // 1. CSV clean validation
    if (exportCSV) {
      const csvCleanName = `${filePrefix}_puntos_limpios.csv`;
      selectedFiles.push(csvCleanName);
      
      const csvContent = exportToCSV(dataset?.points || []);
      const csvRes = validateCleanCSVExport(dataset?.points || [], csvContent);
      if (csvRes.isValid) {
        validFiles.push(csvCleanName);
      }
      blockers.push(...csvRes.blockers);
      warnings.push(...csvRes.warnings);
    }

    // 2. CSV errors validation
    if (exportCSV && includeValidationErrors && validation && validation.rejectedRows.length > 0) {
      const csvErrorsName = `${filePrefix}_errores_validacion.csv`;
      selectedFiles.push(csvErrorsName);
      
      const errsContent = exportValidationErrorsToCSV(validation.rejectedRows);
      const errsRes = validateErrorsCSVExport(validation, errsContent);
      if (errsRes.isValid) {
        validFiles.push(csvErrorsName);
      }
      blockers.push(...errsRes.blockers);
      warnings.push(...errsRes.warnings);
    }

    // 3. PNG visor validation
    if (exportPNG) {
      const pngName = `${filePrefix}_visor.png`;
      selectedFiles.push(pngName);
      if (pngQAState.isValid) {
        validFiles.push(pngName);
      } else {
        blockers.push(`PNG Visor: ${pngQAState.message}`);
      }
    }

    // 4. JSON technical summary validation
    if (exportJSON) {
      const jsonName = `${filePrefix}_analisis.json`;
      selectedFiles.push(jsonName);
      
      const jsonContent: any = {
        project: {
          name: dataset?.name || 'terrenolab_proyecto',
          createdAt: dataset?.createdAt || new Date().toISOString(),
          source: dataset?.source || 'csv',
        },
        dataset: {
          pointCount: dataset?.points.length || 0,
          validRows: validation?.summary.validRows ?? (dataset?.points.length || 0),
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
        generatedBy: 'TerrenoLab',
        version: 'MVP-Phase-7.1',
      };

      if (volumeResult) {
        jsonContent.volume = {
          method: "Cell-based cut/fill over IDW surface",
          targetElevation: volumeResult.targetElevation,
          rawFillVolume: volumeResult.rawFillVolume,
          rawCutVolume: volumeResult.rawCutVolume,
          netVolume: volumeResult.netVolume,
          recommendedFillVolume: volumeResult.recommendedFillVolume,
          compactionFactor: volumeResult.compactionFactor,
          wasteFactor: volumeResult.wasteFactor,
          materialPricePerM3: volumeResult.materialPricePerM3 ?? null,
          fixedTransportCost: volumeOptions.fixedTransportCost ?? null,
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
        };
      }

      const jsonRes = validateJSONExport(jsonContent);
      if (jsonRes.isValid) {
        validFiles.push(jsonName);
      }
      blockers.push(...jsonRes.blockers);
      warnings.push(...jsonRes.warnings);
    }

    // 5. DXF validation
    if (exportDXF) {
      const dxfName = `${filePrefix}_curvas.dxf`;
      selectedFiles.push(dxfName);
      
      const dxfContent = exportContoursToDXF(dataset?.points || [], contoursResult?.lines || [], selectedCRS);
      const dxfRes = validateDXFExport(dxfContent);
      if (dxfRes.isValid) {
        validFiles.push(dxfName);
      }
      blockers.push(...dxfRes.blockers);
      warnings.push(...dxfRes.warnings);
    }

    // 6. GeoJSON validation
    if (exportGeoJSON) {
      const geojsonName = `${filePrefix}_curvas.geojson`;
      selectedFiles.push(geojsonName);
      
      const geojsonContent = exportContoursToGeoJSON(contoursResult?.lines || [], selectedCRS, contourInterval);
      const geojsonRes = validateGeoJSONExport(geojsonContent, selectedCRS === 'LOCAL');
      if (geojsonRes.isValid) {
        validFiles.push(geojsonName);
      }
      blockers.push(...geojsonRes.blockers);
      warnings.push(...geojsonRes.warnings);
    }

    return {
      isValid: blockers.length === 0,
      selectedFiles,
      validFiles,
      warnings,
      blockers,
      lastExportTime,
    };
  }, [
    activeView,
    dataset,
    validation,
    metrics,
    qaResult,
    surface,
    surfaceQA,
    contoursResult,
    contourQA,
    exportCSV,
    includeValidationErrors,
    exportPNG,
    exportJSON,
    exportDXF,
    exportGeoJSON,
    pngQAState,
    lastExportTime,
    selectedCRS,
    contourInterval,
    volumeResult,
    volumeOptions,
    volumeQA,
    volumeAudit
  ]);

  // 6. Compute Steps for Sidebar (Calculated dynamically)
  const steps = useMemo(() => {
    const canInterp = qaResult?.quality?.canInterpolate ?? false;
    const canExport = contourQA !== null && contourQA.blockers.length === 0 && volumeQA !== null && volumeQA.blockers.length === 0;
    return getWorkflowSteps(workflowState, canInterp, canExport);
  }, [workflowState, qaResult, contourQA, volumeQA]);

  const currentStepIndex = steps.findIndex(s => s.state === activeView);

  // 7. Compute Grid Surface (derived from manually calculated surface state for compatibility)
  const grid = useMemo<InterpolationGrid | null>(() => {
    if (!surface || !dataset) return null;
    return {
      cols: surface.gridX.length,
      rows: surface.gridY.length,
      cells: surface.gridY.map((y, r) => surface.gridX.map((x, c) => ({
        x,
        y,
        z: surface.gridZ[r][c]
      }))),
      minX: surface.bounds.minX,
      maxX: surface.bounds.maxX,
      minY: surface.bounds.minY,
      maxY: surface.bounds.maxY
    };
  }, [surface, dataset]);

  // ACTIONS
  const triggerSecurityError = (message: string) => {
    const errorResult: ValidationResult = {
      isValid: false,
      validPoints: [],
      rejectedRows: [{ rowNumber: 0, message }],
      warnings: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        rejectedRows: 1,
        duplicatedXY: 0,
        minZ: 0,
        maxZ: 0,
        deltaZ: 0,
      },
    };
    setDataset(null);
    setValidation(errorResult);
    setQaResult(null);
    setWorkflowState('ERROR');
    setActiveView('VALIDATED');
  };

  const handleLoadSample = () => {
    const csvText = generateSampleCSVText();
    setRawCSVText(csvText);
    setFileName('terreno_prueba.csv');
    setIsSampleData(true);
    const result = parseCSV(csvText);
    setCsvHeaders(result.headers);
    setParsedRows(result.rows);
    const preview = result.rows.slice(0, 20).map(row => 
      result.headers.map(h => row[h] || '')
    );
    setCsvLinesPreview(preview);
    const emptyMapping: ColumnMapping = {
      idColumn: '',
      xColumn: '',
      yColumn: '',
      zColumn: '',
    };
    setAutoMapping(emptyMapping);
    setWorkflowState('FILE_SELECTED');
    setActiveView('FILE_SELECTED');
  };

  const handleFileUpload = (fileText: string, name: string) => {
    // 1. Size check (< 10MB)
    if (fileText.length > 10 * 1024 * 1024) {
      triggerSecurityError('El archivo supera el límite de tamaño permitido (10 MB).');
      return;
    }
    // 2. Extension check (.csv, .txt)
    const extension = name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'txt') {
      triggerSecurityError('Formato de archivo no permitido. Solo se aceptan archivos .csv y .txt.');
      return;
    }
    // 3. HTML tag check (reject web files)
    const htmlRegex = /<!DOCTYPE\s+html|<html|<head|<body/i;
    if (htmlRegex.test(fileText)) {
      triggerSecurityError('El archivo contiene etiquetas HTML no permitidas (posible archivo web malicioso o inválido).');
      return;
    }
    setRawCSVText(fileText);
    setFileName(name);
    setIsSampleData(false);
    const result = parseCSV(fileText);
    setCsvHeaders(result.headers);
    setParsedRows(result.rows);
    const preview = result.rows.slice(0, 20).map(row => 
      result.headers.map(h => row[h] || '')
    );
    setCsvLinesPreview(preview);
    const emptyMapping: ColumnMapping = {
      idColumn: '',
      xColumn: '',
      yColumn: '',
      zColumn: '',
    };
    setAutoMapping(emptyMapping);
    setWorkflowState('FILE_SELECTED');
    setActiveView('FILE_SELECTED');
  };

  const handleConfirmMapping = (mapping: ColumnMapping) => {
    const valResult = normalizeTerrainRows(parsedRows, mapping);
    setValidation(valResult);
    const qaRes = performTopographicQA(valResult.validPoints);
    setQaResult(qaRes);
    const newDataset: TerrainDataset = {
      name: fileName,
      points: valResult.validPoints,
      source: isSampleData ? 'sample' : 'csv',
      createdAt: new Date().toISOString(),
    };
    
    setDataset(newDataset);
    setSurface(null); // Reset computed surface
    setSurfaceQA(null); // Reset computed surface QA
    setContoursResult(null); // Reset computed contours
    setPolygon([]); // Reset volume polygon
    setVolumeResult(null); // Reset volume result

    if (valResult.isValid && qaRes.quality.canReview) {
      setWorkflowState('VALIDATED');
      setActiveView('VALIDATED');
    } else {
      setWorkflowState('ERROR');
      setActiveView('VALIDATED');
    }
  };

  const handleProceedFromValidation = () => {
    setWorkflowState('TERRAIN_REVIEWED');
    setActiveView('TERRAIN_REVIEWED');
  };

  const handleProceedFromReview = () => {
    setWorkflowState('SURFACE_READY');
    setActiveView('SURFACE_READY');
  };

  const handleProceedFromSurface = () => {
    setWorkflowState('CONTOURS_READY');
    setActiveView('CONTOURS_READY');
  };

  const handleProceedFromContours = () => {
    setWorkflowState('VOLUME_READY');
    setActiveView('VOLUME_READY');
  };

  const handleProceedFromVolume = () => {
    if (volumeQA && volumeQA.blockers.length === 0) {
      setWorkflowState('EXPORT_READY');
      setActiveView('EXPORT_READY');
    }
  };

  const handleGenerateSurface = () => {
    if (!dataset || dataset.points.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = generateIDWSurface(dataset.points, {
          resolution,
          power
        });
        setSurface(result);
        const qaRes = analyzeSurfaceQuality(dataset.points, result);
        setSurfaceQA(qaRes);
        setContoursResult(null); // Reset contours when surface changes
        setPolygon([]); // Reset volume when surface changes
        setVolumeResult(null);
      } catch (err) {
        console.error('Error generating surface:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleGenerateContours = (interval: number, includeIndex: boolean, every: number) => {
    if (!surface) return;
    setIsProcessingContours(true);
    setTimeout(() => {
      try {
        const result = generateContours(surface, {
          interval,
          includeIndexContours: includeIndex,
          indexEvery: every
        });
        setContoursResult(result);
      } catch (err) {
        console.error('Error generating contours:', err);
      } finally {
        setIsProcessingContours(false);
      }
    }, 100);
  };

  const handleReset = () => {
    setWorkflowState('EMPTY');
    setActiveView('EMPTY');
    setRawCSVText('');
    setFileName('');
    setIsSampleData(false);
    setCsvHeaders([]);
    setCsvLinesPreview([]);
    setDataset(null);
    setValidation(null);
    setQaResult(null);
    setSurface(null);
    setSurfaceQA(null);
    setContoursResult(null);
    setIsProcessing(false);
    setIsProcessingContours(false);
    setResolution('medium');
    setPower(2.0);
    setContourInterval(2.0);
    setIncludeIndexContours(true);
    setIndexEvery(5);
    setShowPoints(true);
    setShowGrid(true);
    setShowContours(true);
    setExportStatus('idle');
    setIsExporting(false);
    setLastExportTime(null);
    setExportCSV(true);
    setIncludeValidationErrors(false);
    setExportPNG(true);
    setExportJSON(true);
    setPngQAState({ isValid: false, message: 'Inicializando...' });
    setViewerMode('light');
    setSelectedCRS('LOCAL');
    setAutoMapping({
      idColumn: '',
      xColumn: '',
      yColumn: '',
      zColumn: '',
    });
    setParsedRows([]);

    // Volume Reset complete
    setPolygon([]);
    setVolumeOptions({
      targetElevation: 0,
      compactionFactor: 1.2,
      wasteFactor: 1.05,
      materialPricePerM3: undefined,
      fixedTransportCost: undefined,
    });
    setVolumeResult(null);
    setExportDXF(true);
    setExportGeoJSON(true);
  };

  const handleStepSelect = (state: WorkflowState) => {
    if (workflowState === 'ERROR' && state !== 'VALIDATED') {
      return;
    }
    const canInterp = qaResult?.quality?.canInterpolate ?? false;
    const canExport = contourQA !== null && contourQA.blockers.length === 0 && volumeQA !== null && volumeQA.blockers.length === 0;
    if (canTransition(workflowState, state, canInterp, canExport)) {
      setActiveView(state);
    }
  };

  // Determine topbar primary contextual actions
  const getContextualPrimaryAction = () => {
    if (workflowState === 'ERROR') {
      return {
        label: 'Reiniciar archivo',
        action: handleReset,
      };
    }
    switch (activeView) {
      case 'FILE_SELECTED':
        return {
          label: 'Confirmar Mapeo',
          action: () => handleConfirmMapping(autoMapping),
        };
      case 'VALIDATED':
        return {
          label: 'Aprobar QA',
          action: handleProceedFromValidation,
        };
      case 'TERRAIN_REVIEWED':
      case 'SURFACE_READY':
      case 'CONTOURS_READY':
      case 'VOLUME_READY':
        return null;
      case 'EXPORT_READY':
        return {
          label: 'Nuevo Análisis',
          action: handleReset,
        };
      case 'EMPTY':
      default:
        return null;
    }
  };

  const primaryAction = getContextualPrimaryAction();

  // Render active view
  const renderActiveView = () => {
    if (workflowState === 'ERROR') {
      return (
        <ValidationView
          validation={validation!}
          qaResult={qaResult}
          onProceed={handleProceedFromValidation}
          onReset={handleReset}
        />
      );
    }
    switch (activeView) {
      case 'EMPTY':
        return (
          <StartView
            onLoadSample={handleLoadSample}
            onFileUpload={handleFileUpload}
          />
        );
      case 'FILE_SELECTED':
        return (
          <ImportView
            headers={csvHeaders}
            rawLinesPreview={csvLinesPreview}
            initialMapping={autoMapping}
            onConfirm={handleConfirmMapping}
            onCancel={handleReset}
            onMappingChange={setAutoMapping}
          />
        );
      case 'VALIDATED':
        return (
          <ValidationView
            validation={validation!}
            qaResult={qaResult}
            onProceed={handleProceedFromValidation}
            onReset={handleReset}
          />
        );
      case 'TERRAIN_REVIEWED':
        return (
          <TerrainReviewView
            points={dataset!.points}
            metrics={metrics}
            qaResult={qaResult}
            onProceed={handleProceedFromReview}
            viewerMode={viewerMode}
            setViewerMode={setViewerMode}
          />
        );
      case 'SURFACE_READY':
        if (!qaResult?.quality?.canInterpolate) {
          return null;
        }
        return (
          <SurfaceView
            points={dataset!.points}
            metrics={metrics}
            surface={surface}
            surfaceQA={surfaceQA}
            isProcessing={isProcessing}
            onGenerateSurface={handleGenerateSurface}
            onProceed={handleProceedFromSurface}
            showPoints={showPoints}
            setShowPoints={setShowPoints}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            viewerMode={viewerMode}
            setViewerMode={setViewerMode}
          />
        );
      case 'CONTOURS_READY':
        return (
          <ContoursView
            points={dataset!.points}
            metrics={metrics}
            surface={surface}
            surfaceQA={surfaceQA}
            contours={contoursResult}
            contourQA={contourQA}
            isProcessing={isProcessingContours}
            onGenerateContours={handleGenerateContours}
            onProceed={handleProceedFromContours}
            contourInterval={contourInterval}
            setContourInterval={setContourInterval}
            includeIndexContours={includeIndexContours}
            setIncludeIndexContours={setIncludeIndexContours}
            indexEvery={indexEvery}
            setIndexEvery={setIndexEvery}
            showPoints={showPoints}
            setShowPoints={setShowPoints}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showContours={showContours}
            setShowContours={setShowContours}
            viewerMode={viewerMode}
            setViewerMode={setViewerMode}
          />
        );
      case 'VOLUME_READY':
        return (
          <VolumeView
            points={dataset!.points}
            surface={surface}
            metrics={metrics}
            selectedCRS={selectedCRS}
            viewerMode={viewerMode}
            polygon={polygon}
            setPolygon={setPolygon}
            volumeOptions={volumeOptions}
            setVolumeOptions={setVolumeOptions}
            volumeResult={volumeResult}
            setVolumeResult={setVolumeResult}
            volumeAudit={volumeAudit}
            onProceed={handleProceedFromVolume}
            onReset={handleReset}
          />
        );
      case 'EXPORT_READY':
        return (
          <ExportView
            points={dataset!.points}
            metrics={metrics}
            dataset={dataset}
            validation={validation}
            qaResult={qaResult}
            surface={surface}
            surfaceQA={surfaceQA}
            contoursResult={contoursResult}
            contourQA={contourQA}
            onReset={handleReset}
            exportStatus={exportStatus}
            setExportStatus={setExportStatus}
            isExporting={isExporting}
            setIsExporting={setIsExporting}
            exportCSV={exportCSV}
            setExportCSV={setExportCSV}
            includeValidationErrors={includeValidationErrors}
            setIncludeValidationErrors={setIncludeValidationErrors}
            exportPNG={exportPNG}
            setExportPNG={setExportPNG}
            exportJSON={exportJSON}
            setExportJSON={setExportJSON}
            exportDXF={exportDXF}
            setExportDXF={setExportDXF}
            exportGeoJSON={exportGeoJSON}
            setExportGeoJSON={setExportGeoJSON}
            exportQA={exportQA}
            pngQA={pngQAState}
            onPNGQAChange={(isValid, message) => setPngQAState({ isValid, message })}
            setLastExportTime={(time) => setLastExportTime(time)}
            selectedCRS={selectedCRS}
            viewerMode={viewerMode}
            volumeOptions={volumeOptions}
            volumeResult={volumeResult}
            volumeQA={volumeQA}
            volumeAudit={volumeAudit}
          />
        );
      default:
        return (
          <StartView
            onLoadSample={handleLoadSample}
            onFileUpload={handleFileUpload}
          />
        );
    }
  };

  return (
    <AppShell
      steps={steps}
      currentStepIndex={currentStepIndex}
      currentState={activeView === 'VALIDATED' && workflowState === 'ERROR' ? 'ERROR' : activeView}
      dataset={dataset}
      metrics={metrics}
      validation={validation}
      qaResult={qaResult}
      resolution={resolution}
      power={power}
      contourInterval={contourInterval}
      surface={surface}
      surfaceQA={surfaceQA}
      contours={contoursResult}
      contourQA={contourQA}
      includeIndexContours={includeIndexContours}
      indexEvery={indexEvery}
      isProcessing={isProcessing || isProcessingContours}
      exportStatus={exportStatus}
      exportQA={exportQA}
      selectedCRS={selectedCRS}
      onCRSChange={setSelectedCRS}
      onStepSelect={handleStepSelect}
      onReset={handleReset}
      onResolutionChange={setResolution}
      onPowerChange={setPower}
      onContourIntervalChange={setContourInterval}
      onIncludeIndexContoursChange={setIncludeIndexContours}
      onIndexEveryChange={setIndexEvery}
      onGenerateSurface={handleGenerateSurface}
      onGenerateContours={() => handleGenerateContours(contourInterval, includeIndexContours, indexEvery)}
      showPoints={showPoints}
      setShowPoints={setShowPoints}
      showGrid={showGrid}
      setShowGrid={setShowGrid}
      showContours={showContours}
      setShowContours={setShowContours}
      primaryActionLabel={primaryAction?.label}
      onPrimaryAction={primaryAction?.action}

      // Volume Props passed to AppShell
      polygon={polygon}
      volumeOptions={volumeOptions}
      onVolumeOptionsChange={setVolumeOptions}
      volumeResult={volumeResult}
      volumeQA={volumeQA}
      volumeAudit={volumeAudit}
    >
      {renderActiveView()}
    </AppShell>
  );
}
