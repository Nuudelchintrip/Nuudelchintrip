import { Armchair } from 'lucide-react';
import { getSeatLabel, seatOptions } from '../data/seats';

interface SeatPickerProps {
  label?: string;
  description?: string;
  selectedSeats: string[];
  onChange: (seats: string[]) => void;
  availableSeats?: string[];
  maxSelectable?: number;
  disabled?: boolean;
  mode?: 'driver' | 'traveler';
}

export function SeatPicker({
  label = 'Суудал сонгох',
  description,
  selectedSeats,
  onChange,
  availableSeats,
  maxSelectable,
  disabled = false,
  mode = 'traveler',
}: SeatPickerProps) {
  const availableSet = new Set(availableSeats || seatOptions.map((seat) => seat.id));

  const toggleSeat = (seatId: string) => {
    if (disabled || !availableSet.has(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      onChange(selectedSeats.filter((seat) => seat !== seatId));
      return;
    }

    if (maxSelectable && selectedSeats.length >= maxSelectable) return;
    onChange([...selectedSeats, seatId]);
  };

  const rows = ['front', 'rear', 'extra'] as const;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 sm:rounded-xl sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description ? <p className="mt-0.5 hidden text-xs leading-5 text-muted-foreground sm:mt-1 sm:block sm:text-sm sm:leading-6">{description}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:bg-transparent sm:px-0 sm:text-sm">{selectedSeats.length} сонгосон</span>
      </div>

      <div className="mt-2.5 space-y-1.5 sm:mt-4 sm:space-y-3">
        {rows.map((row) => {
          const rowSeats = seatOptions.filter((seat) => seat.row === row);
          return (
            <div key={row} className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {rowSeats.map((seat) => {
                const isAvailable = availableSet.has(seat.id);
                const isSelected = selectedSeats.includes(seat.id);
                const isDisabled = disabled || !isAvailable;

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleSeat(seat.id)}
                    title={isAvailable ? seat.label : `${seat.label} · Захиалагдсан`}
                    className={[
                      'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-center text-[11px] leading-tight transition sm:min-h-14 sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-left sm:text-sm',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5',
                      isDisabled && !isSelected ? 'cursor-not-allowed opacity-40 hover:border-border hover:bg-background' : '',
                    ].join(' ')}
                    aria-pressed={isSelected}
                  >
                    <Armchair className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium">{seat.shortLabel}</span>
                      <span className={`hidden sm:block sm:text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {isAvailable ? (mode === 'driver' ? 'Сул болгож нийтэлнэ' : 'Сул') : 'Захиалагдсан'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {selectedSeats.length > 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Сонгосон: <span className="font-medium text-foreground">{selectedSeats.map(getSeatLabel).join(', ')}</span>
        </p>
      ) : null}
    </div>
  );
}
