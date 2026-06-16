import React from 'react';
import { WorkflowStep, WorkflowState } from '../../domain/workflow/workflowTypes';

interface WorkflowSidebarProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  onStepSelect: (state: WorkflowState) => void;
}

export function WorkflowSidebar({ steps, currentStepIndex, onStepSelect }: WorkflowSidebarProps) {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-[#0891B2] bg-[#ECFEFF] text-[#0891B2] font-semibold cursor-pointer';
      case 'complete':
        return 'border-[#10B981] bg-[#F0FDF4] text-[#10B981] cursor-pointer hover:bg-[#F0FDF4]/80';
      case 'error':
        return 'border-[#EF4444] bg-[#FEF2F2] text-[#EF4444] cursor-pointer';
      case 'pending':
        return 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer';
      case 'locked':
      default:
        return 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed opacity-60';
    }
  };

  return (
    <aside className="w-[220px] border-r border-[#E2E8F0] bg-white flex flex-col h-full select-none shrink-0">
      <div className="px-4 py-3 border-b border-[#E2E8F0] h-[56px] flex items-center">
        <h2 className="text-[12px] font-mono uppercase tracking-[0.15em] text-[#64748B] font-bold">
          PASOS DE ANÁLISIS
        </h2>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {steps.map((step, idx) => {
          const isClickable = step.status !== 'locked';
          
          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepSelect(step.state)}
              className={`p-3 border rounded transition-all duration-150 ${getStatusClasses(step.status)}`}
            >
              <div className="font-sans text-[14px]">
                {idx + 1}. {step.label}
              </div>
              <p className="text-[12px] text-[#64748B] mt-1 font-sans font-normal leading-normal">
                {step.description}
              </p>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] font-sans text-[12px] text-[#64748B]">
        <p className="leading-relaxed">
          Siga la secuencia numérica para habilitar los entregables de exportación.
        </p>
      </div>
    </aside>
  );
}
