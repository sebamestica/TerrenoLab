import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-md shadow-sm flex flex-col overflow-hidden text-[#0F172A] ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            {title && (
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0F172A]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] text-[#64748B] font-mono mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-4 flex-1">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/50">
          {footer}
        </div>
      )}
    </div>
  );
}
