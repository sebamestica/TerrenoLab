import React from 'react';
import { StepStatus } from '../../domain/workflow/workflowTypes';

interface StatusChipProps {
  status: StepStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const styles = {
    locked: 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]',
    pending: 'bg-white text-[#64748B] border-[#E2E8F0]',
    active: 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2] animate-pulse',
    complete: 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]',
    error: 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]',
  };

  const labels = {
    locked: 'Bloqueado',
    pending: 'Pendiente',
    active: 'Activo',
    complete: 'Listo',
    error: 'Error',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono border font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
