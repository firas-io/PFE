"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconHistory,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMoon,
  IconSun,
  IconSearch,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api";
import { clearAuth, getToken, getUser } from "@/lib/auth";
import "../../admin/admin-layout.css";

type User = {
  _id: string;
  prenom?: string;
  nom?: string;
  email?: string;
};

type Habit = {
  _id: string;
  nom?: string;
  categorie?: string;
};

type NoteHistoryEntry = {
  _id: string;
  habit_id: Habit;
  utilisateur_id: User;
  old_note: string | null;
  new_note: string | null;
  action: "created" | "updated" | "deleted";
  note_text: string;
  createdAt: string;
};

type NotesResponse = {
  data: NoteHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export default function AdminNotesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteHistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const user = getUser<{ prenom?: string; nom?: string; email?: string }>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadNotes = useCallback(async (pageNum: number, searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", "20");
      if (searchQuery) params.append("search", searchQuery);

      const response = await apiFetch<NotesResponse>(`/habits/admin/notes/all?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setNotes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes(page, search);
  }, [page, search, loadNotes]);

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className={`user-shell ${sidebarOpen ? "" : "user-shell--sidebar-collapsed"} ${darkMode ? "user-shell--dark" : ""}`}>
      <aside className="user-sidebar">
        <div className="user-brand">
          <div className="user-brand-title">HabitFlow</div>
          <div className="user-brand-subtitle">Admin</div>
        </div>

        <nav className="user-nav">
          <Link href="/admin" className="user-nav-link">
            <IconArrowLeft size={18} />
            <span>Retour Admin</span>
          </Link>
          <Link href="/admin/notes" className="user-nav-link active">
            <IconHistory size={18} />
            <span>Notes Dashboard</span>
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
              className="user-sidebar-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={22} stroke={1.75} /> : <IconLayoutSidebarLeftExpand size={22} stroke={1.75} />}
            </button>
            <button
              type="button"
              className="user-theme-toggle"
              onClick={() => setDarkMode((v) => !v)}
              aria-pressed={darkMode}
            >
              {darkMode ? <IconSun size={18} stroke={1.9} /> : <IconMoon size={18} stroke={1.9} />}
            </button>
          </div>
          <div className="user-topbar-user">
            <div className="user-avatar" />
            <div>
              <div className="user-user-name">
                {mounted ? ([user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "Administrateur") : ""}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="user-content">
          <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-1">Dashboard des Notes</h1>
                <p className="text-secondary mb-0">Consultez l'historique de toutes les notes du système</p>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card mb-4">
              <div className="card-body">
                <div className="input-group">
                  <span className="input-group-text">
                    <IconSearch size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher dans les notes..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Habitude</th>
                      <th>Action</th>
                      <th>Note</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Chargement...
                        </td>
                      </tr>
                    ) : notes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-secondary">
                          Aucune note trouvée.
                        </td>
                      </tr>
                    ) : (
                      notes.map((entry) => (
                        <tr key={entry._id}>
                          <td>
                            <div className="fw-semibold">
                              {entry.utilisateur_id?.prenom} {entry.utilisateur_id?.nom}
                            </div>
                          </td>
                          <td>
                            <small className="text-secondary">{entry.utilisateur_id?.email}</small>
                          </td>
                          <td>
                            <div className="fw-semibold">{entry.habit_id?.nom}</div>
                            <small className="text-secondary">{entry.habit_id?.categorie}</small>
                          </td>
                          <td>
                            <span className={`badge ${entry.action === "created" ? "bg-success" : entry.action === "updated" ? "bg-info" : "bg-danger"}`}>
                              {entry.action === "created" ? "Créée" : entry.action === "updated" ? "Modifiée" : "Supprimée"}
                            </span>
                          </td>
                          <td>
                            <small className="text-secondary" style={{ maxWidth: "300px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {entry.note_text || "(vide)"}
                            </small>
                          </td>
                          <td>
                            <small className="text-secondary">
                              {new Date(entry.createdAt).toLocaleString("fr-FR")}
                            </small>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="card-footer d-flex align-items-center">
                  <div className="ms-auto">
                    <nav aria-label="Page navigation">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                          >
                            Précédent
                          </button>
                        </li>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter((p) => Math.abs(p - page) <= 1 || p === 1 || p === pagination.pages)
                          .map((p, i, arr) => (
                            <li key={p}>
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span className="page-link">...</span>
                              )}
                              <button
                                className={`page-link ${p === page ? "active" : ""}`}
                                onClick={() => setPage(p)}
                              >
                                {p}
                              </button>
                            </li>
                          ))}
                        <li className={`page-item ${page === pagination.pages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setPage(page + 1)}
                            disabled={page === pagination.pages}
                          >
                            Suivant
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 small text-secondary">
              Affichage de {(page - 1) * 20 + 1} à {Math.min(page * 20, pagination.total)} sur {pagination.total} notes
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
