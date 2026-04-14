"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCalendarStats,
  IconCheck,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api";
import { clearAuth, getToken, getUser } from "@/lib/auth";
import "../../admin/admin-layout.css";

type Summary = {
  total_habits: number;
  active_habits: number;
  paused_habits: number;
  archived_habits: number;
  total_logs: number;
  completed_logs: number;
  partial_logs: number;
  completion_rate: number;
  today_logs: number;
  today_completed: number;
  today_rate: number;
};

type WeeklyProgress = {
  date: string;
  label: string;
  total: number;
  completed: number;
  rate: number;
};

type HabitProgress = {
  habit_id: string;
  habit_nom: string;
  statut: "active" | "pause" | "archived";
  visible_pour_tous: boolean;
  total_logs: number;
  completed_logs: number;
  completion_rate: number;
  last_log_date: string | null;
};

type ProgressPayload = {
  summary: Summary;
  weekly_progress: WeeklyProgress[];
  habits_progress: HabitProgress[];
};

export default function DashboardProgressPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProgressPayload | null>(null);
  const router = useRouter();
  const user = getUser<{ prenom?: string; nom?: string; email?: string }>();

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<ProgressPayload>("/progress/my", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setData(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'avancement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = data?.summary;
  const weekly = data?.weekly_progress ?? [];
  const habits = data?.habits_progress ?? [];

  return (
    <div className={`user-shell ${sidebarOpen ? "" : "user-shell--sidebar-collapsed"} ${darkMode ? "user-shell--dark" : ""}`}>
      <aside className="user-sidebar">
        <div className="user-brand">
          <div className="user-brand-title">HabitFlow</div>
          <div className="user-brand-subtitle">Mon avancement</div>
        </div>

        <nav className="user-nav">
          <Link href="/dashboard" className="user-nav-link">
            <IconHome size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/habits" className="user-nav-link">
            <IconCheck size={18} />
            <span>Habitudes</span>
          </Link>
          <Link href="/dashboard/calendar" className="user-nav-link">
            <IconCalendarStats size={18} />
            <span>Calendrier</span>
          </Link>
          <Link href="/dashboard/progress" className="user-nav-link active">
            <IconUser size={18} />
            <span>Mon avancement</span>
          </Link>
          <Link href="/profile" className="user-nav-link">
            <IconUser size={18} />
            <span>Profil</span>
          </Link>
        </nav>

        <div className="user-sidebar-footer">
          <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={logout}>
            <IconLogout size={16} className="me-2" />
            Déconnexion
          </button>
        </div>
      </aside>

      <section className="user-main">
        <header className="user-topbar">
          <div className="user-topbar-start">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={20} /> : <IconLayoutSidebarLeftExpand size={20} />}
            </button>
            <button type="button" className="btn btn-ghost ms-2" onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
            <div className="user-topbar-title">
              <h1 className="h3 mb-0">Mon avancement</h1>
            </div>
          </div>
          <div className="user-topbar-end">
            <div className="user-topbar-user">
              <div className="user-user-name" suppressHydrationWarning>{[user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "Utilisateur"}</div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="user-content">
          <div className="container-fluid py-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h2 className="h3 mb-1">Mon Avancement</h2>
              </div>
              <button className="btn btn-outline-primary" type="button" onClick={refresh} disabled={loading}>
                {loading ? "Mise à jour..." : "Actualiser"}
              </button>
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-secondary small">Taux global</div>
                    <div className="h2 mb-1">{summary?.completion_rate ?? 0}%</div>
                    <div className="text-secondary small">{summary?.completed_logs ?? 0} complétions</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-secondary small">Aujourd&apos;hui</div>
                    <div className="h2 mb-1">{summary?.today_rate ?? 0}%</div>
                    <div className="text-secondary small">
                      {summary?.today_completed ?? 0}/{summary?.today_logs ?? 0} logs
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-secondary small">Habitudes actives</div>
                    <div className="h2 mb-1">{summary?.active_habits ?? 0}</div>
                    <div className="text-secondary small">sur {summary?.total_habits ?? 0} habitudes</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="text-secondary small">Logs totaux</div>
                    <div className="h2 mb-1">{summary?.total_logs ?? 0}</div>
                    <div className="text-secondary small">dont {summary?.partial_logs ?? 0} partiels</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header">Progression sur 7 jours</div>
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Complétées</th>
                      <th>Total logs</th>
                      <th>Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekly.map((d) => (
                      <tr key={d.date}>
                        <td>{d.label}</td>
                        <td>{d.completed}</td>
                        <td>{d.total}</td>
                        <td>{d.rate}%</td>
                      </tr>
                    ))}
                    {!weekly.length && (
                      <tr>
                        <td colSpan={4} className="text-secondary text-center py-4">
                          Aucune donnée hebdomadaire.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Avancement par habitude</div>
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Habitude</th>
                      <th>Statut</th>
                      <th>Complétées</th>
                      <th>Total logs</th>
                      <th>Taux</th>
                      <th>Dernier log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((h) => (
                      <tr key={h.habit_id}>
                        <td>
                          <div className="fw-medium">{h.habit_nom}</div>
                        </td>
                        <td>{h.statut}</td>
                        <td>{h.completed_logs}</td>
                        <td>{h.total_logs}</td>
                        <td>{h.completion_rate}%</td>
                        <td>{h.last_log_date ? new Date(h.last_log_date).toLocaleString("fr-FR") : "-"}</td>
                      </tr>
                    ))}
                    {!habits.length && (
                      <tr>
                        <td colSpan={6} className="text-secondary text-center py-4">
                          Aucune habitude trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}