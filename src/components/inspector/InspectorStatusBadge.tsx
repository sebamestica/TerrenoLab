import React from 'react';

export type InspectorStatus = 
  | 'Pendiente' 
  | 'Activo' 
  | 'Completado' 
  | 'Bloqueado' 
  | 'Advertencia' 
  | 'Crítico' 
  | 'Estable'
  | 'Apto para interpolación'
  | 'Requiere revisión'
  | 'Listo';

interface InspectorStatusBadgeProps {
  status: InspectorStatus;
  className?: string;
}

export function InspectorStatusBadge({ status, className = '' }: InspectorStatusBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case 'Estable':
      case 'Completado':
      case 'Apto para interpolación':
      case 'Listo':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Activo':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold';
      case 'Advertencia':
      case 'Requiere revisión':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Crítico':
      case 'Bloqueado':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Pendiente':
      default:
        return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <span className={`px-2 py-0.5 border text-[11px] font-bold rounded-full uppercase tracking-wider ${getStyle()} ${className}`}>
      {status}
    </span>
  );
}

