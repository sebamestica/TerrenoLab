import React from 'react';
import { Layers } from 'lucide-react';
import { Topbar } from './Topbar';
import { WorkflowSidebar } from './WorkflowSidebar';
import { InspectorPanel } from './InspectorPanel';
import { WorkflowStep, WorkflowState } from '../../domain/workflow/workflowTypes';
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

// Material Layers
import { FillMaterialLayer, MaterialLayerResult } from '../../domain/terrain/materialLayers';
import { MaterialLayersQAResult } from '../../domain/terrain/materialLayersQA';


interface AppShellProps {
  children: React.ReactNode;
  steps: WorkflowStep[];
  currentStepIndex: number;
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
  onCRSChange?: (val: string) => void;
  onStepSelect: (state: WorkflowState) => void;
  onReset: () => void;
  onResolutionChange: (val: 'low' | 'medium' | 'high') => void;
  onPowerChange: (val: number) => void;
  onContourIntervalChange: (val: number) => void;
  onIncludeIndexContoursChange: (val: boolean) => void;
  onIndexEveryChange: (val: number) => void;
  onGenerateSurface: () => void;
  onGenerateContours: () => void;
  
  // Volume Props
  polygon?: Array<{ x: number; y: number }>;
  volumeOptions?: VolumeOptions;
  onVolumeOptionsChange?: (val: VolumeOptions) => void;
  volumeResult?: VolumeResult | null;
  volumeQA?: VolumeQAResult | null;
  volumeAudit?: VolumeAuditResult | null;

  // Material Layers Props
  materialLayers?: FillMaterialLayer[];
  onMaterialLayersChange?: (layers: FillMaterialLayer[]) => void;
  materialLayersResult?: MaterialLayerResult | null;
  materialLayersQA?: MaterialLayersQAResult | null;

  
  // Layer visibility controls
  showPoints?: boolean;
  setShowPoints?: (val: boolean) => void;
  showGrid?: boolean;
  setShowGrid?: (val: boolean) => void;
  showContours?: boolean;
  setShowContours?: (val: boolean) => void;

  // Contextual primary actions
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;

  polygonMode?: 'idle' | 'drawing' | 'editing';
  lastPolygonEditTime?: string | null;
  skippedVolume?: boolean;
  skippedContours?: boolean;
}


export function AppShell({
  children,
  steps,
  currentStepIndex,
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
  exportStatus,
  exportQA,
  selectedCRS,
  onCRSChange,
  includeIndexContours,
  indexEvery,
  isProcessing,
  onStepSelect,
  onReset,
  onResolutionChange,
  onPowerChange,
  onContourIntervalChange,
  onIncludeIndexContoursChange,
  onIndexEveryChange,
  onGenerateSurface,
  onGenerateContours,
  showPoints,
  setShowPoints,
  showGrid,
  setShowGrid,
  showContours,
  setShowContours,
  primaryActionLabel,
  onPrimaryAction,
  
  // Volume Props
  polygon,
  volumeOptions,
  onVolumeOptionsChange,
  volumeResult,
  volumeQA,
  volumeAudit,
  materialLayers,
  onMaterialLayersChange,
  materialLayersResult,
  materialLayersQA,
  polygonMode = 'idle',
  lastPolygonEditTime = null,
  skippedVolume = false,
  skippedContours = false,
}: AppShellProps) {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] overflow-hidden font-sans">
      {/* Topbar */}
      <Topbar
        currentState={currentState}
        dataset={dataset}
        onReset={onReset}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={onPrimaryAction}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Workflow Navigation */}
        <WorkflowSidebar
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepSelect={onStepSelect}
        />

        {/* Center: Main Working Canvas & Form Views */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#FFFFFF] relative">
          {/* Global Layers Bar */}
          {currentState !== 'EMPTY' && currentState !== 'FILE_SELECTED' && currentState !== 'VALIDATED' && currentState !== 'ERROR' && (
            <div className="h-11 border-b border-[#E2E8F0] bg-white px-4 flex items-center justify-between shrink-0 select-none z-10 global-layers-bar font-sans">
              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono text-[12px]">
                  <Layers size={14} className="text-[#0891B2]" />
                  Capas Activas:
                </span>
                
                {/* Nube de puntos */}
                <label key="show-points-label" className="flex items-center gap-1.5 cursor-pointer text-[#0F172A] font-medium">
                  <input
                    key="show-points-checkbox"
                    type="checkbox"
                    checked={showPoints === true}
                    onChange={(e) => setShowPoints?.(e.target.checked)}
                    className="accent-[#0891B2] rounded cursor-pointer"
                  />
                  Nube de puntos
                </label>

                {/* Superficie IDW */}
                {surface !== null ? (
                  <label key="show-grid-label-active" className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer font-medium">
                    <input
                      key="show-grid-checkbox-active"
                      type="checkbox"
                      checked={showGrid === true}
                      onChange={(e) => setShowGrid?.(e.target.checked)}
                      className="accent-[#0891B2] rounded cursor-pointer"
                    />
                    Superficie IDW
                  </label>
                ) : (
                  <label key="show-grid-label-disabled" className="flex items-center gap-1.5 text-[#94A3B8] cursor-not-allowed font-medium" title="Superficie IDW no generada">
                    <input
                      key="show-grid-checkbox-disabled"
                      type="checkbox"
                      disabled
                      checked={false}
                      onChange={() => {}}
                      className="rounded opacity-50 cursor-not-allowed"
                    />
                    Superficie IDW no generada
                  </label>
                )}

                {/* Curvas de nivel */}
                {contours !== null ? (
                  <label key="show-contours-label-active" className="flex items-center gap-1.5 text-[#0F172A] cursor-pointer font-medium">
                    <input
                      key="show-contours-checkbox-active"
                      type="checkbox"
                      checked={showContours === true}
                      onChange={(e) => setShowContours?.(e.target.checked)}
                      className="accent-[#0891B2] rounded cursor-pointer"
                    />
                    Curvas de nivel
                  </label>
                ) : (
                  <label key="show-contours-label-disabled" className="flex items-center gap-1.5 text-[#94A3B8] cursor-not-allowed font-medium" title="Curvas no generadas">
                    <input
                      key="show-contours-checkbox-disabled"
                      type="checkbox"
                      disabled
                      checked={false}
                      onChange={() => {}}
                      className="rounded opacity-50 cursor-not-allowed"
                    />
                    Curvas no generadas
                  </label>
                )}
              </div>
            </div>
          )}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                hideLocalLayerControls: true,
              });
            }
            return child;
          })}
        </main>

        {/* Right Side: Data Inspector */}
        <InspectorPanel
          currentState={currentState}
          dataset={dataset}
          metrics={metrics}
          validation={validation}
          qaResult={qaResult}
          resolution={resolution}
          power={power}
          contourInterval={contourInterval}
          surface={surface}
          surfaceQA={surfaceQA}
          contours={contours}
          contourQA={contourQA}
          exportStatus={exportStatus}
          exportQA={exportQA}
          selectedCRS={selectedCRS}
          onCRSChange={onCRSChange}
          includeIndexContours={includeIndexContours}
          indexEvery={indexEvery}
          isProcessing={isProcessing}
          onResolutionChange={onResolutionChange}
          onPowerChange={onPowerChange}
          onContourIntervalChange={onContourIntervalChange}
          onIncludeIndexContoursChange={onIncludeIndexContoursChange}
          onIndexEveryChange={onIndexEveryChange}
          onGenerateSurface={onGenerateSurface}
          onGenerateContours={onGenerateContours}
          showPoints={showPoints}
          setShowPoints={setShowPoints}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showContours={showContours}
          setShowContours={setShowContours}
          polygon={polygon}
          volumeOptions={volumeOptions}
          onVolumeOptionsChange={onVolumeOptionsChange}
          volumeResult={volumeResult}
          volumeQA={volumeQA}
          volumeAudit={volumeAudit}
          materialLayers={materialLayers}
          onMaterialLayersChange={onMaterialLayersChange}
          materialLayersResult={materialLayersResult}
          materialLayersQA={materialLayersQA}
          polygonMode={polygonMode}
          lastPolygonEditTime={lastPolygonEditTime}
          skippedVolume={skippedVolume}
          skippedContours={skippedContours}
        />
      </div>
    </div>
  );
}
