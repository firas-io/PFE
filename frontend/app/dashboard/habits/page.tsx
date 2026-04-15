"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconCalendarStats,
  IconCheck,
  IconCopy,
  IconEdit,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconX,
  IconHome,
  IconUser,
  IconLogout,
  IconMoon,
  IconSun,
  IconCamera,
  IconUpload,
  IconTrash,
  IconNotes,
  IconHistory,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, clearAuth } from "@/lib/auth";
import "../../admin/admin-layout.css";

type Habit = {
  _id: string;
  nom?: string;
  titre?: string;
  description?: string;
  categorie?: "sante" | "travail" | "apprentissage" | "bien_etre" | "sport" | "autre";
  frequence?: "daily" | "weekly" | "monthly" | "specific_days" | "times_per_week";
  jours_specifiques?: string[];
  fois_par_semaine?: number;
  horaires_cibles?: Array<"matin" | "midi" | "soir">;
  heure_precise?: string;
  priorite?: "high" | "medium" | "low";
  objectif_detail?: string;
  objectif_quantifiable?: string;
  date_debut?: string;
  statut?: "active" | "pause" | "archived";
  visible_pour_tous?: boolean;
  note?: string;
};

type HabitForm = {
  nom: string;
  description: string;
  categorie: Habit["categorie"];
  frequence: Habit["frequence"];
  priorite: Habit["priorite"];
  objectif_detail: string;
  visible_pour_tous: boolean;
  note: string;
  date_debut?: string;
  dates_specifiques?: string[]; // Array of ISO date strings
};

type HabitProgress = {
  habit_id: string;
  habit_nom: string;
  statut: "active" | "pause" | "archived";
  total_logs: number;
  completed_logs: number;
  completion_rate: number;
  last_log_date: string | null;
};

type ProgressPayload = {
  summary: any;
  weekly_progress: any[];
  habits_progress: HabitProgress[];
};

type TodayHabitLog = {
  id: string;
  statut: string;
};

type NoteHistory = {
  _id: string;
  habit_id: string;
  utilisateur_id: {
    _id: string;
    prenom: string;
    nom: string;
    email: string;
  };
  old_note: string | null;
  new_note: string | null;
  action: "created" | "updated" | "deleted";
  note_text: string;
  createdAt: string;
};

const emptyForm: HabitForm = {
  nom: "",
  description: "",
  categorie: "autre",
  frequence: "daily",
  priorite: "medium",
  objectif_detail: "",
  visible_pour_tous: false,
  note: "",
  date_debut: "",
  dates_specifiques: [],
};

function labelCategorie(value?: Habit["categorie"]) {
  const map: Record<string, string> = {
    sante: "Santé",
    travail: "Travail",
    apprentissage: "Apprentissage",
    bien_etre: "Bien-être",
    sport: "Sport",
    autre: "Autre",
  };
  return value ? map[value] || value : "-";
}

function labelFrequence(value?: Habit["frequence"]) {
  const map: Record<string, string> = {
    daily: "Quotidienne",
    weekly: "Hebdomadaire",
    monthly: "Mensuelle",
    specific_days: "Jours spécifiques",
    times_per_week: "Fois par semaine",
  };
  return value ? map[value] || value : "-";
}

function labelPriorite(value?: Habit["priorite"]) {
  const map: Record<string, string> = {
    high: "Haute",
    medium: "Moyenne",
    low: "Basse",
  };
  return value ? map[value] || value : "-";
}

function labelStatut(value?: Habit["statut"]) {
  const map: Record<string, string> = {
    active: "Active",
    pause: "En pause",
    archived: "Archivée",
  };
  return value ? map[value] || value : "-";
}

function statusRank(value?: Habit["statut"]) {
  if (value === "active") return 0;
  if (value === "pause") return 1;
  if (value === "archived") return 2;
  return 3;
}

function priorityRank(value?: Habit["priorite"]) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

export default function DashboardHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitProgress, setHabitProgress] = useState<Record<string, HabitProgress>>({});
  const [todayStatus, setTodayStatus] = useState<Record<string, TodayHabitLog>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pause" | "archived">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "priority_desc" | "priority_asc" | "status">("recent");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitForm>(emptyForm);
  const [editingDateHabitId, setEditingDateHabitId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoHabitId, setPhotoHabitId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoNotes, setPhotoNotes] = useState<string>("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesHabitId, setNotesHabitId] = useState<string | null>(null);
  const [habitNotes, setHabitNotes] = useState<string>("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [noteHistory, setNoteHistory] = useState<NoteHistory[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const user = getUser<{ prenom?: string; nom?: string; email?: string }>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const habitsData = await apiFetch<Habit[]>("/habits/my?includeArchived=true");
      setHabits(habitsData);

      // Load progress data
      try {
        const progressData = await apiFetch<ProgressPayload>("/progress/my");
        const progressMap: Record<string, HabitProgress> = {};
        progressData.habits_progress?.forEach((progress) => {
          progressMap[progress.habit_id] = progress;
        });
        setHabitProgress(progressMap);
      } catch (progressErr) {
        console.warn("Could not load habit progress:", progressErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des habitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodayStatus = useCallback(async () => {
    try {
      const todayData = await apiFetch<{ habits: Array<{ _id: string; nom?: string }>; logs: Array<{ _id: string; habit_id: string; statut: string }> }>(
        "/progress/today"
      );
      const statusMap: Record<string, TodayHabitLog> = {};
      todayData.logs.forEach((log) => {
        statusMap[log.habit_id.toString()] = { id: log._id, statut: log.statut };
      });
      setTodayStatus(statusMap);
    } catch (err) {
      console.warn("Could not load today habit status:", err);
    }
  }, []);

  const toggleHabitComplete = async (habitId: string, photoUrl?: string, notes?: string) => {
    try {
      setCreating(true);
      setError(null);
      const existing = todayStatus[habitId];
      if (existing) {
        const newStatus = existing.statut === "completee" ? "non_completee" : "completee";
        await apiFetch(`/logs/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({ statut: newStatus, photo_url: photoUrl, notes: notes || undefined }),
        });
      } else {
        await apiFetch("/logs", {
          method: "POST",
          body: JSON.stringify({ habit_id: habitId, statut: "completee", date: new Date().toISOString(), photo_url: photoUrl, notes: notes || undefined }),
        });
      }
      await loadTodayStatus();
      await loadHabits();
      setShowPhotoModal(false);
      setPhotoHabitId(null);
      setPhotoPreview(null);
      setPhotoFile(null);
      setPhotoNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut du log");
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteClick = (habitId: string) => {
    const existing = todayStatus[habitId];
    // Si l'habitude est déjà complétée, on peut simplement la marquer comme non complétée
    if (existing?.statut === "completee") {
      toggleHabitComplete(habitId);
    } else {
      // Sinon, on demande une photo
      setPhotoHabitId(habitId);
      setShowPhotoModal(true);
      setPhotoPreview(null);
      setPhotoFile(null);
      setPhotoNotes("");
    }
  };

  const handlePhotoUpload = (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitPhotoAndComplete = async () => {
    if (!photoFile || !photoHabitId) return;
    
    try {
      setCreating(true);
      // Convert photo to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoDataUrl = e.target?.result as string;
        await toggleHabitComplete(photoHabitId, photoDataUrl, photoNotes || undefined);
      };
      reader.readAsDataURL(photoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload de la photo");
      setCreating(false);
    }
  };

  const openNotesModal = (habit: Habit) => {
    setNotesHabitId(habit._id);
    setHabitNotes(habit.note || "");
    setShowNotesModal(true);
  };

  const loadNoteHistory = async (habitId: string) => {
    try {
      const history = await apiFetch<NoteHistory[]>(`/habits/${habitId}/notes/history`);
      setNoteHistory(history);
      setShowHistoryModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique");
    }
  };

  const saveHabitNotes = async () => {
    if (!notesHabitId) return;
    
    try {
      setCreating(true);
      setError(null);
      await apiFetch<Habit>(`/habits/${notesHabitId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ note: habitNotes || undefined }),
      });
      await loadHabits();
      setShowNotesModal(false);
      setNotesHabitId(null);
      setHabitNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde des notes");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadHabits();
    loadTodayStatus();
  }, [loadHabits, loadTodayStatus]);

  const saveHabit = async () => {
    if (!form.nom.trim()) {
      setError("Le nom de l'habitude est requis");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      if (editingHabit) {
        const payload: Record<string, any> = {
          nom: form.nom,
          description: form.description,
          categorie: form.categorie,
          frequence: form.frequence,
          priorite: form.priorite,
          objectif_detail: form.objectif_detail,
          visible_pour_tous: form.visible_pour_tous,
          note: form.note,
        };
        if (form.date_debut) {
          payload.date_debut = form.date_debut;
        }
        if (form.dates_specifiques && form.dates_specifiques.length > 0) {
          payload.dates_specifiques = form.dates_specifiques;
        }
        await apiFetch<Habit>(`/habits/${editingHabit._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        const payload: Record<string, any> = {
          nom: form.nom,
          description: form.description,
          categorie: form.categorie,
          frequence: form.frequence,
          priorite: form.priorite,
          objectif_detail: form.objectif_detail,
          visible_pour_tous: form.visible_pour_tous,
          note: form.note,
        };
        if (form.date_debut) {
          payload.date_debut = form.date_debut;
        }
        if (form.dates_specifiques && form.dates_specifiques.length > 0) {
          payload.dates_specifiques = form.dates_specifiques;
        }
        await apiFetch<Habit>("/habits", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setEditingHabit(null);
      setForm(emptyForm);
      setShowCreateModal(false);
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (habitId: string, statut: "active" | "pause" | "archived") => {
    try {
      setCreating(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      console.log(`[DEBUG] Updating habit ${habitId} to status ${statut}`);
      console.log(`[DEBUG] Token exists: ${!!token}`);
      
      const response = await apiFetch<Habit>(`/habits/${habitId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
      console.log(`[DEBUG] Status update response:`, response);
      await loadHabits();
    } catch (err) {
      console.error(`[ERROR] Status update failed:`, err);
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut");
    } finally {
      setCreating(false);
    }
  };

  const updateDate = async (habitId: string, dateDeDebut: string) => {
    try {
      setCreating(true);
      setError(null);
      await apiFetch<Habit>(`/habits/${habitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ date_debut: dateDeDebut || undefined }),
      });
      setEditingDateHabitId(null);
      setEditingDate("");
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour de la date");
    } finally {
      setCreating(false);
    }
  };

  const cloneHabit = async (habitId: string) => {
    try {
      setCreating(true);
      setError(null);
      await apiFetch<Habit>(`/habits/${habitId}/clone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({}),
      });
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la copie");
    } finally {
      setCreating(false);
    }
  };

  const archiveHabit = async (habitId: string) => {
    try {
      setCreating(true);
      setError(null);
      console.log(`Archiving habit ${habitId}`);
      const response = await apiFetch<Habit>(`/habits/${habitId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ statut: "archived" }),
      });
      console.log(`Archive response:`, response);
      await loadHabits();
    } catch (err) {
      console.error(`Error archiving habit:`, err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'archivage");
    } finally {
      setCreating(false);
    }
  };

  const filteredHabits = useMemo(() => {
    let items = habits;
    if (statusFilter !== "all") {
      items = items.filter((habit) => habit.statut === statusFilter);
    }
    const query = search.trim().toLowerCase();
    if (query) {
      items = items.filter((habit) => {
        const text = `${habit.nom ?? habit.titre ?? ""} ${habit.description ?? ""} ${labelCategorie(habit.categorie)} ${labelFrequence(habit.frequence)} ${labelPriorite(habit.priorite)}`.toLowerCase();
        return text.includes(query);
      });
    }
    return [...items].sort((a, b) => {
      if (sortBy === "priority_desc") return priorityRank(b.priorite) - priorityRank(a.priorite);
      if (sortBy === "priority_asc") return priorityRank(a.priorite) - priorityRank(b.priorite);
      if (sortBy === "status") return statusRank(a.statut) - statusRank(b.statut);
      return b._id.localeCompare(a._id);
    });
  }, [habits, search, sortBy, statusFilter]);

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setForm({
      nom: habit.nom ?? "",
      description: habit.description ?? "",
      categorie: habit.categorie ?? "autre",
      frequence: habit.frequence ?? "daily",
      priorite: habit.priorite ?? "medium",
      objectif_detail: habit.objectif_detail ?? "",
      visible_pour_tous: habit.visible_pour_tous === true,
      note: habit.note ?? "",
      date_debut: habit.date_debut ?? "",
    });
    setShowCreateModal(true);
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className={`user-shell ${sidebarOpen ? "" : "user-shell--sidebar-collapsed"} ${darkMode ? "user-shell--dark" : ""}`}>
      <aside className="user-sidebar">
        <div className="user-brand">
          <div className="user-brand-title">HabitFlow</div>
          <div className="user-brand-subtitle">Mes habitudes</div>
        </div>

        <nav className="user-nav">
          <Link href="/dashboard" className="user-nav-link">
            <IconHome size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/habits" className="user-nav-link active">
            <IconCheck size={18} />
            <span>Habitudes</span>
          </Link>
          <Link href="/dashboard/calendar" className="user-nav-link">
            <IconCalendarStats size={18} />
            <span>Calendrier</span>
          </Link>
          <Link href="/dashboard/progress" className="user-nav-link">
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
              className="user-sidebar-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            >
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={22} stroke={1.75} /> : <IconLayoutSidebarLeftExpand size={22} stroke={1.75} />}
            </button>
            <button
              type="button"
              className="user-theme-toggle"
              onClick={() => setDarkMode((v) => !v)}
              aria-pressed={darkMode}
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {darkMode ? <IconSun size={18} stroke={1.9} /> : <IconMoon size={18} stroke={1.9} />}
              <span>{darkMode ? "Clair" : "Sombre"}</span>
            </button>
          </div>
          <div className="user-topbar-user">
            <div className="user-avatar" />
            <div>
              <div className="user-user-name">
                {mounted ? ([user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "Utilisateur") : ""}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="user-content">
          <div className="container-fluid py-4">
            <div className="row">
              <div className="col-12">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                  <div>
                    <h1 className="h3 mb-1">Gestion des habitudes</h1>
                    <p className="text-secondary mb-0">Gérez vos habitudes personnelles avec les mêmes contrôles que l'administration.</p>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-body">
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-start align-items-md-center mb-4">
                      <div>
                        <div className="fw-semibold">Vue globale des habitudes</div>
                        <div className="text-secondary small">Filtrer, trier, modifier, dupliquer ou archiver vos habitudes.</div>
                      </div>
                      <button type="button" className="btn btn-primary" onClick={() => { setEditingHabit(null); setForm(emptyForm); setShowCreateModal(true); }}>
                        <IconPlus size={16} className="me-1" /> Nouvelle habitude
                      </button>
                    </div>

                    <div className="row gx-2 gy-3 mb-3">
                      <div className="col-12 col-md-6 col-lg-5">
                        <div className="input-group">
                          <span className="input-group-text">Recherche</span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Titre, catégorie, priorité..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-4">
                        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                          <option value="all">Tous</option>
                          <option value="active">Actives</option>
                          <option value="pause">En pause</option>
                          <option value="archived">Archivées</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6 col-lg-3">
                        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                          <option value="recent">Plus récentes</option>
                          <option value="priority_desc">Priorité haute</option>
                          <option value="priority_asc">Priorité basse</option>
                          <option value="status">Statut</option>
                        </select>
                      </div>
                    </div>

                    {error ? <div className="alert alert-danger">{error}</div> : null}

                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead>
                            <tr>
                              <th>Titre</th>
                              <th>Catégorie</th>
                              <th>Fréquence</th>
                              <th>Priorité</th>
                              <th>Statut</th>
                              <th>Date de début</th>
                              <th>Résultat</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHabits.map((habit) => {
                              return (
                                <tr key={habit._id}>
                                  <td>
                                    <div className="fw-semibold">{habit.nom || habit.titre || "Habitude"}</div>
                                    {habit.description ? <div className="text-secondary small">{habit.description}</div> : null}
                                    {habit.note ? <div className="text-secondary small" style={{fontStyle: 'italic'}}>📝 {habit.note}</div> : null}
                                  </td>
                                  <td>{labelCategorie(habit.categorie)}</td>
                                  <td>{labelFrequence(habit.frequence)}</td>
                                  <td>{labelPriorite(habit.priorite)}</td>
                                  <td>{labelStatut(habit.statut)}</td>
                                  <td>
                                    {editingDateHabitId === habit._id ? (
                                      <div className="d-flex gap-2 align-items-center">
                                        <input
                                          type="date"
                                          className="form-control form-control-sm"
                                          value={editingDate}
                                          onChange={(e) => setEditingDate(e.target.value)}
                                          disabled={creating}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-success"
                                          onClick={() => updateDate(habit._id, editingDate)}
                                          disabled={creating}
                                        >
                                          ✓
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-secondary"
                                          onClick={() => {
                                            setEditingDateHabitId(null);
                                            setEditingDate("");
                                          }}
                                          disabled={creating}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        style={{ cursor: "pointer", padding: "4px 8px" }}
                                        onClick={() => {
                                          setEditingDateHabitId(habit._id);
                                          setEditingDate(habit.date_debut ? habit.date_debut.split("T")[0] : "");
                                        }}
                                        title="Cliquer pour modifier"
                                      >
                                        {habit.date_debut ? new Date(habit.date_debut).toLocaleDateString("fr-FR") : "-"}
                                      </div>
                                    )}
                                  </td>
                              <td>
                                {todayStatus[habit._id]?.statut === "completee" ? (
                                  <span className="badge bg-success">Complétée</span>
                                ) : todayStatus[habit._id]?.statut === "partielle" ? (
                                  <span className="badge bg-warning text-dark">Partielle</span>
                                ) : (
                                  <span className="badge bg-secondary">Non complétée</span>
                                )}
                              </td>
                                  <td className="text-end">
                                    <div className="btn-group btn-group-sm" role="group">
                                      <button
                                        type="button"
                                        className={`btn ${todayStatus[habit._id]?.statut === "completee" ? "btn-success" : "btn-outline-success"}`}
                                        onClick={() => handleCompleteClick(habit._id)}
                                        disabled={creating}
                                        title={todayStatus[habit._id]?.statut === "completee" ? "Marquer comme non complétée" : "Marquer l'habitude comme complétée aujourd'hui"}
                                      >
                                        <IconCheck size={16} />
                                      </button>
                                      <button type="button" className="btn btn-outline-secondary" onClick={() => openEditHabit(habit)}>
                                        <IconEdit size={16} />
                                      </button>
                                      <button type="button" className="btn btn-outline-secondary" onClick={() => cloneHabit(habit._id)}>
                                        <IconCopy size={16} />
                                      </button>
                                      {habit.statut === "pause" ? (
                                        <button type="button" className="btn btn-outline-success" onClick={() => updateStatus(habit._id, "active")} disabled={creating}>
                                          <IconPlayerPlay size={16} />
                                        </button>
                                      ) : habit.statut === "active" ? (
                                        <button type="button" className="btn btn-outline-warning" onClick={() => updateStatus(habit._id, "pause")} disabled={creating}>
                                          <IconPlayerPause size={16} />
                                        </button>
                                      ) : (
                                        <button type="button" className="btn btn-outline-success" onClick={() => updateStatus(habit._id, "active")} disabled={creating}>
                                          <IconPlayerPlay size={16} />
                                        </button>
                                      )}
                                      <button type="button" className="btn btn-outline-info" onClick={() => openNotesModal(habit)} disabled={creating} title="Ajouter/modifier les notes">
                                        <IconNotes size={16} />
                                      </button>
                                      <button type="button" className="btn btn-outline-danger" onClick={() => archiveHabit(habit._id)} disabled={creating}>
                                        <IconArchive size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {!filteredHabits.length && (
                              <tr>
                                <td colSpan={8} className="text-secondary text-center py-4">
                                  Aucune habitude trouvée. Créez votre première habitude.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingHabit ? "Modifier l'habitude" : "Créer une nouvelle habitude"}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label htmlFor="nom" className="form-label">Nom de l'habitude *</label>
                        <input
                          type="text"
                          className="form-control"
                          id="nom"
                          value={form.nom}
                          onChange={(e) => setForm({ ...form, nom: e.target.value })}
                          placeholder="Ex: Faire du sport"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          id="description"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Description optionnelle de votre habitude"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="categorie" className="form-label">Catégorie</label>
                        <select
                          className="form-select"
                          id="categorie"
                          value={form.categorie}
                          onChange={(e) => setForm({ ...form, categorie: e.target.value as HabitForm["categorie"] })}
                        >
                          <option value="sante">Santé</option>
                          <option value="travail">Travail</option>
                          <option value="apprentissage">Apprentissage</option>
                          <option value="bien_etre">Bien-être</option>
                          <option value="sport">Sport</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="frequence" className="form-label">Fréquence</label>
                        <select
                          className="form-select"
                          id="frequence"
                          value={form.frequence}
                          onChange={(e) => setForm({ ...form, frequence: e.target.value as HabitForm["frequence"] })}
                        >
                          <option value="daily">Quotidienne</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuelle</option>
                          <option value="specific_days">Jours spécifiques</option>
                          <option value="times_per_week">Fois par semaine</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="priorite" className="form-label">Priorité</label>
                        <select
                          className="form-select"
                          id="priorite"
                          value={form.priorite}
                          onChange={(e) => setForm({ ...form, priorite: e.target.value as HabitForm["priorite"] })}
                        >
                          <option value="high">Haute</option>
                          <option value="medium">Moyenne</option>
                          <option value="low">Basse</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="objectif" className="form-label">Objectif détaillé</label>
                        <input
                          type="text"
                          className="form-control"
                          id="objectif"
                          value={form.objectif_detail}
                          onChange={(e) => setForm({ ...form, objectif_detail: e.target.value })}
                          placeholder="Ex: 30 minutes par jour"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="note" className="form-label">Note</label>
                        <textarea
                          className="form-control"
                          id="note"
                          rows={3}
                          value={form.note}
                          onChange={(e) => setForm({ ...form, note: e.target.value })}
                          placeholder="Ajouter une note personnelle sur cette habitude..."
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="date_debut" className="form-label">Date de début</label>
                        <input
                          type="date"
                          className="form-control"
                          id="date_debut"
                          value={form.date_debut || ""}
                          onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="dates_specifiques" className="form-label">Dates spécifiques (optionnel)</label>
                        <small className="text-secondary d-block mb-2">Sélectionnez les dates où cette habitude doit être effectuée</small>
                        <div className="d-flex gap-2 mb-2">
                          <input
                            type="date"
                            className="form-control"
                            id="dates_specifiques"
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              console.log("[DEBUG] Date selected:", selectedDate);
                              if (selectedDate) {
                                const currentDates = form.dates_specifiques || [];
                                console.log("[DEBUG] Current dates:", currentDates);
                                const newDates = Array.from(new Set([...currentDates, selectedDate]));
                                console.log("[DEBUG] New dates after adding:", newDates);
                                setForm({ ...form, dates_specifiques: newDates });
                                // Don't reset the input yet to allow easier testing
                              }
                            }}
                          />
                        </div>
                        {/* Debug: Always show the dates array status */}
                        <div className="alert alert-info" style={{ fontSize: "0.85rem" }}>
                          Dates dans le state: {form.dates_specifiques?.length || 0} sélectionnée(s)
                        </div>
                        {form.dates_specifiques && form.dates_specifiques.length > 0 && (
                          <div className="mb-2">
                            <small className="text-secondary d-block mb-2">Dates sélectionnées:</small>
                            <div className="d-flex flex-wrap gap-2">
                              {form.dates_specifiques.map((date, idx) => (
                                <span key={`${date}-${idx}`} className="badge bg-primary p-2">
                                  {new Date(date + "T00:00:00").toLocaleDateString("fr-FR")}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white ms-2"
                                    style={{ fontSize: "0.65rem" }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const filtered = form.dates_specifiques!.filter((d, i) => i !== idx);
                                      setForm({ ...form, dates_specifiques: filtered });
                                    }}
                                    aria-label="Remove"
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                      Annuler
                    </button>
                    <button type="button" className="btn btn-primary" onClick={saveHabit} disabled={creating || !form.nom.trim()}>
                      {creating ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>{editingHabit ? "Sauvegarde..." : "Création..."}</> : editingHabit ? "Enregistrer" : "Créer l'habitude"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photo Verification Modal */}
          {showPhotoModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <IconCamera size={20} className="me-2" />
                      Photo de vérification
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowPhotoModal(false)} disabled={creating}></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-secondary">Prenez une photo pour vérifier que vous avez complété cette habitude.</p>
                    
                    {photoPreview ? (
                      <div className="mb-3">
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", borderRadius: "8px", border: "2px solid #ddd" }}>
                          <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm mt-2"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoFile(null);
                          }}
                          disabled={creating}
                        >
                          <IconTrash size={16} className="me-2" />
                          Retirer la photo
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: "block", padding: "40px 20px", border: "2px dashed #ddd", borderRadius: "8px", textAlign: "center", cursor: "pointer", marginBottom: "1rem" }}>
                        <IconUpload size={40} style={{ color: "#999", marginBottom: "10px" }} />
                        <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>Cliquez pour sélectionner une photo</p>
                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#999" }}>ou glissez-déposez une image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoUpload(e.target.files[0]);
                            }
                          }}
                          style={{ display: "none" }}
                          disabled={creating}
                        />
                      </label>
                    )}

                    <div className="mb-3 mt-4">
                      <label htmlFor="photoNotes" className="form-label">Ajouter une note (optionnel)</label>
                      <textarea
                        id="photoNotes"
                        className="form-control"
                        rows={3}
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        placeholder="Décrivez comment vous avez complété cette habitude... (ex: 5 km courus en 35 minutes)"
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowPhotoModal(false)}
                      disabled={creating}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitPhotoAndComplete}
                      disabled={!photoFile || creating}
                    >
                      {creating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Vérification...
                        </>
                      ) : (
                        <>
                          <IconCheck size={16} className="me-2" />
                          Valider et marquer complété
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Modal */}
          {showNotesModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <IconNotes size={20} className="me-2" />
                      Notes sur l'habitude
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowNotesModal(false)} disabled={creating}></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-secondary">Ajoutez des notes personnelles sur cette habitude.</p>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={habitNotes}
                      onChange={(e) => setHabitNotes(e.target.value)}
                      placeholder="Entrez vos notes ici... (ex: Mes motivations, conseils, difficultés, etc.)"
                      disabled={creating}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => notesHabitId && loadNoteHistory(notesHabitId)}
                      disabled={creating}
                      title="Voir l'historique des modifications"
                    >
                      <IconHistory size={16} className="me-2" />
                      Historique
                    </button>
                    <div className="ms-auto">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowNotesModal(false)}
                        disabled={creating}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary ms-2"
                        onClick={saveHabitNotes}
                        disabled={creating}
                      >
                        {creating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <IconCheck size={16} className="me-2" />
                            Enregistrer les notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Note History Modal */}
          {showHistoryModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <IconHistory size={20} className="me-2" />
                      Historique des modifications
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    {noteHistory.length === 0 ? (
                      <p className="text-secondary text-center py-4">Aucune modification enregistrée.</p>
                    ) : (
                      <div className="timeline" style={{ paddingLeft: "20px" }}>
                        {noteHistory.map((entry) => (
                          <div key={entry._id} style={{ marginBottom: "2rem", position: "relative" }}>
                            <div style={{ position: "absolute", left: "-30px", top: "5px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#0d6efd" }} />
                            <div style={{ paddingLeft: "10px", borderLeft: "2px solid #ddd", paddingBottom: "1rem" }}>
                              <div className="fw-semibold">
                                {entry.utilisateur_id?.prenom} {entry.utilisateur_id?.nom}
                                <small className="ms-2 text-secondary">
                                  ({entry.utilisateur_id?.email})
                                </small>
                              </div>
                              <small className="text-secondary d-block mb-2">
                                {new Date(entry.createdAt).toLocaleString("fr-FR")}
                              </small>
                              <span className="badge bg-info me-2 mb-2">{entry.action === "created" ? "Créée" : entry.action === "updated" ? "Modifiée" : "Supprimée"}</span>
                              
                              {entry.old_note && (
                                <div className="mb-2">
                                  <small className="text-secondary d-block">Avant:</small>
                                  <div style={{ backgroundColor: "#f8f9fa", padding: "8px", borderRadius: "4px", borderLeft: "3px solid #dc3545" }}>
                                    <small>{entry.old_note || "(vide)"}</small>
                                  </div>
                                </div>
                              )}
                              
                              {entry.new_note && (
                                <div>
                                  <small className="text-secondary d-block">Après:</small>
                                  <div style={{ backgroundColor: "#f8f9fa", padding: "8px", borderRadius: "4px", borderLeft: "3px solid #28a745" }}>
                                    <small>{entry.new_note || "(vide)"}</small>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowHistoryModal(false)}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
