import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed border rounded-md font-mono text-xs uppercase tracking-wider select-none';
  
  const variants = {
    primary: 'bg-[#06B6D4] hover:bg-[#0891B2] border-[#0891B2] text-white font-semibold',
    secondary: 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]',
    success: 'bg-[#10B981] hover:bg-[#059669] border-[#10B981] text-white',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] border-[#EF4444] text-white',
    ghost: 'bg-transparent border-transparent hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-[10px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-3 text-sm',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
