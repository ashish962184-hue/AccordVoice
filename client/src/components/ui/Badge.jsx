import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // neutral, primary, success, warning, danger, purple, info
  size = 'md', // sm, md
  icon = null,
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantClasses = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function StatusBadge({ state, size = 'md' }) {
  const configMap = {
    LISTENING: { label: 'Listening', icon: '🎙️', variant: 'neutral' },
    ANALYZING: { label: 'Analyzing', icon: '◌', variant: 'info' },
    UNDERSTANDING: { label: 'Understood', icon: '💬', variant: 'primary' },
    CONFLICT_DETECTED: { label: 'Conflict Detected', icon: '⚠️', variant: 'danger' },
    CLARIFICATION_REQUIRED: { label: 'Clarification Needed', icon: '❓', variant: 'warning' },
    AGREEMENT_DRAFTED: { label: 'Agreement Drafted', icon: '📋', variant: 'info' },
    AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', icon: '⏳', variant: 'warning' },
    PARTIALLY_CONFIRMED: { label: '1 of 2 Confirmed', icon: '⌛', variant: 'warning' },
    VERIFIED: { label: 'Agreement Verified', icon: '✅', variant: 'success' },
    REJECTED: { label: 'Changes Requested', icon: '❌', variant: 'danger' },
  };

  const config = configMap[state] || { label: state || 'Unknown', icon: '●', variant: 'neutral' };

  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </Badge>
  );
}

export default Badge;
