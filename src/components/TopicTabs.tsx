'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = { href: string; label: string; icon: string; exact?: boolean };

export function TopicTabs({ tabs }: { tabs: Tab[] }) {
  const path = usePathname() || '';
  const special = tabs.filter((t) => !t.exact).map((t) => t.href);
  return (
    <nav style={{ display: 'flex', gap: 6, margin: '18px 0 0', padding: '0 0 14px', overflowX: 'auto' }} className="thin-scroll" aria-label="Topic sections">
      {tabs.map((t) => {
        const on = t.exact ? path === t.href || (path.startsWith(t.href + '/') && !special.some((s) => path.startsWith(s))) : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? 'page' : undefined} className="tab-pill">
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </Link>
        );
      })}
    </nav>
  );
}
