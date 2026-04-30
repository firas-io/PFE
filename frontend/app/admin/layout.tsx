"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCalendarOff,
  IconChartBar,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconListDetails,
  IconLogout,
  IconMoon,
  IconNotes,
  IconProgress,
  IconSun,
  IconTag,
  IconTicket,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { clearAuth, getUser } from "@/lib/auth";

const ADMIN_MOBILE_NAV = [
  { href: "/admin",               label: "Dashboard",  icon: IconChartBar    },
  { href: "/admin/managers-users",label: "Managers",   icon: IconUsersGroup  },
  { href: "/admin/habits",        label: "Habitudes",  icon: IconProgress    },
  { href: "/admin/logs",          label: "Logs",       icon: IconListDetails },
  { href: "/admin/tickets",       label: "Tickets",    icon: IconTicket      },
];

const MANAGER_MOBILE_NAV = [
  { href: "/admin",           label: "Dashboard", icon: IconChartBar  },
  { href: "/admin/my-users",  label: "Équipe",    icon: IconUsers     },
  { href: "/admin/notes",     label: "Notes",     icon: IconNotes     },
  { href: "/admin/off-days",  label: "Jours off", icon: IconCalendarOff },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    prenom?: string;
    nom?: string;
    role?: string;
    permissions?: string[];
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const stored = getUser<{ firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string; permissions?: string[] }>();
    setUser(stored);
    setDarkMode(window.localStorage.getItem("habitflow_admin_dark_mode") === "true");
    setIsMobile(window.innerWidth < 769);
    // Start with sidebar closed on mobile
    if (window.innerWidth < 769) setSidebarOpen(false);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("habitflow_admin_dark_mode", String(darkMode));
  }, [darkMode]);

  const role = (user?.role ?? "").toString().toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const mobileSidebarStyle = isMobile
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        bottom: 0,
        right: "auto" as const,
        width: "min(86vw, var(--hf-sidebar-w))",
        height: "100dvh",
        transform: sidebarOpen ? "translate3d(0, 0, 0)" : "translate3d(-100%, 0, 0)",
        transition: "transform 0.28s var(--hf-ease)",
        zIndex: 1000,
      }
    : undefined;

  useEffect(() => {
    if (!mounted) return;
    if (!user || (!isAdmin && !isManager)) {
      router.replace("/login");
    }
  }, [mounted, user, router, isAdmin, isManager]);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  function closeSidebarOnMobile() {
    if (typeof window !== "undefined" && window.innerWidth < 769) {
      setSidebarOpen(false);
    }
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const mobileNav = isManager ? MANAGER_MOBILE_NAV : ADMIN_MOBILE_NAV;

  return (
    <div className={`admin-shell${sidebarOpen ? "" : " admin-shell--sidebar-collapsed"}${darkMode ? " admin-shell--dark" : ""}`}>
      <aside
        className="admin-sidebar"
        style={mobileSidebarStyle}
      >
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M8 16.5C8 12.5 11 9 16 9C21 9 24 12.5 24 16.5C24 20.5 21 23 16 23" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M16 23C13.5 23 12 21 12 18.5C12 16 13.5 14 16 14C18.5 14 20 16 20 18.5" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <circle cx="16" cy="18.5" r="2" fill="white"/>
            </svg>
          </div>
          <div className="admin-brand-text">
            <div className="admin-brand-title">HabitFlow</div>
            <div className="admin-brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <nav id="admin-sidebar-nav" className="admin-nav" aria-label="Navigation administration">
          <p className="admin-nav-section">Vue d&apos;ensemble</p>

          <Link
            href="/admin"
            className={`admin-nav-link ${pathname === "/admin" ? "active" : ""}`}
            onClick={closeSidebarOnMobile}
          >
            <IconChartBar size={18} stroke={1.75} aria-hidden />
            Tableau de bord
          </Link>

          {isAdmin && (
            <>
              <Link href="/admin/managers-users" className={`admin-nav-link ${pathname.startsWith("/admin/managers-users") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconUsersGroup size={18} stroke={1.75} aria-hidden />
                Managers &amp; Utilisateurs
              </Link>
              <Link href="/admin/habits" className={`admin-nav-link ${pathname.startsWith("/admin/habits") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconProgress size={18} stroke={1.75} aria-hidden />
                Habitudes
              </Link>
              <Link href="/admin/categories" className={`admin-nav-link ${pathname.startsWith("/admin/categories") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconTag size={18} stroke={1.75} aria-hidden />
                Catégories
              </Link>
              <Link href="/admin/logs" className={`admin-nav-link ${pathname.startsWith("/admin/logs") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconListDetails size={18} stroke={1.75} aria-hidden />
                Logs
              </Link>
              <Link href="/admin/tickets" className={`admin-nav-link ${pathname.startsWith("/admin/tickets") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconTicket size={18} stroke={1.75} aria-hidden />
                Tickets
              </Link>
              <Link href="/admin/off-days" className={`admin-nav-link ${pathname.startsWith("/admin/off-days") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconCalendarOff size={18} stroke={1.75} aria-hidden />
                Jours off
              </Link>
            </>
          )}

          {isManager && (
            <>
              <Link href="/admin/my-users" className={`admin-nav-link ${pathname.startsWith("/admin/my-users") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconUsers size={18} stroke={1.75} aria-hidden />
                Mon équipe
              </Link>
              <Link href="/admin/notes" className={`admin-nav-link ${pathname.startsWith("/admin/notes") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconNotes size={18} stroke={1.75} aria-hidden />
                Notes équipe
              </Link>
              <Link href="/admin/off-days" className={`admin-nav-link ${pathname.startsWith("/admin/off-days") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconCalendarOff size={18} stroke={1.75} aria-hidden />
                Jours off
              </Link>
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-link w-100 text-start border-0 bg-transparent"
            onClick={logout}
            style={{ color: "var(--hf-danger, #ef4444)" }}
          >
            <IconLogout size={18} stroke={1.75} aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay — closes sidebar on mobile when tapping outside */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.3)",
          }}
        />
      )}

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-start">
            <button
              type="button"
              className="admin-sidebar-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar-nav"
              title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            >
              {sidebarOpen
                ? <IconLayoutSidebarLeftCollapse size={20} stroke={1.75} />
                : <IconLayoutSidebarLeftExpand size={20} stroke={1.75} />}
            </button>
            <div className="topbar-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Rechercher…" readOnly style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--hf-text)", fontFamily: "inherit", width: "100%" }} />
            </div>
          </div>
          <div className="admin-topbar-user">
            <button
              type="button"
              className="admin-theme-toggle"
              onClick={() => setDarkMode((v) => !v)}
              aria-pressed={darkMode}
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {darkMode ? <IconSun size={15} stroke={1.9} /> : <IconMoon size={15} stroke={1.9} />}
              <span suppressHydrationWarning>{darkMode ? "Clair" : "Sombre"}</span>
            </button>
            <button type="button" className="topbar-icon-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="admin-avatar" suppressHydrationWarning>
              {(((user?.firstName ?? user?.prenom)?.[0] ?? "") + ((user?.lastName ?? user?.nom)?.[0] ?? "")).toUpperCase() || "?"}
            </div>
            <div className="hide-mobile">
              <div className="admin-user-name" suppressHydrationWarning>
                {[user?.firstName ?? user?.prenom, user?.lastName ?? user?.nom].filter(Boolean).join(" ") || "Utilisateur"}
              </div>
              <div className="admin-user-role" suppressHydrationWarning>
                {user?.role || "Responsable"}
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav" aria-label="Navigation mobile admin">
        <div className="mobile-bottom-nav-inner">
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${isActive(item.href) ? " active" : ""}`}
            >
              <item.icon size={22} stroke={isActive(item.href) ? 2 : 1.75} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
          .hide-mobile { display: none !important; }
          .topbar-search { max-width: 160px; }
        }
      `}</style>
    </div>
  );
}
