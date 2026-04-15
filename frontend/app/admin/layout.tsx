"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconMoon, IconSun } from "@tabler/icons-react";
import { clearAuth, getUser } from "@/lib/auth";
import "./admin-layout.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("habitflow_admin_dark_mode") === "true";
  });
  const user = getUser<{ prenom?: string; nom?: string; role?: string; permissions?: string[] }>();
  const now = new Date().toLocaleString("fr-FR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("habitflow_admin_dark_mode", String(darkMode));
  }, [darkMode]);

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== 'admin' && !user.permissions?.includes('ALL') && !user.permissions?.includes('HABITS_VIEW'))) {
      router.push('/login');
    }
  }, [user, router]);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className={`admin-shell${sidebarOpen ? "" : " admin-shell--sidebar-collapsed"}${darkMode ? " admin-shell--dark" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Image src="/habitflow-logo.svg" alt="HabitFlow" width={28} height={28} />
          <div>
            <div className="admin-brand-title">HabitFlow</div>
            <div className="admin-brand-subtitle">Responsable Dashboard</div>
          </div>
        </div>

        <nav id="admin-sidebar-nav" className="admin-nav" aria-label="Navigation administration">
          <Link href="/admin" className={`admin-nav-link ${pathname === "/admin" ? "active" : ""}`}>
            Tableau de bord
          </Link>
          <Link href="/admin/habits" className={`admin-nav-link ${pathname.startsWith("/admin/habits") ? "active" : ""}`}>
            Habitudes
          </Link>
          <Link href="/admin/progress" className={`admin-nav-link ${pathname.startsWith("/admin/progress") ? "active" : ""}`}>
            Mon avancement
          </Link>
          <Link href="/admin/users" className={`admin-nav-link ${pathname.startsWith("/admin/users") ? "active" : ""}`}>
            Users
          </Link>
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
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={22} stroke={1.75} /> : <IconLayoutSidebarLeftExpand size={22} stroke={1.75} />}
            </button>
            <div className="admin-topbar-pill" suppressHydrationWarning>
              {now}
            </div>
            <button
              type="button"
              className="admin-theme-toggle"
              onClick={() => setDarkMode((v) => !v)}
              aria-pressed={darkMode}
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {darkMode ? <IconSun size={18} stroke={1.9} /> : <IconMoon size={18} stroke={1.9} />}
              <span>{darkMode ? "Clair" : "Sombre"}</span>
            </button>
          </div>
          <div className="admin-topbar-user">
            <div className="admin-avatar" />
            <div>
              <div className="admin-user-name" suppressHydrationWarning>
                {[user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur"}
              </div>
              <div className="admin-user-role" suppressHydrationWarning>
                {user?.role || "Responsable"}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}

