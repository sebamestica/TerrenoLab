import React from 'react';
import { WorkflowState } from '../../domain/workflow/workflowTypes';

export type SelectorModeStatus = 'estable' | 'advertencia' | 'bloqueado' | 'pendiente';

interface ViewModeSelectorProps {
  activeView: WorkflowState;
  onModeSelect: (mode: WorkflowState) => void;
  states: {
    Puntos: { available: boolean; status: SelectorModeStatus };
    Superficie: { available: boolean; status: SelectorModeStatus };
    Curvas: { available: boolean; status: SelectorModeStatus };
    Volumen: { available: boolean; status: SelectorModeStatus };
  };
}

export function ViewModeSelector({ activeView, onModeSelect, states }: ViewModeSelectorProps) {
  const modes: { id: WorkflowState; label: string; key: keyof typeof states }[] = [
    { id: 'TERRAIN_REVIEWED', label: 'Puntos', key: 'Puntos' },
    { id: 'SURFACE_READY', label: 'Superficie', key: 'Superficie' },
    { id: 'CONTOURS_READY', label: 'Curvas', key: 'Curvas' },
    { id: 'VOLUME_READY', label: 'Volumen', key: 'Volumen' }
  ];

  const getButtonStyles = (id: WorkflowState, key: keyof typeof states) => {
    const info = states[modeIndex(key)];
    const isActive = activeView === id;

    if (!info.available) {
      return 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50';
    }

    let statusColors = '';
    if (info.status === 'estable') {
      statusColors = isActive 
        ? 'bg-green-600 text-white border-green-600 font-bold' 
        : 'bg-white text-green-700 border-green-500 hover:bg-green-50/50';
    } else if (info.status === 'advertencia') {
      statusColors = isActive 
        ? 'bg-amber-500 text-white border-amber-500 font-bold' 
        : 'bg-white text-amber-700 border-amber-400 hover:bg-amber-50/50';
    } else if (info.status === 'bloqueado') {
      statusColors = isActive 
        ? 'bg-red-600 text-white border-red-600 font-bold' 
        : 'bg-white text-red-700 border-red-400 hover:bg-red-50/50';
    } else { // pendiente
      statusColors = isActive 
        ? 'bg-[#0891B2] text-white border-[#0891B2] font-bold' 
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50';
    }

    return `${statusColors} cursor-pointer`;
  };

  // Helper helper to bypass typescript key issues
  function modeIndex(k: keyof typeof states) {
    return k;
  }

  return (
    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded border border-slate-200/50 mb-4 font-sans select-none">
      {modes.map((mode) => {
        const info = states[modeIndex(mode.key)];
        const isClickable = info.available;
        return (
          <button
            key={mode.id}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onModeSelect(mode.id)}
            className={`py-1 text-[11px] font-semibold rounded text-center border transition-all ${getButtonStyles(mode.id, mode.key)}`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
