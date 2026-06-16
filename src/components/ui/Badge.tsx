import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const styles = {
    info: 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2]',
    success: 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]',
    warning: 'bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]',
    danger: 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]',
    neutral: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
}
