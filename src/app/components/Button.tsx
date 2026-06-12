import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg text-center font-semibold leading-tight transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2';

    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 dark:shadow-[0_1px_0_rgba(255,255,255,0.65)_inset,0_10px_28px_-16px_rgba(255,255,255,0.42)] dark:hover:bg-white',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      accent: 'bg-accent text-accent-foreground shadow-sm shadow-accent/20 hover:bg-accent/90 hover:shadow-md dark:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]',
      outline: 'border border-border bg-card text-foreground hover:bg-secondary hover:border-primary/40 dark:bg-[#0A0A0A] dark:hover:border-[#505050] dark:hover:bg-[#141414]',
      ghost: 'text-foreground hover:bg-secondary',
    };

    const sizes = {
      sm: 'min-h-10 px-3 py-2 text-[13px] sm:min-h-9 sm:py-1.5 sm:text-sm',
      md: 'min-h-11 px-4 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base',
      lg: 'min-h-11 px-4 py-2.5 text-sm sm:min-h-12 sm:px-6 sm:py-3 sm:text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
