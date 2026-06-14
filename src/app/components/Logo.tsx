import { cn } from './ui/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const heightClasses: Record<LogoSize, string> = {
  sm: 'h-9 sm:h-10',
  md: 'h-11 sm:h-12',
  lg: 'h-16 sm:h-20',
};

export function Logo({ size = 'md', className }: LogoProps) {
  const h = heightClasses[size];

  return (
    <span className={cn('flex min-w-0 items-center', className)} aria-label="NuudelchinTrip">
      {/* Light theme logo */}
      <img
        src="/logo-light.png"
        alt="NuudelchinTrip"
        className={cn('w-auto object-contain dark:hidden', h)}
      />
      {/* Dark theme logo */}
      <img
        src="/logo-dark.png"
        alt="NuudelchinTrip"
        className={cn('hidden w-auto object-contain dark:block', h)}
      />
    </span>
  );
}
