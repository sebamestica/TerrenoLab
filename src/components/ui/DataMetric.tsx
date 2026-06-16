import React from 'react';

interface DataMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  description?: string;
}

export function DataMetric({ label, value, unit, icon, description }: DataMetricProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-md p-3 flex flex-col justify-between hover:border-[#CBD5E1] transition-colors duration-150 text-[#0F172A]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
          {label}
        </span>
        {icon && <div className="text-[#64748B]">{icon}</div>}
      </div>
      
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-lg font-mono font-semibold text-[#0F172A] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-mono text-[#64748B]">
            {unit}
          </span>
        )}
      </div>

      {description && (
        <span className="text-[9px] text-[#94A3B8] font-mono mt-1 leading-snug">
          {description}
        </span>
      )}
    </div>
  );
}
