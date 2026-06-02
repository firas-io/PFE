'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconCalendarOff,
  IconCalendarStats,
  IconChartBar,
  IconCheck,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconListDetails,
  IconLogout,
  IconMessageCircle,
  IconMoon,
  IconNotes,
  IconProgress,
  IconReportAnalytics,
  IconShieldCheck,
  IconShieldLock,
  IconSun,
  IconTag,
  IconTicket,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconSettings,
} from '@tabler/icons-react';
import { clearAuth, getUser, setUser as storeUser } from '@/lib/auth';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import {
  canAccessAdminShell,
  canViewHabits,
  canManageHabits,
  canViewStats,
  canViewLogs,
  canViewProgress,
  canManageManagersCrud,
  canViewUsers,
  canManageCategoryTickets,
  canManageOffDays,
  canViewOffDays,
  canViewRoles,
  canViewCategories,
} from '@/src/utils/permissions';
import { apiFetch, API_BASE } from '@/lib/api';

const ALL_NAV_LINKS = [
  { href: '/dashboard/home',      icon: IconHome,              label: 'Tableau de bord', exact: true,  always: true  },
  { href: '/dashboard/habits',    icon: IconCheck,             label: 'Habitudes',       always: false, permFn: canViewHabits },
  { href: '/dashboard/stats',     icon: IconReportAnalytics,   label: 'Statistiques',    always: false, permFn: canViewStats  },
  { href: '/dashboard/calendar',  icon: IconCalendarStats,     label: 'Calendrier',      always: false, permFn: (u) => canViewLogs(u) || canViewProgress(u) },
  { href: '/dashboard/progress',  icon: IconUser,              label: 'Mon avancement',  always: false, permFn: canViewProgress },
  { href: '/dashboard/categories', icon: IconTag,               label: 'Mes Catégories',  always: true  },
  { href: '/dashboard/tickets',   icon: IconMessageCircle,     label: 'Tickets',         always: true  },
  { href: '/dashboard/off-days',  icon: IconCalendarOff,       label: 'Jours off',       always: false, permFn: canViewOffDays },
];

function getNavLinks(user) {
  return ALL_NAV_LINKS.filter((l) => l.always || (l.permFn && l.permFn(user)));
}

function getMobileNav(user) {
  const mobile = [
    { href: '/dashboard/home',     label: 'Today',     icon: IconHome,          always: true  },
    { href: '/dashboard/habits',   label: 'Habitudes', icon: IconCheck,         always: false, permFn: canViewHabits    },
    { href: '/dashboard/calendar', label: 'Calendrier',icon: IconCalendarStats, always: false, permFn: (u) => canViewLogs(u) || canViewProgress(u) },
    { href: '/dashboard/progress', label: 'Profil',    icon: IconUser,          always: false, permFn: canViewProgress  },
  ];
  return mobile.filter((l) => l.always || (l.permFn && l.permFn(user)));
}

export const DashboardShell = ({ children }) => {
  const pathname  = usePathname();
  const router    = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [user,        setUser]        = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const stored = getUser();
    setUser(stored);
    const saved = window.localStorage.getItem('habitflow_dark_mode');
    if (saved === 'true') setDarkMode(true);
    setMounted(true);
    if (window.innerWidth < 769) setSidebarOpen(false);

    // Sync live permissions from DB on every shell mount
    apiFetch('/profile')
      .then((profile) => {
        if (!profile?.permissions) return;
        const updated = { ...stored, permissions: profile.permissions };
        setUser(updated);
        storeUser(updated);
      })
      .catch(() => {});
  }, []);

  const logout = () => {
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

        {/* ── Nav: structure fixe par rôle (Option A) ── */}
        {mounted && user?.role === 'manager' ? (
          /* ── Sidebar Manager : fixe, sans permission-checks ─────────── */
          <nav className="user-nav" aria-label="Navigation manager">
            <div className="user-nav-section">Mon espace</div>
            <Link href="/dashboard/home" className={`user-nav-link${pathname === '/dashboard/home' ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconHome size={18} stroke={1.75}/>
              <span>Tableau de bord</span>
            </Link>
            <Link href="/dashboard/habits" className={`user-nav-link${pathname.startsWith('/dashboard/habits') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconCheck size={18} stroke={1.75}/>
              <span>Mes habitudes</span>
            </Link>
            <Link href="/dashboard/stats" className={`user-nav-link${pathname.startsWith('/dashboard/stats') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconReportAnalytics size={18} stroke={1.75}/>
              <span>Mes statistiques</span>
            </Link>
            <Link href="/dashboard/calendar" className={`user-nav-link${pathname.startsWith('/dashboard/calendar') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconCalendarStats size={18} stroke={1.75}/>
              <span>Mon calendrier</span>
            </Link>
            <Link href="/dashboard/progress" className={`user-nav-link${pathname.startsWith('/dashboard/progress') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconUser size={18} stroke={1.75}/>
              <span>Ma progression</span>
            </Link>
            <Link href="/dashboard/categories" className={`user-nav-link${pathname.startsWith('/dashboard/categories') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconTag size={18} stroke={1.75}/>
              <span>Mes catégories</span>
            </Link>
            <Link href="/dashboard/tickets" className={`user-nav-link${pathname.startsWith('/dashboard/tickets') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconMessageCircle size={18} stroke={1.75}/>
              <span>Mes tickets</span>
            </Link>

            <div className="user-nav-section" style={{ marginTop: 12 }}>Mon équipe</div>
            <Link href="/admin/my-users" className={`user-nav-link${pathname.startsWith('/admin/my-users') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconUsers size={18} stroke={1.75}/>
              <span>Mon équipe</span>
            </Link>
            <Link href="/admin/notes" className={`user-nav-link${pathname.startsWith('/admin/notes') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconNotes size={18} stroke={1.75}/>
              <span>Notes équipe</span>
            </Link>
            <Link href="/admin/off-days" className={`user-nav-link${pathname.startsWith('/admin/off-days') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconCalendarOff size={18} stroke={1.75}/>
              <span>Jours off</span>
            </Link>
          </nav>

        ) : mounted && user?.role === 'admin' ? (
          /* ── Sidebar Admin : fixe, sans permission-checks ───────────── */
          <nav className="user-nav" aria-label="Navigation admin">
            <Link href="/admin" className={`user-nav-link${pathname === '/admin' ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconChartBar size={18} stroke={1.75}/>
              <span>Tableau de bord</span>
            </Link>

            <div className="user-nav-section" style={{ marginTop: 12 }}>Gestion</div>
            <Link href="/admin/managers-users" className={`user-nav-link${pathname.startsWith('/admin/managers-users') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconUsersGroup size={18} stroke={1.75}/>
              <span>Managers &amp; Utilisateurs</span>
            </Link>
            <Link href="/admin/habits" className={`user-nav-link${pathname.startsWith('/admin/habits') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconProgress size={18} stroke={1.75}/>
              <span>Habitudes globales</span>
            </Link>
            <Link href="/admin/categories" className={`user-nav-link${pathname.startsWith('/admin/categories') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconTag size={18} stroke={1.75}/>
              <span>Catégories</span>
            </Link>
            <Link href="/admin/logs" className={`user-nav-link${pathname.startsWith('/admin/logs') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconListDetails size={18} stroke={1.75}/>
              <span>Logs</span>
            </Link>
            <Link href="/admin/tickets" className={`user-nav-link${pathname.startsWith('/admin/tickets') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconTicket size={18} stroke={1.75}/>
              <span>Tickets</span>
            </Link>
            <Link href="/admin/off-days" className={`user-nav-link${pathname.startsWith('/admin/off-days') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconCalendarOff size={18} stroke={1.75}/>
              <span>Jours off</span>
            </Link>
            <Link href="/admin/stats" className={`user-nav-link${pathname.startsWith('/admin/stats') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconReportAnalytics size={18} stroke={1.75}/>
              <span>Statistiques</span>
            </Link>
            <Link href="/admin/roles" className={`user-nav-link${pathname.startsWith('/admin/roles') ? ' active' : ''}`} onClick={() => { if (window.innerWidth < 769) setSidebarOpen(false); }}>
              <IconShieldCheck size={18} stroke={1.75}/>
              <span>Permissions rôles</span>
            </Link>
          </nav>
        ) : (
          /* ── Sidebar Utilisateur : liens filtrés par permissions ──────── */
          <>
            <div className="user-nav-section">Navigation</div>
            <nav className="user-nav" aria-label="Navigation principale">
              {getNavLinks(user).map((link) => (
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
            </nav>
          </>
        )}

        {/* Sidebar footer */}
        <div className="user-sidebar-footer" />
      </aside>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
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

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="user-avatar"
                suppressHydrationWarning
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="Menu utilisateur"
                style={{ cursor: 'pointer', border: 'none', padding: 0 }}
                title={displayName}
              >
                {initials}
              </button>
              {showUserMenu && (
                <>
                  <div
                    onClick={() => setShowUserMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 1099 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#fff',
                    border: '1px solid #E8E7F5',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(67,56,202,0.10)',
                    minWidth: 180,
                    zIndex: 1100,
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0EFF9' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--hf-text)' }} suppressHydrationWarning>
                        {displayName}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }} suppressHydrationWarning>
                        {user?.role || 'Utilisateur'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'none',
                        color: '#ef4444',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <IconLogout size={15} stroke={1.75} />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>

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
          {(user?.role === 'manager'
            ? [
                { href: '/dashboard/home',   label: 'Bord',      icon: IconHome         },
                { href: '/dashboard/habits', label: 'Habitudes', icon: IconCheck        },
                { href: '/admin/my-users',   label: 'Équipe',    icon: IconUsers        },
                { href: '/admin/off-days',   label: 'Jours off', icon: IconCalendarOff  },
              ]
            : user?.role === 'admin'
            ? [
                { href: '/admin',               label: 'Dashboard', icon: IconChartBar    },
                ...(canManageManagersCrud(user) ? [{ href: '/admin/managers-users', label: 'Managers', icon: IconUsersGroup }] : []),
                ...((canViewHabits(user) || canManageHabits(user)) ? [{ href: '/admin/habits', label: 'Habitudes', icon: IconProgress }] : []),
                ...(canViewLogs(user) ? [{ href: '/admin/logs', label: 'Logs', icon: IconListDetails }] : []),
                ...(canManageCategoryTickets(user) ? [{ href: '/admin/tickets', label: 'Tickets', icon: IconTicket }] : []),
              ].slice(0, 5)
            : getMobileNav(user)
          ).map((link) => (
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
        }
      `}</style>
    </div>
  );
};
