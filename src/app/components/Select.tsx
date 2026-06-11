import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-[13px] font-medium text-foreground sm:mb-2 sm:text-sm">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`min-h-11 w-full appearance-none rounded-lg border border-input bg-input-background px-3.5 py-2 pr-10 text-base text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring sm:px-4 sm:py-2.5 sm:pr-11 ${error ? 'border-destructive focus:ring-destructive' : ''} ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:right-4 sm:h-5 sm:w-5" />
        </div>
        {error && (
          <p className="mt-1.5 text-xs leading-5 text-destructive sm:text-sm">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
