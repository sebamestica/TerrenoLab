import React from 'react';
import { MiniViewPreview } from './MiniViewPreview';
import { InspectorStatusBadge, InspectorStatus } from './InspectorStatusBadge';

interface InspectorViewHeaderProps {
  mode: 'Puntos' | 'Superficie' | 'Curvas' | 'Volumen' | 'Exportacion';
  title: string;
  description: string;
  status: InspectorStatus;
}

export function InspectorViewHeader({ mode, title, description, status }: InspectorViewHeaderProps) {
  return (
    <div className="border-b border-[#E2E8F0] pb-4 mb-4 space-y-3 font-sans">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
        Vista Activa
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-slate-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
          <MiniViewPreview mode={mode} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-[#0F172A] leading-snug truncate">
            {title}
          </h3>
          <p className="text-[12px] text-[#64748B] leading-tight mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Estado:</span>
        <InspectorStatusBadge status={status} />
      </div>
    </div>
  );
}
