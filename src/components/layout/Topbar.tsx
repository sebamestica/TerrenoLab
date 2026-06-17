import React from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { WorkflowState } from '../../domain/workflow/workflowTypes';
import { TerrainDataset } from '../../domain/terrain/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TopbarProps {
  currentState: WorkflowState;
  dataset: TerrainDataset | null;
  onReset: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export function Topbar({
  currentState,
  dataset,
  onReset,
  primaryActionLabel,
  onPrimaryAction,
}: TopbarProps) {
  const getStatusBadge = () => {
    switch (currentState) {
      case 'EMPTY':
        return <Badge variant="neutral">Sin Fichero</Badge>;
      case 'FILE_SELECTED':
        return <Badge variant="info">Mapeo</Badge>;
      case 'VALIDATED':
        return <Badge variant="warning">Por Validar</Badge>;
      case 'TERRAIN_REVIEWED':
        return <Badge variant="success">Visualización 2D</Badge>;
      case 'SURFACE_READY':
        return <Badge variant="success">Superficie Ok</Badge>;
      case 'CONTOURS_READY':
        return <Badge variant="success">Curvas Ok</Badge>;
      case 'EXPORT_READY':
        return <Badge variant="info">Listos</Badge>;
      case 'ERROR':
        return <Badge variant="danger">Error QA</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-white px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="/terrenolab-icon.svg" alt="TerrenoLab" className="w-7 h-7" />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-[14px] leading-tight text-[#0F172A]">
              TerrenoLab MVP
            </span>
            <span className="text-[9.5px] font-medium leading-none text-[#64748B]">
              Versión Alpha técnica
            </span>
          </div>
        </div>
        <Link 
          href="/guia"
          target="_blank"
          className="text-xs font-semibold text-[#0891B2] hover:text-[#06B6D4] transition-colors font-sans px-2.5 py-1 bg-cyan-50 rounded border border-cyan-100/50"
        >
          Guía rápida
        </Link>
        {dataset && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded font-mono text-[12px] text-[#64748B]">
            <span>Proyecto:</span>
            <span className="text-[#0F172A] font-semibold max-w-[180px] truncate">
              {dataset.name}
            </span>
          </div>
        )}
      </div>

      {/* Status & Contextual Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[13px] text-[#64748B]">
          <span>Flujo:</span>
          {getStatusBadge()}
        </div>

        {primaryActionLabel && onPrimaryAction && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onPrimaryAction}
            className="h-8 font-sans font-semibold text-xs tracking-normal"
          >
            {primaryActionLabel}
          </Button>
        )}

        {currentState !== 'EMPTY' && (
          <button
            onClick={onReset}
            className="p-1.5 rounded hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors border border-transparent hover:border-[#E2E8F0]"
            title="Reiniciar análisis"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
