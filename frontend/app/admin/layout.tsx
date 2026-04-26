"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconChartBar,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMoon,
  IconNotes,
  IconProgress,
  IconSun,
  IconTrendingUp,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { clearAuth, getUser } from "@/lib/auth";
import "./admin-layout.css";

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

  const now = new Date().toLocaleString("fr-FR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  useEffect(() => {
    const stored = getUser<{ firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string; permissions?: string[] }>();
    setUser(stored);
    setDarkMode(window.localStorage.getItem("habitflow_admin_dark_mode") === "true");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("habitflow_admin_dark_mode", String(darkMode));
  }, [darkMode]);

  const role = (user?.role ?? "").toString().toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  // Allow admin and manager roles only — wait for mount before checking
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

  return (
    <div className={`admin-shell${sidebarOpen ? "" : " admin-shell--sidebar-collapsed"}${darkMode ? " admin-shell--dark" : ""}`}>
      <aside className="admin-sidebar">
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
          <p className="admin-nav-section" id="admin-nav-sec-main">
            Vue d&apos;ensemble
          </p>
          <Link href="/admin" className={`admin-nav-link ${pathname === "/admin" ? "active" : ""}`} aria-describedby="admin-nav-sec-main">
            <IconChartBar size={18} stroke={1.75} aria-hidden />
            Tableau de bord
          </Link>
          <Link href="/admin/habits" className={`admin-nav-link ${pathname.startsWith("/admin/habits") ? "active" : ""}`}>
            <IconProgress size={18} stroke={1.75} aria-hidden />
            Habitudes
          </Link>
          <Link href="/admin/progress" className={`admin-nav-link ${pathname.startsWith("/admin/progress") ? "active" : ""}`}>
            <IconTrendingUp size={18} stroke={1.75} aria-hidden />
            Mon avancement
          </Link>
          {isAdmin && (
            <>
              <p className="admin-nav-section" id="admin-nav-sec-admin">
                Administration
              </p>
              <Link href="/admin/users" className={`admin-nav-link ${pathname.startsWith("/admin/users") ? "active" : ""}`} aria-describedby="admin-nav-sec-admin">
                <IconUsers size={18} stroke={1.75} aria-hidden />
                Équipes (consultation)
              </Link>
              <Link href="/admin/managers" className={`admin-nav-link ${pathname.startsWith("/admin/managers") ? "active" : ""}`}>
                <IconUsersGroup size={18} stroke={1.75} aria-hidden />
                Managers
              </Link>
            </>
          )}
          {isManager && (
            <>
              <Link href="/admin/my-users" className={`admin-nav-link ${pathname.startsWith("/admin/my-users") ? "active" : ""}`}>
                <IconUsers size={18} stroke={1.75} aria-hidden />
                Mes utilisateurs
              </Link>
              <Link href="/admin/notes" className={`admin-nav-link ${pathname.startsWith("/admin/notes") ? "active" : ""}`}>
                <IconNotes size={18} stroke={1.75} aria-hidden />
                Notes habitudes
              </Link>
            </>
          )}
        </nav>
      </aside>

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
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={20} stroke={1.75} /> : <IconLayoutSidebarLeftExpand size={20} stroke={1.75} />}
            </button>
            <div className="topbar-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Rechercher utilisateurs, habitudes…" readOnly style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--hf-text)', fontFamily: 'inherit', width: '100%' }} />
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
              {(((user?.firstName ?? user?.prenom)?.[0] ?? '') + ((user?.lastName ?? user?.nom)?.[0] ?? '')).toUpperCase() || '?'}
            </div>
            <div>
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
    </div>
  );
}

