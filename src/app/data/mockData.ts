export type BookingStatus =
  | 'pending_request'
  | 'accepted'
  | 'rejected'
  | 'waiting_payment'
  | 'payment_review'
  | 'confirmed'
  | 'on_trip'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export const bookingStatusSteps: { code: BookingStatus; label: string; description: string }[] = [
  { code: 'pending_request', label: 'Хүсэлт илгээгдсэн', description: 'Аялагч жолоочид суудлын хүсэлт илгээсэн.' },
  { code: 'accepted', label: 'Зөвшөөрсөн', description: 'Жолооч аяллын хүсэлтийг зөвшөөрсөн.' },
  { code: 'waiting_payment', label: 'Төлбөр хүлээгдэж байна', description: 'Аялагч төлбөрийн баримтаа оруулах ёстой.' },
  { code: 'payment_review', label: 'Баримт шалгаж байна', description: 'Админ төлбөрийн баримтыг шалгаж байна.' },
  { code: 'confirmed', label: 'Баталгаажсан', description: 'Төлбөр баталгаажиж аялал баталгаатай болсон.' },
  { code: 'on_trip', label: 'Аялал эхэлсэн', description: 'Жолооч болон аялагч аяллын явцад байна.' },
  { code: 'completed', label: 'Дууссан', description: 'Аялал амжилттай дууссан, үнэлгээ өгөх боломж нээгдсэн.' },
];

export const bookings = [
  {
    id: 'BK-001',
    status: 'waiting_payment' as BookingStatus,
    ride: {
      title: '1 суудал',
      description: 'Улаанбаатараас Дархан руу явах аялагчийн захиалга. Авах цэг болон суудлын тоо жолоочтой баталгаажсан.',
      seats: 1,
      luggage: '1 жижиг цүнх',
      pickupNote: 'Баянзүрхээс 08:30-08:50 хооронд авах боломжтой.',
      dropoffNote: 'Дархан төв орчим бууна.',
    },
    cargo: {
      name: '1 суудал',
      description: 'Аяллын booking. Зөвхөн хувийн жижиг цүнх дагалдана.',
      weight: '1 жижиг цүнх',
      size: '1 суудал',
      type: 'Аялагч',
      receiverName: 'Сарангэрэл Цэцэг',
      receiverPhone: '+976 9999 9999',
    },
    route: {
      from: 'Улаанбаатар',
      fromDetail: 'Баянзүрх',
      to: 'Дархан-Уул',
      toDetail: 'Дархан',
      date: '2026-05-25',
      time: '09:00',
    },
    sender: {
      name: 'Сарангэрэл Цэцэг',
      phone: '+976 9999 9999',
      email: 'saraa@example.com',
      verified: true,
    },
    passenger: {
      name: 'Сарангэрэл Цэцэг',
      phone: '+976 9999 9999',
      email: 'saraa@example.com',
      verified: true,
    },
    traveler: {
      name: 'Бат Болд',
      phone: '+976 8888 8888',
      email: 'bat@example.com',
      rating: 4.8,
      verified: true,
      bankAccount: '1234567890',
      bankName: 'Хаан Банк',
    },
    driver: {
      name: 'Бат Болд',
      phone: '+976 8888 8888',
      email: 'bat@example.com',
      rating: 4.8,
      verified: true,
      vehicle: 'Toyota Prius',
      completedTrips: 23,
      bankAccount: '1234567890',
      bankName: 'Хаан Банк',
    },
    price: {
      agreed: 15000,
      serviceFee: 1500,
      total: 16500,
    },
    payment: {
      method: 'Банкны шилжүүлэг',
      transactionCode: 'TXN123456',
      screenshotName: 'payment_screenshot_1.jpg',
      status: 'pending',
    },
    tripCode: '123456',
    deliveryCode: '123456',
    messages: [
      {
        author: 'Сарангэрэл Цэцэг',
        body: 'Сайн байна уу? Маргааш өглөө 09:00 орчим хөдөлж болох уу?',
        time: '2 цагийн өмнө',
        own: false,
      },
      {
        author: 'Бат Болд',
        body: 'Тийм ээ, 08:40-д pickup хийж 09:00 хөдөлнө.',
        time: '1 цагийн өмнө',
        own: true,
      },
    ],
  },
  {
    id: 'BK-002',
    status: 'confirmed' as BookingStatus,
    ride: {
      title: '2 суудал',
      description: 'УБ-аас Эрдэнэт рүү явах гэр бүлийн аяллын booking.',
      seats: 2,
      luggage: '2 гар цүнх',
      pickupNote: 'Сүхбаатар талбайн ойролцоо уулзана.',
      dropoffNote: 'Эрдэнэт төвд бууна.',
    },
    cargo: {
      name: '2 суудал',
      description: 'Аяллын booking.',
      weight: '2 гар цүнх',
      size: '2 суудал',
      type: 'Аялагч',
      receiverName: 'Мөнх-Эрдэнэ',
      receiverPhone: '+976 7777 7777',
    },
    route: {
      from: 'Улаанбаатар',
      fromDetail: 'Сүхбаатар',
      to: 'Орхон',
      toDetail: 'Эрдэнэт',
      date: '2026-05-26',
      time: '14:00',
    },
    sender: {
      name: 'Мөнх-Эрдэнэ',
      phone: '+976 7777 1111',
      email: 'munkh@example.com',
      verified: true,
    },
    passenger: {
      name: 'Мөнх-Эрдэнэ',
      phone: '+976 7777 1111',
      email: 'munkh@example.com',
      verified: true,
    },
    traveler: {
      name: 'Ганбат Дорж',
      phone: '+976 8866 4400',
      email: 'ganbat@example.com',
      rating: 4.6,
      verified: true,
      bankAccount: '9876543210',
      bankName: 'Голомт Банк',
    },
    driver: {
      name: 'Ганбат Дорж',
      phone: '+976 8866 4400',
      email: 'ganbat@example.com',
      rating: 4.6,
      verified: true,
      vehicle: 'Hyundai Starex',
      completedTrips: 18,
      bankAccount: '9876543210',
      bankName: 'Голомт Банк',
    },
    price: {
      agreed: 20000,
      serviceFee: 2000,
      total: 22000,
    },
    payment: {
      method: 'QPay screenshot',
      transactionCode: 'TXN789012',
      screenshotName: 'payment_screenshot_2.jpg',
      status: 'approved',
    },
    tripCode: '654321',
    deliveryCode: '654321',
    messages: [],
  },
];

export const users = [
  {
    id: 1,
    name: 'Бат Болд',
    email: 'bat@example.com',
    phone: '+976 8888 8888',
    role: 'Жолооч',
    verified: true,
    completedTrips: 23,
    status: 'active',
  },
  {
    id: 2,
    name: 'Дорж Цэцэг',
    email: 'dorj@example.com',
    phone: '+976 9999 9999',
    role: 'Аялагч',
    verified: true,
    completedTrips: 8,
    status: 'active',
  },
  {
    id: 3,
    name: 'Мөнх-Эрдэнэ',
    email: 'munkh@example.com',
    phone: '+976 9090 9090',
    role: 'Аялагч',
    verified: false,
    completedTrips: 0,
    status: 'pending_verification',
  },
];

export const reports = [
  {
    id: 'RP-001',
    reportedBy: 'Дорж Цэцэг',
    reportedUser: 'Бат Болд',
    bookingId: 'BK-001',
    reason: 'Хоцорч ирсэн',
    status: 'pending',
    date: '2026-05-26',
  },
];

export function getBooking(id?: string) {
  return bookings.find((booking) => booking.id === id) ?? bookings[0];
}

export function getStatusIndex(status: BookingStatus) {
  return bookingStatusSteps.findIndex((step) => step.code === status);
}
