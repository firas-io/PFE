"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

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

export default function ProgressPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProgressPayload | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<ProgressPayload>("/progress/my");
      setData(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'avancement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  if (token === null) {
    return <div className="text-secondary">Chargement...</div>;
  }

  if (!token) {
    return (
      <div>
        <div className="alert alert-warning">Vous devez être connecté pour consulter votre avancement.</div>
        <Link className="btn btn-primary" href="/login">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  const summary = data?.summary;
  const weekly = data?.weekly_progress ?? [];
  const habits = data?.habits_progress ?? [];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="h3 mb-1 text-primary">Mon Avancement</h2>
          <div className="text-secondary small">Suivi de vos habitudes et progression quotidienne.</div>
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
                    {h.visible_pour_tous ? <div className="text-secondary small">Habitude partagée</div> : null}
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
  );
}
