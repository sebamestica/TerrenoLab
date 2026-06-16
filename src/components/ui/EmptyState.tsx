import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#1f2d48] rounded-lg text-center bg-[#090d16]/30">
      {icon && <div className="text-slate-600 mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
