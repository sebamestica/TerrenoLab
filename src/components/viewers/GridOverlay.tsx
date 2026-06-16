import React from 'react';

interface GridOverlayProps {
  width: number;
  height: number;
  isDark?: boolean;
}

export function GridOverlay({ width, height, isDark = false }: GridOverlayProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none select-none font-mono text-[12px] ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
      {/* Corner crosshairs */}
      <div className={`absolute top-4 left-4 w-4 h-4 border-t border-l ${isDark ? 'border-slate-700' : 'border-[#CBD5E1]'}`} />
      <div className={`absolute top-4 right-4 w-4 h-4 border-t border-r ${isDark ? 'border-slate-700' : 'border-[#CBD5E1]'}`} />
      <div className={`absolute bottom-4 left-4 w-4 h-4 border-b border-l ${isDark ? 'border-slate-700' : 'border-[#CBD5E1]'}`} />
      <div className={`absolute bottom-4 right-4 w-4 h-4 border-b border-r ${isDark ? 'border-slate-700' : 'border-[#CBD5E1]'}`} />

      {/* Center crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
        <div className={`w-6 h-[1px] ${isDark ? 'bg-slate-700' : 'bg-[#94A3B8]'}`} />
        <div className={`h-6 w-[1px] ${isDark ? 'bg-slate-700' : 'bg-[#94A3B8]'} absolute`} />
      </div>

      {/* Viewport indicators */}
      <span className={`absolute top-2 left-6 uppercase tracking-wider text-[12px] font-semibold ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
        Visor 2D Planta
      </span>
      <span className="absolute top-2 right-6 text-[12px]">
        {width} x {height} px
      </span>
      
      {/* CAD compass decoration */}
      <div className="absolute top-12 right-6 flex flex-col items-center justify-center opacity-70">
        <div className="text-[12px] font-bold text-[#0891B2]">N</div>
        <div className="w-0.5 h-3 bg-[#0891B2] my-0.5" />
        <div className="w-2 h-2 border-t-2 border-r-2 border-[#0891B2] rotate-[-45deg] translate-y-[-2px]" />
      </div>
    </div>
  );
}
