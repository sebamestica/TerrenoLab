// TerrenoLab GIS Technical Design System Tokens - Phase 0.1 Light Theme

export const tokens = {
  colors: {
    bg: {
      app: '#F8FAFC',        // Slate-50 app background
      panel: '#FFFFFF',      // White sidebar/inspector panel background
      card: '#FFFFFF',       // White cards
      input: '#F1F5F9',      // Slate-100 inputs
      hover: '#F8FAFC',      // Slate-50 hovers
    },
    border: {
      subtle: '#F1F5F9',     // Slate-100 thin borders
      default: '#E2E8F0',    // Slate-200 standard borders
      active: '#0891B2',     // Cyan-600 active border
    },
    text: {
      muted: '#94A3B8',      // Slate-400 muted text
      secondary: '#64748B',  // Slate-500 secondary headers
      primary: '#0F172A',    // Slate-900 main readable text
      accent: '#06B6D4',     // Cyan-500 action
    },
    status: {
      locked: {
        bg: '#F8FAFC',
        text: '#94A3B8',
        border: '#E2E8F0',
      },
      pending: {
        bg: '#FFFFFF',
        text: '#64748B',
        border: '#E2E8F0',
      },
      active: {
        bg: '#ECFEFF',         // Cyan-50 soft active background
        text: '#0891B2',       // Cyan-600 text
        border: '#0891B2',
      },
      complete: {
        bg: '#F0FDF4',         // Emerald-50 soft completed background
        text: '#10B981',       // Emerald-500 text
        border: '#10B981',
      },
      error: {
        bg: '#FEF2F2',         // Rose-50 soft error background
        text: '#EF4444',       // Rose-500 text
        border: '#EF4444',
      },
    },
  },
  fonts: {
    sans: 'var(--font-sans)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  spacing: {
    sidebarWidth: '220px',
    inspectorWidth: '320px',
    topbarHeight: '56px',
  },
};
