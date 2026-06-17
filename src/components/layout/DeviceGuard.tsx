'use client';

import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

export function DeviceGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Avoid incorrect blocking before component mounts and reads window size
  if (!mounted) {
    return <>{children}</>;
  }

  const { width } = viewport;
  const isMobile = width < 900;
  const isTablet = width >= 900 && width < 1100;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex flex-col items-center">
          <div className="mb-6">
            <img src="/terrenolab-icon.svg" alt="TerrenoLab Logo" className="w-16 h-16 drop-shadow-sm" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            TerrenoLab MVP <span className="text-xs align-top inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-2">Alpha técnica</span>
          </h1>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 leading-tight">
            TerrenoLab aún no está optimizado para teléfonos celulares
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Por ahora, este workspace técnico está diseñado para usarse desde un computador, notebook o dispositivo con pantalla amplia.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 w-full text-sm text-slate-500">
            Para una mejor experiencia, abra TerrenoLab desde una pantalla de al menos 1100 px de ancho.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isTablet && (
        <div className="bg-amber-600 text-white text-center py-2 px-4 text-xs font-semibold select-none shrink-0 font-sans z-[9999] w-full">
          TerrenoLab está optimizado para pantallas de escritorio. Algunas vistas pueden verse comprimidas en esta resolución.
        </div>
      )}
      {children}
    </>
  );
}
