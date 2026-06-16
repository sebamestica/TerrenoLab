import React from 'react';

interface InspectorMetricRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export function InspectorMetricRow({ label, value, mono = false, className = '' }: InspectorMetricRowProps) {
  return (
    <div className={`flex justify-between items-center py-1 border-b border-slate-50 last:border-b-0 text-[13px] font-sans ${className}`}>
      <span className="text-[#64748B]">{label}</span>
      <span className={`text-[#0F172A] font-semibold ${mono ? 'font-mono text-[12px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}
