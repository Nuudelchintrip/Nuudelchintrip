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
      className={`bg-card border border-border/70 rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.08)] ${hover ? 'hover:shadow-[0_8px_28px_-10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''} ${className}`}
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
    <div className={`p-4 pb-3 sm:p-6 sm:pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-4 pt-0 sm:p-6 sm:pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-t border-border p-4 pt-3 sm:p-6 sm:pt-4 ${className}`}>
      {children}
    </div>
  );
}
