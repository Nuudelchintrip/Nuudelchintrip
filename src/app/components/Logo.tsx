import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeClasses: Record<LogoSize, { mark: string; text: string; route: string }> = {
  sm: {
    mark: 'h-9 w-9',
    text: 'text-[15px]',
    route: 'h-4 w-4',
  },
  md: {
    mark: 'h-10 w-10',
    text: 'text-xl',
    route: 'h-5 w-5',
  },
  lg: {
    mark: 'h-11 w-11',
    text: 'text-2xl',
    route: 'h-5 w-5',
  },
};

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const sizes = sizeClasses[size];

  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)} aria-label="NuudelchinTrip">
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm',
          sizes.mark,
        )}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,0.38),transparent_30%)]" />
        <svg
          aria-hidden="true"
          className={cn('relative z-10', sizes.route)}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 17.5C8.8 16.8 8.2 7.2 12 6.5c3.7-.7 3.2 9 7 8.2"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle cx="5" cy="17.5" r="2.2" fill="#F59E0B" stroke="white" strokeWidth="1.4" />
          <circle cx="19" cy="14.7" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </span>

      {showText ? (
        <span className={cn('truncate font-bold tracking-tight text-foreground', sizes.text, textClassName)}>
          NuudelchinTrip
        </span>
      ) : null}
    </span>
  );
}
