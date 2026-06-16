import React from 'react';

interface ElevationLegendProps {
  minZ: number;
  maxZ: number;
  isDark?: boolean;
}

export function ElevationLegend({ minZ, maxZ, isDark = false }: ElevationLegendProps) {
  const midZ = minZ + (maxZ - minZ) / 2;

  return (
    <div className={`flex flex-col gap-1 w-48 font-mono text-[12px] ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
      <div className={`flex justify-between items-center uppercase tracking-wider text-[12px] font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
        <span>Leyenda Z</span>
        <span>(m)</span>
      </div>
      
      {/* Gradient Bar */}
      <div 
        className="h-2 w-full rounded-sm"
        style={{
          background: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #f59e0b, #f43f5e)'
        }}
      />
      
      {/* Labels */}
      <div className={`flex justify-between text-[12px] mt-1 font-semibold ${isDark ? 'text-slate-200' : 'text-[#0F172A]'}`}>
        <span>Min: {minZ.toFixed(1)}m</span>
        <span>{midZ.toFixed(1)}m</span>
        <span>Max: {maxZ.toFixed(1)}m</span>
      </div>
    </div>
  );
}
