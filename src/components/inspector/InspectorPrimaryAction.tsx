import React from 'react';
import { Button } from '../ui/Button';

interface InspectorPrimaryActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function InspectorPrimaryAction({
  label,
  onClick,
  disabled = false,
  icon,
  title,
  variant = 'primary'
}: InspectorPrimaryActionProps) {
  return (
    <div className="pt-2 shrink-0">
      <Button
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="w-full justify-center py-2.5 font-semibold shadow-sm text-[13px] flex items-center"
      >
        {icon && <span className="mr-1.5 shrink-0 flex items-center">{icon}</span>}
        <span>{label}</span>
      </Button>
    </div>
  );
}
