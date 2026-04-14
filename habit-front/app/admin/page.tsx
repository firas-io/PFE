"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

type User = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  isActive: boolean;
};

type Habit = {
  _id: string;
  nom: string;
  statut?: "active" | "pause" | "archived";
  priorite?: "high" | "medium" | "low";
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, habitsData] = await Promise.all([
        apiFetch<User[]>("/users"),
        apiFetch<Habit[]>("/habits/my?includeArchived=true")
      ]);
      setUsers(usersData);
      setHabits(habitsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (token === null || !token) return;
    const u = getUser<{ role?: string }>();
    if (u?.role !== "admin") {
      router.replace("/admin/habits");
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    const u = getUser<{ role?: string }>();
    if (u?.role !== "admin") return;
    refresh();
  }, [token, refresh]);

  const usersActive = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const habitsActive = useMemo(() => habits.filter((h) => (h.statut || "active") === "active").length, [habits]);
  const habitsPaused = useMemo(() => habits.filter((h) => h.statut === "pause").length, [habits]);
  const habitsArchived = useMemo(() => habits.filter((h) => h.statut === "archived").length, [habits]);

  if (token === null) {
    return (
      <div className="page">
        <div className="container py-4 text-secondary">Chargement...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="page">
        <div className="container py-4">
          <div className="alert alert-warning">Vous devez être connecté pour accéder au tableau de bord.</div>
          <Link className="btn btn-primary" href="/login">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const sessionUser = getUser<{ role?: string }>();
  if (sessionUser?.role !== "admin") {
    return (
      <div className="page">
        <div className="container py-4 text-secondary">Redirection vers vos habitudes…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="h3 mb-1 text-primary">Tableau de Bord</h2>
        <div className="text-secondary small">Vue globale users & habitudes</div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-secondary small">USERS</div>
              <div className="h2 mb-1">{users.length}</div>
              <div className="text-secondary mb-3">{usersActive} actifs</div>
              <Link className="btn btn-primary btn-sm" href="/admin/users">
                Gérer les utilisateurs
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-secondary small">HABITUDES</div>
              <div className="h2 mb-1">{habits.length}</div>
              <div className="text-secondary mb-3">
                {habitsActive} actives · {habitsPaused} en pause · {habitsArchived} archivées
              </div>
              <Link className="btn btn-primary btn-sm" href="/admin/habits">
                Gérer les habitudes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div>Vue rapide</div>
          {loading ? <div className="text-secondary small">Mise à jour...</div> : null}
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Indicateur</th>
                <th>Valeur</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Users</td>
                <td>Total utilisateurs</td>
                <td>{users.length}</td>
                <td>
                  <Link href="/admin/users" className="btn btn-sm btn-outline-primary">
                    Ouvrir
                  </Link>
                </td>
              </tr>
              <tr>
                <td>Users</td>
                <td>Utilisateurs actifs</td>
                <td>{usersActive}</td>
                <td>
                  <Link href="/admin/users?active=true" className="btn btn-sm btn-outline-primary">
                    Ouvrir
                  </Link>
                </td>
              </tr>
              <tr>
                <td>Habitudes</td>
                <td>Total habitudes</td>
                <td>{habits.length}</td>
                <td>
                  <Link href="/admin/habits" className="btn btn-sm btn-outline-primary">
                    Ouvrir
                  </Link>
                </td>
              </tr>
              <tr>
                <td>Habitudes</td>
                <td>Habitudes actives</td>
                <td>{habitsActive}</td>
                <td>
                  <Link href="/admin/habits?active=true" className="btn btn-sm btn-outline-primary">
                    Ouvrir
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

