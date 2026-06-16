import React, { useRef } from 'react';
import { FileDown, Database, History, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface StartViewProps {
  onLoadSample: () => void;
  onFileUpload: (fileText: string, fileName: string) => void;
}

export function StartView({ onLoadSample, onFileUpload }: StartViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      onFileUpload(text, file.name);
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-lg mx-auto w-full select-none bg-white">
      {/* Brand Header */}
      <div className="w-full text-left space-y-2 mb-8">
        <h1 className="text-[24px] font-sans font-bold text-[#0F172A] tracking-normal">
          TerrenoLab
        </h1>
        <p className="text-[14px] text-[#64748B] font-sans font-normal">
          Workspace técnico de análisis topográfico e interpretación visual de datos.
        </p>
      </div>

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
                Cargar un archivo de coordenadas CSV local
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Info notice */}
      <div className="w-full mt-8 pt-4 border-t border-[#E2E8F0] text-[12px] text-[#64748B] flex gap-2">
        <Info size={14} className="text-[#64748B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Para iniciar, seleccione un archivo CSV estructurado que contenga al menos tres puntos de control con coordenadas representables en ejes Cartesianos.
        </p>
      </div>
    </div>
  );
}
