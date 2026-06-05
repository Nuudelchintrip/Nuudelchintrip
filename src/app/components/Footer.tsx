const footerGroups = [
  {
    title: 'Платформ',
    links: [
      { href: '/how-it-works', label: 'Хэрхэн ажилладаг' },
      { href: '/pricing', label: 'Үнэ ба үйлчилгээний шимтгэл' },
      { href: '/routes', label: 'Чиглэл хайх' },
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
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">NuudelchinTrip</span>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Орон нутгийн аялагчийг сул суудалтай жолоочтой холбох унаа хуваалцах платформ.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-4 text-base font-semibold text-foreground">{group.title}</h2>
                <ul className="space-y-2">
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

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>© 2026 NuudelchinTrip. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-10 border-t border-border pt-6">
      <div className="flex flex-col gap-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-foreground">NuudelchinTrip</p>
          <p className="mt-1">Аялагч, жолооч болон чиглэл дээр суурилсан дайвар ачааг холбох платформ.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/how-it-works" className="hover:text-primary">Хэрхэн ажилладаг</a>
          <a href="/safety" className="hover:text-primary">Аюулгүй байдал</a>
          <a href="/support" className="hover:text-primary">Тусламж</a>
          <a href="/terms" className="hover:text-primary">Үйлчилгээний нөхцөл</a>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">© 2026 NuudelchinTrip. Бүх эрх хуулиар хамгаалагдсан.</p>
    </footer>
  );
}
