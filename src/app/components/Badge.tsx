import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    default: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
