import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
  const interactiveProps = onClick
    ? {
        role: 'button',
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div
      className={`rounded-lg border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_3px_12px_-8px_rgba(15,23,42,0.1)] ${hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-10px_rgba(15,23,42,0.18)]' : ''} ${className}`}
      onClick={onClick}
      style={style}
      {...interactiveProps}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-3.5 pb-2.5 sm:p-6 sm:pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-3.5 pt-0 sm:p-6 sm:pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-t border-border p-3.5 pt-2.5 sm:p-6 sm:pt-4 ${className}`}>
      {children}
    </div>
  );
}
