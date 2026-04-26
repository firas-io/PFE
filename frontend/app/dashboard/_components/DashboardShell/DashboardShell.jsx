'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconChartBar,
  IconCalendarStats,
  IconCheck,
  IconClock,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMoon,
  IconSun,
  IconMessageCircle,
  IconUser,
  IconShieldLock,
  IconBell,
  IconSearch,
  IconSettings,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { clearAuth, getRefreshToken, getUser } from '@/lib/auth';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { canAccessAdminShell } from '@/src/utils/permissions';
import { API_BASE } from '@/lib/api';
import '../../../admin/admin-layout.css';

const NAV_LINKS = [
  { href: '/dashboard/home',      icon: IconHome,          label: 'Tableau de bord', exact: true },
  { href: '/dashboard/habits',    icon: IconCheck,         label: 'Habitudes' },
  { href: '/dashboard/analytics', icon: IconChartBar,      label: 'Analytiques' },
  { href: '/dashboard/history',   icon: IconClock,         label: 'Historique' },
  { href: '/dashboard/calendar',  icon: IconCalendarStats, label: 'Calendrier' },
  { href: '/dashboard/progress',  icon: IconUser,          label: 'Mon avancement' },
  { href: '/dashboard/tickets',   icon: IconMessageCircle, label: 'Tickets' },
];

const MOBILE_NAV = [
  { href: '/dashboard/home',      label: 'Today',     icon: IconHome },
  { href: '/dashboard/habits',    label: 'Habitudes', icon: IconCheck },
  { href: '/dashboard/calendar',  label: 'Calendrier',icon: IconCalendarStats },
  { href: '/dashboard/analytics', label: 'Insights',  icon: IconChartBar },
  { href: '/dashboard/progress',  label: 'Profil',    icon: IconUser },
];

export const DashboardShell = ({ children }) => {
  const pathname  = usePathname();
  const router    = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [user,        setUser]        = useState(null);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    setUser(getUser());
    const saved = window.localStorage.getItem('habitflow_dark_mode');
    if (saved === 'true') setDarkMode(true);
    setMounted(true);
    // On mobile: sidebar closed by default
    if (window.innerWidth < 769) setSidebarOpen(false);
  }, []);

  const logout = async () => {
    const rt = getRefreshToken();
    if (rt) {
      fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {});
    }
    clearAuth();
    router.push('/login');
  };

  const toggleDark = () => {
    setDarkMode((v) => {
      window.localStorage.setItem('habitflow_dark_mode', String(!v));
      return !v;
    });
  };

  const isActive = (link) => {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  };

  const initials = mounted && user
    ? ((userFirstName(user)?.[0] ?? '') + (userLastName(user)?.[0] ?? '')).toUpperCase() || '?'
    : '';

  const displayName = mounted
    ? [userFirstName(user), userLastName(user)].filter(Boolean).join(' ') || user?.email || 'Utilisateur'
    : '';

  return (
    <div className={[
      'user-shell',
      sidebarOpen ? '' : 'user-shell--sidebar-collapsed',
      darkMode    ? 'user-shell--dark' : '',
    ].filter(Boolean).join(' ')}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="user-sidebar">
        {/* Brand */}
        <div className="user-brand">
          <div className="user-brand-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M8 16.5C8 12.5 11 9 16 9C21 9 24 12.5 24 16.5C24 20.5 21 23 16 23" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M16 23C13.5 23 12 21 12 18.5C12 16 13.5 14 16 14C18.5 14 20 16 20 18.5" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <circle cx="16" cy="18.5" r="2" fill="white"/>
            </svg>
          </div>
          <div className="user-brand-text">
            <div className="user-brand-title">HabitFlow</div>
            <div className="user-brand-subtitle">Enterprise Edition</div>
          </div>
        </div>

        {/* Nav section */}
        <div className="user-nav-section">Navigation</div>

        <nav className="user-nav" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`user-nav-link${isActive(link) ? ' active' : ''}`}
              onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}
            >
              <link.icon size={18} stroke={1.75}/>
              <span>{link.label}</span>
            </Link>
          ))}

          {mounted && user && canAccessAdminShell(user) && (
            <Link
              href={user.role === 'manager' ? '/admin/my-users' : '/admin'}
              className={`user-nav-link${pathname.startsWith('/admin') ? ' active' : ''}`}
              onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}
            >
              <IconShieldLock size={18} stroke={1.75}/>
              <span>{user.role === 'manager' ? 'Équipe' : 'Administration'}</span>
            </Link>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="user-sidebar-footer">
          <Link href="/dashboard/home" className="user-nav-link">
            <IconSettings size={18} stroke={1.75}/>
            <span>Paramètres</span>
          </Link>
          <button
            type="button"
            className="user-nav-link"
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--hf-text-muted)' }}
          >
            <IconLogout size={18} stroke={1.75}/>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.3)',
          }}
          className="sidebar-overlay"
        />
      )}

      {/* ── Main ────────────────────────────────────────────── */}
      <section className="user-main">
        {/* Topbar */}
        <header className="user-topbar">
          <div className="user-topbar-start">
            {/* Toggle sidebar */}
            <button
              type="button"
              className="user-sidebar-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {sidebarOpen
                ? <IconLayoutSidebarLeftCollapse size={20} stroke={1.75}/>
                : <IconLayoutSidebarLeftExpand  size={20} stroke={1.75}/>}
            </button>

            {/* Search */}
            <div className="topbar-search">
              <IconSearch size={15} stroke={1.75} style={{ flexShrink: 0 }}/>
              <input
                type="text"
                placeholder="Rechercher des habitudes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="user-topbar-user">
            {/* Dark mode */}
            <button
              type="button"
              className="user-theme-toggle"
              onClick={toggleDark}
              aria-pressed={darkMode}
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? <IconSun size={15} stroke={1.9}/> : <IconMoon size={15} stroke={1.9}/>}
              <span suppressHydrationWarning>{darkMode ? 'Clair' : 'Sombre'}</span>
            </button>

            {/* Bell */}
            <button type="button" className="topbar-icon-btn" title="Notifications">
              <IconBell size={18} stroke={1.75}/>
            </button>

            {/* Avatar */}
            <div className="user-avatar" suppressHydrationWarning title={displayName}>
              {initials}
            </div>

            {/* Logout desktop */}
            <button
              type="button"
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10,
                border: '1px solid var(--hf-border)',
                background: 'transparent', color: 'var(--hf-text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <IconLogout size={14} stroke={1.75}/>
              <span className="hide-mobile">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="user-content">
          {children}
        </main>
      </section>

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
        <div className="mobile-bottom-nav-inner">
          {MOBILE_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-item${isActive(link) ? ' active' : ''}`}
            >
              <link.icon size={22} stroke={isActive(link) ? 2 : 1.75}/>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
          .hide-mobile { display: none; }
          .topbar-search { max-width: 160px; }
        }
      `}</style>
    </div>
  );
};
