import { Logo } from './Logo';

const footerGroups = [
  {
    title: 'Платформ',
    links: [
      { href: '/how-it-works', label: 'Хэрхэн ажилладаг' },
      { href: '/pricing', label: 'Үнэ ба үйлчилгээний шимтгэл' },
    ],
  },
  {
    title: 'Итгэлцэл',
    links: [
      { href: '/safety', label: 'Аюулгүй байдал' },
      { href: '/faq', label: 'Түгээмэл асуулт' },
      { href: '/support', label: 'Тусламж' },
    ],
  },
  {
    title: 'Хууль',
    links: [
      { href: '/terms', label: 'Үйлчилгээний нөхцөл' },
      { href: '/privacy', label: 'Нууцлалын бодлого' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card sm:mt-20">
      <div className="mx-auto max-w-7xl px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-7 sm:gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <Logo size="sm" className="mb-3 sm:mb-4" />
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Орон нутгийн аялагчийг сул суудалтай жолоочтой холбох унаа хуваалцах платформ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 sm:gap-8">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-3 text-sm font-semibold text-foreground sm:mb-4 sm:text-base">{group.title}</h2>
                <ul className="space-y-1.5 sm:space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-4 text-base font-semibold text-foreground">Холбоо барих</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>И-мэйл: contact@nuudelchintrip.com</li>
              <li>Тусламж: /support</li>
              <li>Асуудал гарвал тусламжийн хүсэлт илгээнэ үү.</li>
            </ul>
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-10 sm:pt-6 sm:text-sm">
          <p>© 2026 NuudelchinTrip. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}

export function AppFooter() {
  return (
    // mt-auto — агуулга богино үед хуудсын доод талд наалдаж, дунд нь хөвөхгүй.
    // Дээд зай нь padding тул агуулга урт үед ч наалдахгүй.
    <footer className="mt-auto pt-8 sm:pt-10">
      <div className="border-t border-border pt-5 sm:pt-6">
        <div className="flex flex-col gap-3 text-xs leading-5 text-muted-foreground sm:text-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold text-foreground">NuudelchinTrip</p>
            <p className="mt-1">Аялагч, жолооч болон чиглэл дээр суурилсан дайвар ачааг холбох платформ.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-5">
            <a href="/how-it-works" className="hover:text-primary">Хэрхэн ажилладаг</a>
            <a href="/safety" className="hover:text-primary">Аюулгүй байдал</a>
            <a href="/support" className="hover:text-primary">Тусламж</a>
            <a href="/terms" className="hover:text-primary">Үйлчилгээний нөхцөл</a>
          </div>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">© 2026 NuudelchinTrip. Бүх эрх хуулиар хамгаалагдсан.</p>
      </div>
    </footer>
  );
}
