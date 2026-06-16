import React, { useState, useEffect } from 'react';
import { FileCode, AlertCircle, CheckCircle } from 'lucide-react';
import { ColumnMapping } from '../../domain/terrain/validation';
import { Button } from '../../components/ui/Button';

interface ImportViewProps {
  headers: string[];
  rawLinesPreview: string[][];
  initialMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  onMappingChange?: (mapping: ColumnMapping) => void;
}

export function ImportView({
  headers,
  rawLinesPreview,
  initialMapping,
  onConfirm,
  onCancel,
  onMappingChange,
}: ImportViewProps) {
  // Map dropdown state based on header strings
  const [mapping, setMapping] = useState<ColumnMapping>({
    idColumn: initialMapping.idColumn || '',
    xColumn: initialMapping.xColumn || '',
    yColumn: initialMapping.yColumn || '',
    zColumn: initialMapping.zColumn || '',
  });

  // Attempt auto-mapping on mount if mappings are empty
  useEffect(() => {
    const findMatch = (synonyms: string[]) => {
      for (const h of headers) {
        const lower = h.toLowerCase();
        if (synonyms.some(syn => lower === syn || lower.startsWith(syn) || lower.endsWith(syn))) {
          return h;
        }
      }
      return '';
    };

    const newMapping = {
      idColumn: findMatch(['id', 'point', 'punto', 'nombre', 'name']),
      xColumn: findMatch(['x', 'east', 'easting', 'este']),
      yColumn: findMatch(['y', 'north', 'northing', 'norte']),
      zColumn: findMatch(['z', 'elevation', 'height', 'elevacion', 'cota']),
    };
    setMapping(newMapping);
    if (onMappingChange) {
      onMappingChange(newMapping);
    }
  }, [headers, onMappingChange]);

  const handleSelectChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = {
      ...mapping,
      [field]: value,
    };
    setMapping(newMapping);
    if (onMappingChange) {
      onMappingChange(newMapping);
    }
  };

  const isMapped = mapping.xColumn !== '' && mapping.yColumn !== '' && mapping.zColumn !== '';

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-4xl mx-auto w-full select-none bg-white">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-[18px] font-sans font-semibold text-[#0F172A]">
          1. Importar Dataset
        </h1>
        <p className="text-[13px] text-[#64748B]">
          Configure y confirme el esquema de coordenadas del archivo topográfico.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT: Zone 1 & Zone 2 */}
        <div className="md:col-span-1 space-y-5">
          
          {/* Zone 1: Zona de Carga */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-4 space-y-3">
            <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
              1. Zona de carga
            </span>
            <div className="flex items-center gap-3">
              <FileCode size={24} className="text-[#06B6D4]" />
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-[#0F172A] block truncate">
                  Archivo de entrada
                </span>
                <span className="text-[12px] text-[#64748B] block">
                  Columnas leídas: {headers.length}
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Validación Inmediata */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-4 space-y-2">
            <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
              2. Validación inmediata
            </span>
            
            <div className="flex items-start gap-2 pt-1">
              {isMapped ? (
                <>
                  <CheckCircle size={16} className="text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[13px] font-semibold text-[#10B981] block">
                      ¿Este archivo sirve?: SÍ
                    </span>
                    <span className="text-[12px] text-[#64748B] block mt-0.5">
                      Las columnas X, Y, Z se encuentran mapeadas correctamente.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[13px] font-semibold text-[#EF4444] block">
                      ¿Este archivo sirve?: NO
                    </span>
                    <span className="text-[12px] text-[#64748B] block mt-0.5">
                      Falta definir columnas obligatorias X, Y, Z.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mapping select dropdowns */}
          <div className="border border-[#E2E8F0] rounded p-4 space-y-3">
            <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] block border-b border-[#E2E8F0] pb-1.5">
              Mapeo de Campos
            </span>

            {/* ID Field (Optional) */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] block font-medium">
                Columna ID (Opcional)
              </label>
              <select
                value={mapping.idColumn}
                onChange={(e) => handleSelectChange('idColumn', e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="">-- Autogenerar ID (P1, P2...) --</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* X Field (Mandatory) */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] block font-medium">
                Coordenada X (Este) *
              </label>
              <select
                value={mapping.xColumn}
                onChange={(e) => handleSelectChange('xColumn', e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="">-- Seleccionar columna --</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Y Field (Mandatory) */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] block font-medium">
                Coordenada Y (Norte) *
              </label>
              <select
                value={mapping.yColumn}
                onChange={(e) => handleSelectChange('yColumn', e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="">-- Seleccionar columna --</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Z Field (Mandatory) */}
            <div className="space-y-1">
              <label className="text-[12px] text-[#64748B] block font-medium">
                Coordenada Z (Cota) *
              </label>
              <select
                value={mapping.zColumn}
                onChange={(e) => handleSelectChange('zColumn', e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded p-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="">-- Seleccionar columna --</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* RIGHT: Zone 3 (Table Preview) */}
        <div className="md:col-span-2 flex flex-col border border-[#E2E8F0] rounded p-4 bg-white overflow-hidden">
          <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] pb-2 mb-3 block">
            3. Vista previa de tabla (Primeras 20 filas)
          </span>

          <div className="overflow-auto flex-1 max-h-[420px]">
            <table className="w-full border-collapse font-mono text-[12px] text-left text-[#0F172A]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0">
                  {headers.map((h, idx) => {
                    const isId = h === mapping.idColumn;
                    const isX = h === mapping.xColumn;
                    const isY = h === mapping.yColumn;
                    const isZ = h === mapping.zColumn;
                    const isMappedCol = isId || isX || isY || isZ;
                    
                    let marker = '';
                    if (isId) marker = ' [ID]';
                    if (isX) marker = ' [X]';
                    if (isY) marker = ' [Y]';
                    if (isZ) marker = ' [Z]';

                    return (
                      <th
                        key={idx}
                        className={`p-2 border-r border-[#E2E8F0] font-bold ${
                          isMappedCol ? 'text-[#0891B2] bg-[#ECFEFF]/40' : 'text-[#64748B]'
                        }`}
                      >
                        {h}
                        {marker && <span className="text-[10px] text-[#0891B2] font-semibold">{marker}</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rawLinesPreview.slice(0, 20).map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#E2E8F0]/85 hover:bg-[#F8FAFC]/55">
                    {row.map((cell, cIdx) => {
                      const h = headers[cIdx];
                      const isMappedCol =
                        h === mapping.idColumn ||
                        h === mapping.xColumn ||
                        h === mapping.yColumn ||
                        h === mapping.zColumn;

                      return (
                        <td
                          key={cIdx}
                          className={`p-2 border-r border-[#E2E8F0]/80 ${
                            isMappedCol ? 'bg-[#ECFEFF]/10 font-medium' : 'text-[#64748B]'
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4 shrink-0">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={() => onConfirm(mapping)} disabled={!isMapped}>
          Confirmar y Avanzar
        </Button>
      </div>
    </div>
  );
}
