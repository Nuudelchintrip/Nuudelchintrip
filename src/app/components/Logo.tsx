import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes: Record<LogoSize, { mark: string; text: string }> = {
  sm: { mark: 'h-10', text: 'text-base sm:text-lg' },
  md: { mark: 'h-12 sm:h-14', text: 'text-xl sm:text-2xl' },
  lg: { mark: 'h-16 sm:h-20', text: 'text-2xl sm:text-3xl' },
};

// Crop just the N mark out of the full logo artwork (mark sits in the top band).
const crop = {
  backgroundSize: '230% auto',
  backgroundPosition: '50% 11%',
  backgroundRepeat: 'no-repeat',
  aspectRatio: '1.3 / 1',
} as const;

const poppins = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)} aria-label="NuudelchinTrip">
      {/* N mark — cropped from the theme artwork */}
      <span
        className={cn('block shrink-0 dark:hidden', s.mark)}
        style={{ backgroundImage: 'url(/logo-light.png)', ...crop }}
      />
      <span
        className={cn('hidden shrink-0 dark:block', s.mark)}
        style={{ backgroundImage: 'url(/logo-dark.png)', ...crop }}
      />

      {showText ? (
        <span
          className={cn('truncate font-extrabold tracking-tight', s.text, textClassName)}
          style={poppins}
        >
          <span className="text-foreground">Nuudelchin</span>
          <span className="text-[#F2921C]">Trip</span>
        </span>
      ) : null}
    </span>
  );
}
