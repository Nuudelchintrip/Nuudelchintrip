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
    <div className={`rounded-lg border border-border bg-muted/20 p-2.5 sm:p-3 ${className}`}>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {label}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          aria-label={`${label} аймаг/хот`}
          value={aimag}
          onChange={(event) => {
            onAimagChange(event.target.value);
            onSoumChange('');
          }}
          options={aimagOptions}
        />
        <Select
          aria-label={`${label} сум/дүүрэг`}
          value={soum}
          onChange={(event) => onSoumChange(event.target.value)}
          options={getSoumOptions(aimag)}
          disabled={!aimag}
        />
      </div>
    </div>
  );
}
