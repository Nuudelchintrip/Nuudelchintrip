import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes: Record<LogoSize, { mark: string; markText: string; text: string }> = {
  sm: { mark: 'h-8 w-8', markText: 'text-lg', text: 'text-base sm:text-lg' },
  md: { mark: 'h-10 w-10 sm:h-11 sm:w-11', markText: 'text-xl sm:text-2xl', text: 'text-xl sm:text-2xl' },
  lg: { mark: 'h-12 w-12 sm:h-14 sm:w-14', markText: 'text-2xl sm:text-3xl', text: 'text-2xl sm:text-3xl' },
};

const poppins = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)} aria-label="NuudelchinTrip">
      {/* N mark — theme-token tile so it blends in both light and true-black dark */}
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-border',
          s.mark,
        )}
      >
        <span className={cn('font-extrabold leading-none text-[#F2921C]', s.markText)} style={poppins}>
          N
        </span>
      </span>

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
