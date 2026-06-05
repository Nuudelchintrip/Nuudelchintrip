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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <span className="text-sm font-medium text-primary">{selectedSeats.length} сонгосон</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const rowSeats = seatOptions.filter((seat) => seat.row === row);
          return (
            <div key={row} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    className={[
                      'flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
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
                      <span className={isSelected ? 'block text-xs text-primary-foreground/80' : 'block text-xs text-muted-foreground'}>
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
