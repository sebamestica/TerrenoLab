import React from 'react';

interface MiniViewPreviewProps {
  mode: 'Puntos' | 'Superficie' | 'Curvas' | 'Volumen' | 'Exportacion';
}

export function MiniViewPreview({ mode }: MiniViewPreviewProps) {
  switch (mode) {
    case 'Puntos':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cyan-500">
          <circle cx="5" cy="8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="5" r="1.5" fill="currentColor" />
          <circle cx="18" cy="9" r="1.5" fill="currentColor" />
          <circle cx="8" cy="14" r="1.5" fill="currentColor" />
          <circle cx="15" cy="18" r="1.5" fill="currentColor" />
          <circle cx="20" cy="15" r="1.5" fill="currentColor" />
          <circle cx="10" cy="9" r="1.5" fill="currentColor" />
          <circle cx="14" cy="11" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'Superficie':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="6" height="6" fill="#3b82f6" />
          <rect x="9" y="2" width="6" height="6" fill="#06b6d4" />
          <rect x="16" y="2" width="6" height="6" fill="#06b6d4" />
          
          <rect x="2" y="9" width="6" height="6" fill="#06b6d4" />
          <rect x="9" y="9" width="6" height="6" fill="#10b881" />
          <rect x="16" y="9" width="6" height="6" fill="#f59e0b" />
          
          <rect x="2" y="16" width="6" height="6" fill="#10b881" />
          <rect x="9" y="16" width="6" height="6" fill="#f59e0b" />
          <rect x="16" y="16" width="6" height="6" fill="#f43f5e" />
        </svg>
      );
    case 'Curvas':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.5">
          <path d="M 2 18 C 6 12, 10 12, 14 18 C 17 22, 21 16, 22 14" />
          <path d="M 2 12 C 7 7, 12 8, 16 13 C 18 15, 20 12, 22 9" />
          <path d="M 2 7 C 8 3, 15 4, 18 9 C 20 11, 21 8, 22 5" />
        </svg>
      );
    case 'Volumen':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polygon points="4,6 18,3 20,16 9,21 3,14" fill="rgba(8, 145, 178, 0.2)" stroke="#0891b2" strokeWidth="1.5" />
          <path d="M 6 10 L 14 6 L 16 14 L 8 16 Z" fill="rgba(225, 29, 72, 0.4)" stroke="#e11d48" strokeWidth="1" />
        </svg>
      );
    case 'Exportacion':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    default:
      return null;
  }
}
