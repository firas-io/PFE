"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCalendarOff,
  IconCalendarStats,
  IconChartBar,
  IconCheck,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMessageCircle,
  IconNotes,
  IconProgress,
  IconReportAnalytics,
  IconShieldCheck,
  IconTag,
  IconTicket,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { clearAuth, getUser, setUser as storeUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { canAccessAdminShell } from "@/src/utils/permissions";

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
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const stored = getUser<{ firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string; permissions?: string[] }>();
    setUser(stored);
    setIsMobile(window.innerWidth < 769);
    if (window.innerWidth < 769) setSidebarOpen(false);
    setMounted(true);

    // Sync live permissions from DB — the backend resolves them fresh on every /profile call
    // (with a 60s in-memory cache). This ensures sidebar links reflect admin-configured
    // permissions without requiring a re-login.
    apiFetch<{ permissions?: string[] }>("/profile")
      .then((profile) => {
        if (!profile?.permissions) return;
        const updated = { ...stored, permissions: profile.permissions };
        setUser(updated);
        storeUser(updated);
      })
      .catch(() => { /* silent — fall back to cached localStorage permissions */ })
      .finally(() => setProfileReady(true));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const role = (user?.role ?? "").toLowerCase();
  const isAdmin   = role === "admin";
  const isManager = role === "manager";

  // Mobile nav — fixe par rôle
  const mobileNav = isAdmin ? [
    { href: "/admin",            label: "Dashboard",  icon: IconChartBar },
    { href: "/admin/habits",     label: "Habitudes",  icon: IconProgress },
    { href: "/admin/tickets",    label: "Tickets",    icon: IconTicket   },
    { href: "/admin/roles",      label: "Permissions", icon: IconShieldCheck },
  ] : isManager ? [
    { href: "/dashboard/home",   label: "Mon bord",   icon: IconHome        },
    { href: "/admin/my-users",   label: "Équipe",     icon: IconUsers       },
    { href: "/dashboard/habits", label: "Habitudes",  icon: IconCheck       },
    { href: "/admin/off-days",   label: "Jours off",  icon: IconCalendarOff },
  ] : [];
  const mobileSidebarStyle = isMobile
    ? {
        position: "fixed" as const,
        top: 60,
        left: 0,
        right: 0,
        bottom: "auto" as const,
        width: "100%",
        height: "auto",
        maxHeight: "calc(100dvh - 60px)",
        overflowY: "auto" as const,
        transform: sidebarOpen ? "translateY(0)" : "translateY(calc(-100% - 70px))",
        transition: "transform 0.28s var(--hf-ease)",
        zIndex: 1000,
        borderRadius: "0 0 14px 14px",
      }
    : undefined;

  useEffect(() => {
    if (!mounted || !profileReady) return;
    if (!user || !canAccessAdminShell(user)) {
      router.replace("/login");
    }
  }, [mounted, profileReady, user, router]);

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

  return (
    <div className={`admin-shell${sidebarOpen ? "" : " admin-shell--sidebar-collapsed"}`}>
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

          {/* ══ ADMIN ══════════════════════════════════════════════════════════ */}
          {isAdmin && (
            <>
              <Link href="/admin" className={`admin-nav-link ${pathname === "/admin" ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconChartBar size={18} stroke={1.75} aria-hidden />
                Tableau de bord
              </Link>

              <p className="admin-nav-section" style={{ marginTop: 12 }}>Gestion</p>
              <Link href="/admin/managers-users" className={`admin-nav-link ${pathname.startsWith("/admin/managers-users") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconUsersGroup size={18} stroke={1.75} aria-hidden />
                Managers &amp; Utilisateurs
              </Link>
              <Link href="/admin/habits" className={`admin-nav-link ${pathname.startsWith("/admin/habits") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconProgress size={18} stroke={1.75} aria-hidden />
                Habitudes globales
              </Link>
              <Link href="/admin/categories" className={`admin-nav-link ${pathname.startsWith("/admin/categories") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconTag size={18} stroke={1.75} aria-hidden />
                Catégories
              </Link>
              <Link href="/admin/tickets" className={`admin-nav-link ${pathname.startsWith("/admin/tickets") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconTicket size={18} stroke={1.75} aria-hidden />
                Tickets
              </Link>
              <Link href="/admin/off-days" className={`admin-nav-link ${pathname.startsWith("/admin/off-days") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconCalendarOff size={18} stroke={1.75} aria-hidden />
                Jours off
              </Link>
              <Link href="/admin/roles" className={`admin-nav-link ${pathname.startsWith("/admin/roles") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconShieldCheck size={18} stroke={1.75} aria-hidden />
                Permissions rôles
              </Link>
            </>
          )}

          {/* ══ MANAGER ════════════════════════════════════════════════════════ */}
          {isManager && (
            <>
              <p className="admin-nav-section">Mon espace</p>
              <Link href="/dashboard/home" className={`admin-nav-link ${pathname === "/dashboard/home" ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconHome size={18} stroke={1.75} aria-hidden />
                Tableau de bord
              </Link>
              <Link href="/dashboard/habits" className={`admin-nav-link ${pathname.startsWith("/dashboard/habits") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconCheck size={18} stroke={1.75} aria-hidden />
                Mes habitudes
              </Link>
              <Link href="/dashboard/stats" className={`admin-nav-link ${pathname.startsWith("/dashboard/stats") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconReportAnalytics size={18} stroke={1.75} aria-hidden />
                Mes statistiques
              </Link>
              <Link href="/dashboard/calendar" className={`admin-nav-link ${pathname.startsWith("/dashboard/calendar") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconCalendarStats size={18} stroke={1.75} aria-hidden />
                Mon calendrier
              </Link>
              <Link href="/dashboard/progress" className={`admin-nav-link ${pathname.startsWith("/dashboard/progress") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconUser size={18} stroke={1.75} aria-hidden />
                Ma progression
              </Link>
              <Link href="/dashboard/tickets" className={`admin-nav-link ${pathname.startsWith("/dashboard/tickets") ? "active" : ""}`} onClick={closeSidebarOnMobile}>
                <IconMessageCircle size={18} stroke={1.75} aria-hidden />
                Mes tickets
              </Link>

              <p className="admin-nav-section" style={{ marginTop: 12 }}>Mon équipe</p>
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

        <div className="admin-sidebar-footer" />
      </aside>

      {/* Overlay — closes sidebar on mobile when tapping outside */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
          style={{
            display: "none",
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
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
          </div>
          <div className="admin-topbar-user">
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="admin-avatar"
                suppressHydrationWarning
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="Menu utilisateur"
                style={{ cursor: "pointer", border: "none", padding: 0 }}
              >
                {(((user?.firstName ?? user?.prenom)?.[0] ?? "") + ((user?.lastName ?? user?.nom)?.[0] ?? "")).toUpperCase() || "?"}
              </button>
              {showUserMenu && (
                <>
                  <div
                    onClick={() => setShowUserMenu(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 1099 }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#fff",
                    border: "1px solid #E8E7F5",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(67,56,202,0.10)",
                    minWidth: 180,
                    zIndex: 1100,
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0EFF9" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--hf-text)" }} suppressHydrationWarning>
                        {[user?.firstName ?? user?.prenom, user?.lastName ?? user?.nom].filter(Boolean).join(" ") || "Utilisateur"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }} suppressHydrationWarning>
                        {user?.role || "Responsable"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <IconLogout size={15} stroke={1.75} />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
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
        }
      `}</style>
    </div>
  );
}
