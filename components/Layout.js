import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Building2, Bell } from 'lucide-react';

export default function Layout({ children }) {
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetch('/api/alertes')
      .then(r => r.json())
      .then(data => {
        const count = (data.retards?.length || 0) + (data.bloques?.length || 0) + (data.chantiers_bloques?.length || 0);
        setAlertCount(count);
      })
      .catch(() => {});
  }, [router.pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Chantiers', icon: Home },
    { href: '/entreprises', label: 'Entreprises', icon: Building2 },
    { href: '/relances', label: 'Relances', icon: Bell, badge: alertCount },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-50)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid var(--gray-200)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Home size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--gray-900)', letterSpacing: '0.5px' }}>
              SITE COMMANDER
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '-2px' }}>APHP Paris</div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = router.pathname === href || router.pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '8px', position: 'relative',
                  background: active ? 'var(--blue-light)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--gray-500)',
                  fontWeight: active ? 600 : 400,
                  fontSize: '14px',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}>
                  <Icon size={15} />
                  {label}
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: '2px', right: '4px',
                      background: 'var(--red)', color: '#fff',
                      borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                      padding: '1px 5px', minWidth: '16px', textAlign: 'center',
                      lineHeight: '14px'
                    }}>{badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </header>

      <main style={{ flex: 1, padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
