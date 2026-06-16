import { WorkflowState, WorkflowStep, StepStatus } from './workflowTypes';

export const WORKFLOW_STEPS_DEFINITION = [
  { id: 'IMPORT', label: 'Importar', description: 'Carga de archivo y formato', state: 'FILE_SELECTED' },
  { id: 'VALIDATE', label: 'Validar', description: 'Control de calidad QA', state: 'VALIDATED' },
  { id: 'REVIEW', label: 'Revisar terreno', description: 'Dispersión y límites 2D', state: 'TERRAIN_REVIEWED' },
  { id: 'SURFACE', label: 'Generar superficie', description: 'Resolución de malla IDW', state: 'SURFACE_READY' },
  { id: 'CONTOURS', label: 'Curvas', description: 'Curvas no generadas', state: 'CONTOURS_READY' },
  { id: 'VOLUME', label: 'Volumen', description: 'Corte/relleno preliminar', state: 'VOLUME_READY' },
  { id: 'EXPORT', label: 'Exportar', description: 'Descarga de entregables', state: 'EXPORT_READY' },
];

/**
 * Checks if a transition between states is valid under workflow rules.
 */
export function canTransition(
  from: WorkflowState,
  to: WorkflowState,
  canInterpolate = false,
  canExport = false
): boolean {
  if (to === 'EMPTY') return true; // Always allow reset to Empty
  if (to === 'ERROR') return true; // Always allow error state

  // Block transitions if conditions are not met
  if (to === 'EXPORT_READY' && !canExport) {
    return false;
  }
  if (to === 'SURFACE_READY' && !canInterpolate) {
    return false;
  }
  if (to === 'CONTOURS_READY' && !canInterpolate) {
    return false;
  }
  if (to === 'VOLUME_READY' && !canInterpolate) {
    return false;
  }

  const stateOrder: WorkflowState[] = [
    'EMPTY',
    'FILE_SELECTED',
    'VALIDATED',
    'TERRAIN_REVIEWED',
    'SURFACE_READY',
    'CONTOURS_READY',
    'VOLUME_READY',
    'EXPORT_READY'
  ];

  const fromIndex = stateOrder.indexOf(from);
  const toIndex = stateOrder.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) return false;

  // Allow advancing exactly 1 step or going back to any previously completed step
  return toIndex <= fromIndex + 1;
}

/**
 * Resolves the status for each workflow step based on the current state.
 */
export function getWorkflowSteps(
  currentState: WorkflowState,
  canInterpolate = false,
  canExport = false
): WorkflowStep[] {
  const stateOrder: WorkflowState[] = [
    'EMPTY',
    'FILE_SELECTED',
    'VALIDATED',
    'TERRAIN_REVIEWED',
    'SURFACE_READY',
    'CONTOURS_READY',
    'VOLUME_READY',
    'EXPORT_READY'
  ];

  const currentIndex = stateOrder.indexOf(currentState === 'ERROR' ? 'VALIDATED' : currentState);

  return WORKFLOW_STEPS_DEFINITION.map((step, index) => {
    let status: StepStatus = 'locked';

    const stepMatchIndex = currentIndex - 1;

    if (currentState === 'EMPTY') {
      if (index === 0) status = 'pending'; // Import is pending at start
    } else if (currentState === 'ERROR' && index === 1) {
      status = 'error'; // Error displays on validation step
    } else if (index === stepMatchIndex) {
      status = 'active';
    } else if (index < stepMatchIndex) {
      status = 'complete';
    } else if (index === stepMatchIndex + 1 && currentState !== 'ERROR') {
      const stepState = step.state;
      if (stepState === 'SURFACE_READY') {
        status = canInterpolate ? 'pending' : 'locked';
      } else if (stepState === 'CONTOURS_READY') {
        status = canInterpolate ? 'pending' : 'locked';
      } else if (stepState === 'VOLUME_READY') {
        status = canInterpolate ? 'pending' : 'locked';
      } else if (stepState === 'EXPORT_READY') {
        status = canExport ? 'pending' : 'locked';
      } else {
        status = 'pending';
      }
    }

    return {
      id: step.id,
      label: step.label,
      description: step.description,
      state: step.state as WorkflowState,
      status,
    };
  });
}

