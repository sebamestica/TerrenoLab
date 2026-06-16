import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function InspectorSection({ title, children, defaultOpen = true }: InspectorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between text-[11.5px] font-mono font-bold uppercase tracking-wider text-[#475569] hover:bg-slate-100 transition-colors select-none cursor-pointer text-left"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={14} className="text-[#64748B]" /> : <ChevronDown size={14} className="text-[#64748B]" />}
      </button>
      
      {isOpen && (
        <div className="p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
