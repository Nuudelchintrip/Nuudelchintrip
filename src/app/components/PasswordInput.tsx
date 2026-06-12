import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function PasswordInput({ label, error, className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const actionLabel = visible ? 'Нууц үг нуух' : 'Нууц үг харах';

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        label={label}
        error={error}
        className={`pr-12 ${className}`}
      />
      <button
        type="button"
        aria-label={actionLabel}
        title={actionLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute bottom-0 right-0 inline-flex h-11 w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
