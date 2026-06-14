import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes: Record<LogoSize, { mark: string; text: string }> = {
  sm: { mark: 'h-9 w-9', text: 'text-base sm:text-lg' },
  md: { mark: 'h-11 w-11 sm:h-12 sm:w-12', text: 'text-xl sm:text-2xl' },
  lg: { mark: 'h-14 w-14 sm:h-16 sm:w-16', text: 'text-2xl sm:text-3xl' },
};

// Crop just the "N" mark out of the full logo artwork.
const markCrop = { backgroundSize: '320%', backgroundPosition: '50% 26%' } as const;

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)} aria-label="NuudelchinTrip">
      {/* Light theme mark */}
      <span
        className={cn('shrink-0 rounded-xl bg-no-repeat shadow-sm dark:hidden', s.mark)}
        style={{ backgroundImage: 'url(/logo-light.jpg)', ...markCrop }}
      />
      {/* Dark theme mark */}
      <span
        className={cn('hidden shrink-0 rounded-xl bg-no-repeat shadow-sm dark:block', s.mark)}
        style={{ backgroundImage: 'url(/logo-dark.jpg)', ...markCrop }}
      />

      {showText ? (
        <span
          className={cn('truncate font-extrabold tracking-tight', s.text, textClassName)}
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <span className="text-foreground">Nuudelchin</span>
          <span className="text-[#F2921C]">Trip</span>
        </span>
      ) : null}
    </span>
  );
}
