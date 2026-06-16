export type WorkflowState =
  | 'EMPTY'
  | 'FILE_SELECTED'
  | 'VALIDATED'
  | 'TERRAIN_REVIEWED'
  | 'SURFACE_READY'
  | 'CONTOURS_READY'
  | 'VOLUME_READY'
  | 'EXPORT_READY'
  | 'ERROR';

export type StepStatus = 'locked' | 'pending' | 'active' | 'complete' | 'error';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  state: WorkflowState; // State that activates this step
  status: StepStatus;
}
