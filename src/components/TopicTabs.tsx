'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = { href: string; label: string; icon: string; exact?: boolean };

export function TopicTabs({ tabs }: { tabs: Tab[] }) {
  const path = usePathname() || '';
  const special = tabs.filter((t) => !t.exact).map((t) => t.href);
  return (
    <nav style={{ display: 'flex', gap: 4, marginTop: 18, overflowX: 'auto' }} className="thin-scroll" aria-label="Topic sections">
      {tabs.map((t) => {
        const on = t.exact ? path === t.href || (path.startsWith(t.href + '/') && !special.some((s) => path.startsWith(s))) : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? 'page' : undefined}
            style={{
              padding: '10px 14px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '2.5px solid',
              borderColor: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', marginBottom: -1,
            }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </Link>
        );
      })}
    </nav>
  );
}
