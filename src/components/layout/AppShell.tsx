import React from 'react';
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
        <main className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] relative">
          {children}
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
        />
      </div>
    </div>
  );
}
