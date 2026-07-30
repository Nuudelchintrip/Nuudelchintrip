import type { ReactNode } from 'react';
import { Card } from './Card';

type Accent = 'primary' | 'success' | 'warning' | 'danger';

const accentClasses: Record<Accent, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'primary',
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold leading-none text-foreground">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
