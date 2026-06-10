// Shared passenger-booking status helpers (labels + badge variants) used across
// the traveler dashboard, my-trips list, and booking detail surfaces.

export function getRequestStatusLabel(status: string) {
  if (status === 'pending_request') return 'Хүсэлт илгээсэн';
  if (status === 'accepted') return 'Зөвшөөрсөн';
  if (status === 'rejected') return 'Татгалзсан';
  if (status === 'waiting_payment') return 'Төлбөр хүлээгдэж байна';
  if (status === 'payment_review') return 'Төлбөр шалгаж байна';
  if (status === 'confirmed') return 'Баталгаажсан';
  if (status === 'on_trip') return 'Аялал эхэлсэн';
  if (status === 'completed') return 'Дууссан';
  if (status === 'cancelled') return 'Цуцлагдсан';
  if (status === 'disputed') return 'Маргаан шалгаж байна';
  return 'Хүлээгдэж байна';
}

export function getCargoStatusLabel(status: string) {
  if (status === 'cargo_requested') return 'Хүсэлт илгээсэн';
  if (status === 'cargo_accepted') return 'Зөвшөөрсөн';
  if (status === 'rejected') return 'Татгалзсан';
  if (status === 'waiting_payment') return 'Төлбөр хүлээгдэж байна';
  if (status === 'payment_review') return 'Төлбөр шалгаж байна';
  if (status === 'picked_up') return 'Ачаа авсан';
  if (status === 'in_transit') return 'Тээвэрлэгдэж байна';
  if (status === 'delivered') return 'Хүргэгдсэн';
  if (status === 'completed') return 'Дууссан';
  if (status === 'cancelled') return 'Цуцлагдсан';
  if (status === 'disputed') return 'Маргаан шалгаж байна';
  return 'Хүлээгдэж байна';
}

export function getBookingBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'confirmed' || status === 'on_trip' || status === 'completed') return 'success';
  if (status === 'rejected' || status === 'cancelled' || status === 'disputed') return 'danger';
  if (status === 'waiting_payment' || status === 'payment_review') return 'warning';
  if (status === 'accepted') return 'info';
  return 'default';
}
