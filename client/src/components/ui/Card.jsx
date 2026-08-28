import React from 'react';

export default function Card({
  children,
  className = '',
  title = null,
  subtitle = null,
  action = null,
  footer = null,
  hoverable = false,
  padding = 'p-5',
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-150 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-slate-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
