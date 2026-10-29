import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export default function Badge({
  children,
  variant = 'primary',
  className = '',
}: BadgeProps) {
  const styles = {
    primary: 'bg-surface-card text-ink border border-hairline',
    secondary: 'bg-badge-pink/10 text-badge-pink border border-badge-pink/20',
    success: 'bg-badge-emerald/10 text-badge-emerald border border-badge-emerald/20',
    warning: 'bg-badge-orange/10 text-badge-orange border border-badge-orange/20',
    danger: 'bg-error/10 text-error border border-error/20',
    info: 'bg-badge-violet/10 text-badge-violet border border-badge-violet/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
