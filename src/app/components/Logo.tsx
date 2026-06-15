import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes: Record<LogoSize, { mark: string; text: string }> = {
  sm: { mark: 'h-8', text: 'text-base sm:text-lg' },
  md: { mark: 'h-10 sm:h-11', text: 'text-lg sm:text-xl' },
  lg: { mark: 'h-14 sm:h-16', text: 'text-2xl sm:text-3xl' },
};

// Crop just the N mark out of the full logo artwork (mark sits in the top band).
const crop = {
  backgroundSize: '220% auto',
  backgroundPosition: '50% 12%',
  backgroundRepeat: 'no-repeat',
  aspectRatio: '1.2 / 1',
} as const;

const poppins = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="NuudelchinTrip">
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
          className={cn('whitespace-nowrap font-extrabold tracking-tight', s.text, textClassName)}
          style={poppins}
        >
          <span className="text-foreground">Nuudelchin</span>
          <span className="text-[#F2921C]">Trip</span>
        </span>
      ) : null}
    </span>
  );
}
