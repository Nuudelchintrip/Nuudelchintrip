import { MapPin } from 'lucide-react';
import { Select } from './Select';
import { aimagOptions, getSoumOptions } from '../data/locations';

interface LocationSelectGroupProps {
  label: string;
  aimag: string;
  soum: string;
  onAimagChange: (value: string) => void;
  onSoumChange: (value: string) => void;
  className?: string;
}

export function LocationSelectGroup({
  label,
  aimag,
  soum,
  onAimagChange,
  onSoumChange,
  className = '',
}: LocationSelectGroupProps) {
  return (
    <div className={`rounded-lg border border-border bg-muted/20 p-2 sm:p-2.5 ${className}`}>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground sm:text-[13px]">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Select
          aria-label={`${label} аймаг/хот`}
          className="px-2.5 pr-8 text-sm sm:px-3 sm:pr-9"
          value={aimag}
          onChange={(event) => {
            onAimagChange(event.target.value);
            onSoumChange('');
          }}
          options={aimagOptions}
        />
        <Select
          aria-label={`${label} сум/дүүрэг`}
          className="px-2.5 pr-8 text-sm sm:px-3 sm:pr-9"
          value={soum}
          onChange={(event) => onSoumChange(event.target.value)}
          options={getSoumOptions(aimag)}
          disabled={!aimag}
        />
      </div>
    </div>
  );
}
