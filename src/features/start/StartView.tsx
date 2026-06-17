import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { FileDown, Database, History, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface StartViewProps {
  onLoadSample: () => void;
  onFileUpload: (file: File) => void;
  isProcessingText?: string;
}

export function StartView({ onLoadSample, onFileUpload, isProcessingText }: StartViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isCsv = name.endsWith('.csv') || name.endsWith('.txt');
    const isDem = name.endsWith('.tif') || name.endsWith('.tiff') || name.endsWith('.geotiff');

    if (!isCsv && !isDem) {
      setError('Formato no permitido. Use CSV, TXT, TIF, TIFF o GeoTIFF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxSize = isCsv ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande para esta versión.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onFileUpload(file);
  };

  const triggerFileInput = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  if (isProcessingText) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-lg mx-auto w-full select-none bg-white">
        <div className="w-full text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891B2]"></div>
          <p className="text-[14px] text-[#0F172A] font-medium">{isProcessingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-lg mx-auto w-full select-none bg-white">
      {/* Brand Header */}
      <div className="w-full text-left space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <img src="/terrenolab-icon.svg" alt="TerrenoLab" className="w-10 h-10" />
          <h1 className="text-[24px] font-sans font-bold text-[#0F172A] tracking-normal leading-none">
            TerrenoLab
          </h1>
        </div>
        <p className="text-[14px] text-[#64748B] font-sans font-normal">
          Workspace técnico de análisis topográfico e interpretación visual de datos.
        </p>
      </div>

      {error && (
        <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span className="text-[13px] font-sans leading-relaxed">{error}</span>
        </div>
      )}

      {/* Main Options Menu */}
      <div className="w-full space-y-3">
        {/* Action 1: New Analysis */}
        <button
          onClick={triggerFileInput}
          className="w-full flex items-center justify-between p-4 bg-white border border-[#E2E8F0] hover:border-[#0891B2] hover:bg-[#F8FAFC] rounded text-left group transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <FileDown className="text-[#64748B] group-hover:text-[#0891B2]" size={18} />
            <div>
              <span className="text-[14px] font-sans font-semibold text-[#0F172A] block">
                Nuevo análisis
              </span>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Cargar un archivo CSV, TXT, o raster GeoTIFF (.tif)
              </span>
            </div>
          </div>
        </button>

        {/* Action 2: Load Sample */}
        <button
          onClick={onLoadSample}
          className="w-full flex items-center justify-between p-4 bg-white border border-[#E2E8F0] hover:border-[#0891B2] hover:bg-[#F8FAFC] rounded text-left group transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <Database className="text-[#64748B] group-hover:text-[#0891B2]" size={18} />
            <div>
              <span className="text-[14px] font-sans font-semibold text-[#0F172A] block">
                Usar dataset de prueba
              </span>
              <span className="text-[12px] text-[#64748B] block mt-0.5">
                Cargar terreno_prueba.csv (50 puntos UTM)
              </span>
            </div>
          </div>
        </button>

        {/* Action 3: Open Recent */}
        <div className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-left opacity-60">
          <div className="flex items-start gap-3">
            <History className="text-[#94A3B8] mt-0.5" size={18} />
            <div>
              <span className="text-[14px] font-sans font-semibold text-[#94A3B8] block">
                Abrir archivo reciente
              </span>
              <span className="text-[12px] text-[#94A3B8] block mt-0.5">
                No hay levantamientos recientes en la caché local
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Link section */}
      <div className="w-full mt-4 p-3.5 bg-cyan-50/50 border border-cyan-100/80 rounded-lg flex items-center justify-between gap-3 text-left">
        <div className="space-y-0.5">
          <span className="text-[12.5px] font-semibold text-[#0F172A] block font-sans">
            ¿Nuevo en TerrenoLab?
          </span>
          <span className="text-[11.5px] text-[#64748B] block font-sans leading-tight">
            Revise la guía rápida antes de cargar sus datos.
          </span>
        </div>
        <Link
          href="/guia"
          className="px-3.5 py-1.5 bg-[#0891B2] hover:bg-[#06B6D4] text-white text-[12px] font-semibold rounded shadow-sm transition-colors shrink-0 text-center font-sans"
        >
          Ver guía rápida
        </Link>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt,.tif,.tiff,.geotiff"
        className="hidden"
      />

      {/* Info notice */}
      <div className="w-full mt-8 pt-4 border-t border-[#E2E8F0] text-[12px] text-[#64748B] flex flex-col gap-3">
        <div className="flex gap-2">
          <Info size={14} className="text-[#64748B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Para iniciar, seleccione un archivo CSV/TXT con puntos de control, o un archivo de elevación GeoTIFF/TIF.
          </p>
        </div>
        <div className="flex gap-2 text-[#0891B2]">
          <ShieldCheck size={14} className="text-[#0891B2] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            Los archivos se procesan localmente en el navegador. No se suben a servidor ni se almacenan permanentemente. Si se cierra la página, el análisis se perderá salvo que se exporten los resultados.
          </p>
        </div>
      </div>
    </div>
  );
}
