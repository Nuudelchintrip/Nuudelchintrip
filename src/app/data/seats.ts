export type SeatOption = {
  id: string;
  label: string;
  shortLabel: string;
  row: 'front' | 'rear' | 'extra';
};

export const seatOptions: SeatOption[] = [
  { id: 'front_passenger', label: 'Урд зорчигчийн суудал', shortLabel: 'Урд', row: 'front' },
  { id: 'rear_left', label: 'Арын зүүн суудал', shortLabel: 'Арын зүүн', row: 'rear' },
  { id: 'rear_middle', label: 'Арын гол суудал', shortLabel: 'Арын гол', row: 'rear' },
  { id: 'rear_right', label: 'Арын баруун суудал', shortLabel: 'Арын баруун', row: 'rear' },
  { id: 'third_left', label: 'Гурав дахь эгнээ зүүн', shortLabel: '3-р зүүн', row: 'extra' },
  { id: 'third_right', label: 'Гурав дахь эгнээ баруун', shortLabel: '3-р баруун', row: 'extra' },
];

const seatLabelById = new Map(seatOptions.map((seat) => [seat.id, seat.label]));

export function getSeatLabel(seatId: string) {
  return seatLabelById.get(seatId) || seatId;
}

export function getDefaultSeatIds(count: number) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(count, seatOptions.length)) : 0;
  return seatOptions.slice(0, safeCount).map((seat) => seat.id);
}

export function normalizeSeatIds(seats: string[] | null | undefined, fallbackCount = 0) {
  const validIds = new Set(seatOptions.map((seat) => seat.id));
  const uniqueSeats = (seats || []).filter((seat, index, array) => validIds.has(seat) && array.indexOf(seat) === index);
  return uniqueSeats.length ? uniqueSeats : getDefaultSeatIds(fallbackCount);
}

export function formatSeatList(seats: string[] | null | undefined) {
  const normalized = normalizeSeatIds(seats);
  return normalized.length ? normalized.map(getSeatLabel).join(', ') : 'Суудал сонгоогүй';
}
