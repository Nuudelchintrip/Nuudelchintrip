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
    <div className={`grid gap-3 sm:gap-4 md:grid-cols-2 ${className}`}>
      <Select
        label={`${label} аймаг/хот`}
        value={aimag}
        onChange={(event) => {
          onAimagChange(event.target.value);
          onSoumChange('');
        }}
        options={aimagOptions}
      />
      <Select
        label={`${label} сум/дүүрэг`}
        value={soum}
        onChange={(event) => onSoumChange(event.target.value)}
        options={getSoumOptions(aimag)}
        disabled={!aimag}
      />
    </div>
  );
}
