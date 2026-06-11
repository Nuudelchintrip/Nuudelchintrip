import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-[13px] font-medium text-foreground sm:mb-2 sm:text-sm">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`min-h-11 w-full rounded-lg border border-input bg-input-background px-3.5 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring sm:px-4 sm:py-2.5 ${error ? 'border-destructive focus:ring-destructive' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs leading-5 text-destructive sm:text-sm">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
