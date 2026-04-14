"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  IconCircleFilled,
  IconCamera,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/api";
import { clearAuth, getToken, getUser } from "@/lib/auth";
import "../../admin/admin-layout.css";

type Habit = {
  _id: string;
  nom?: string;
  statut?: string;
  visible_pour_tous?: boolean;
  utilisateur_id?: string;
};

type HabitLog = {
  _id: string;
  habit_id: string;
  date: string;
  statut: string;
  notes?: string;
  photo_url?: string;
};

type CalendarDay = {
  date: string;
  completed: boolean;
  total: number;
  completed_logs: number;
};

type CalendarPayload = {
  month: number;
  year: number;
  selectedDate: string;
  days: CalendarDay[];
  habits: Array<Habit & { log: HabitLog | null }>;
  allHabits?: Habit[];
  allLogs?: HabitLog[];
};

function dayKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear().toString().padStart(4, "0")}-${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type HabitStatusMap = Record<string, Record<string, HabitLog | null>>;

function getStatusColor(statut?: string): string {
  switch (statut) {
    case "completee":
      return "#10b981"; // green
    case "manquee":
      return "#ef4444"; // red
    default:
      return "#9ca3af"; // gray
  }
}

function getStatusLabel(statut?: string): string {
  switch (statut) {
    case "completee":
      return "Complétée";
    case "manquee":
      return "Manquée";
    default:
      return "Sans données";
  }
}

export default function DashboardCalendarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [habits, setHabits] = useState<Array<Habit & { log: HabitLog | null }>>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  // Catch-up feature states
  const [showCatchupModal, setShowCatchupModal] = useState(false);
  const [catchupDate, setCatchupDate] = useState("");
  const [incompleteHabits, setIncompleteHabits] = useState<Array<{ habit_id: string; nom: string; categorie: string; frequence: string; current_status: string | null; has_photo: boolean }>>([]);
  const [selectedHabitForCatchup, setSelectedHabitForCatchup] = useState<string | null>(null);
  const [catchupPhotoFile, setCatchupPhotoFile] = useState<File | null>(null);
  const [catchupPhotoPreview, setCatchupPhotoPreview] = useState<string | null>(null);
  const [catchupPhotoNotes, setCatchupPhotoNotes] = useState("");
  const [catchupLoading, setCatchupLoading] = useState(false);
  const router = useRouter();
  const user = getUser<{ prenom?: string; nom?: string; email?: string }>();

  const loadCalendar = useCallback(async (isoDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiFetch<CalendarPayload>(`/progress/calendar?date=${encodeURIComponent(isoDate)}`);
      setSelectedDate(payload.selectedDate);
      setDays(payload.days);
      setHabits(payload.habits);
      setAllHabits(payload.allHabits || payload.habits.map(h => ({ _id: h._id, nom: h.nom, statut: h.statut, visible_pour_tous: h.visible_pour_tous, utilisateur_id: h.utilisateur_id })));
      setAllLogs(payload.allLogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    loadCalendar(dayKey(monthDate));
  }, [currentMonth, loadCalendar]);

  const selectedLabel = useMemo(() => {
    const dateToUse = hoveredDate || selectedDate;
    if (!dateToUse) return "";
    const [year, month, day] = dateToUse.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [selectedDate, hoveredDate]);

  const calendarCells = useMemo(() => {
    const cells: Array<Date | null> = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startIndex = ((firstDay.getDay() + 6) % 7);
    for (let i = 0; i < startIndex; i += 1) {
      cells.push(null);
    }
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    return cells;
  }, [currentMonth]);

  const habitLogsMap = useMemo(() => {
    const map: HabitStatusMap = {};
    allLogs.forEach((log) => {
      const dateKey = dayKey(log.date);
      if (!map[dateKey]) map[dateKey] = {};
      map[dateKey][log.habit_id.toString ? log.habit_id.toString() : String(log.habit_id)] = log;
    });
    return map;
  }, [allLogs]);

  const changeMonth = (offset: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleSelectDay = async (date: string) => {
    setSelectedDate(date);
    await loadCalendar(date);
  };

  const loadIncompleteHabits = async (date: string) => {
    try {
      setCatchupLoading(true);
      setError(null);
      console.log("[DEBUG] Loading incomplete habits for date:", date);
      const result = await apiFetch<{ date: string; incomplete_habits: Array<{ habit_id: string; nom: string; categorie: string; frequence: string; current_status: string | null; has_photo: boolean }> }>(
        `/logs/incomplete-for-date/${date}`
      );
      console.log("[DEBUG] API Response:", result);
      console.log("[DEBUG] Incomplete habits count:", result.incomplete_habits?.length || 0);
      setIncompleteHabits(result.incomplete_habits || []);
      setCatchupDate(date);
      setShowCatchupModal(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors du chargement des habitudes incomplètes";
      console.error("[DEBUG] Error loading incomplete habits:", err);
      setError(errorMsg);
    } finally {
      setCatchupLoading(false);
    }
  };

  const handleCatchupPhotoUpload = (file: File) => {
    setCatchupPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCatchupPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitCatchup = async () => {
    if (!selectedHabitForCatchup || !catchupPhotoFile) {
      setError("Veuillez sélectionner une habitude et prendre une photo");
      return;
    }

    try {
      setCatchupLoading(true);
      setError(null);
      
      // Convert photo to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoDataUrl = e.target?.result as string;
        await apiFetch("/logs/catchup", {
          method: "POST",
          body: JSON.stringify({
            habit_id: selectedHabitForCatchup,
            date: catchupDate,
            photo_url: photoDataUrl,
            notes: catchupPhotoNotes || undefined
          })
        });
        
        // Reload calendar
        await loadCalendar(selectedDate);
        setShowCatchupModal(false);
        setCatchupPhotoFile(null);
        setCatchupPhotoPreview(null);
        setCatchupPhotoNotes("");
        setSelectedHabitForCatchup(null);
      };
      reader.readAsDataURL(catchupPhotoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du rattrapage");
    } finally {
      setCatchupLoading(false);
    }
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
          <div className="user-brand-subtitle">Calendrier</div>
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
          <Link href="/dashboard/calendar" className="user-nav-link active">
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
            <button type="button" className="btn btn-ghost" onClick={() => setSidebarOpen((o) => !o)}>
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse size={20} /> : <IconLayoutSidebarLeftExpand size={20} />}
            </button>
            <button type="button" className="btn btn-ghost ms-2" onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
            <div className="user-topbar-title">
              <h1 className="h3 mb-0">Calendrier des habitudes</h1>
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
                <h2 className="h3 mb-1">Calendrier du mois</h2>
                <p className="text-secondary mb-0">Sélectionnez un jour pour afficher les habitudes et statuts associés.</p>
              </div>
              <div>
                <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={() => changeMonth(-1)}>
                  Mois précédent
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => changeMonth(1)}>
                  Mois suivant
                </button>
              </div>
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            {/* Catch-up Section */}
            <div className="card mb-4 border-info">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center gap-2 mb-3">
                  <IconMoon size={20} />
                  Rattraper des habitudes
                </h5>
                <p className="text-secondary small mb-3">Sélectionnez une date passée pour voir les habitudes non complétées et les rattraper avec une justification.</p>
                <div className="d-flex gap-2">
                  <input
                    type="date"
                    className="form-control"
                    style={{ maxWidth: "200px" }}
                    onChange={(e) => {
                      if (e.target.value) {
                        loadIncompleteHabits(e.target.value);
                      }
                    }}
                  />
                  <span className="text-secondary small align-self-center">Sélectionnez une date pour voir les habitudes à rattraper</span>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="h5 mb-0">{formatMonthLabel(currentMonth)}</div>
                  <div className="text-secondary small">Cliquez sur un jour pour voir les détails</div>
                </div>

                {/* Legend */}
                <div className="mb-4 p-3 bg-light rounded d-flex gap-3 flex-wrap justify-content-center">
                  <div className="d-flex align-items-center gap-2">
                    <IconCircleFilled size={16} color={getStatusColor("completee")} />
                    <small>Complétée</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <IconCircleFilled size={16} color={getStatusColor("manquee")} />
                    <small>Manquée</small>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.5rem" }}>
                  {WEEK_DAYS.map((label) => (
                    <div key={label} className="text-center text-secondary small fw-bold">
                      {label}
                    </div>
                  ))}
                  {calendarCells.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="rounded border bg-light" style={{ minHeight: "100px" }} />;
                    }

                    const iso = dayKey(day);
                    const isSelected = selectedDate === iso;
                    const dayLogs = habitLogsMap[iso] || {};
                    const dayHabitsCount = allHabits.length;
                    const completedCount = Object.values(dayLogs).filter(log => log?.statut === "completee").length;
                    const missedCount = Object.values(dayLogs).filter(log => log?.statut === "manquee").length;

                    const classNames = [
                      "btn",
                      "text-start",
                      "p-2",
                      "border",
                      "d-flex",
                      "flex-column",
                      "justify-content-between",
                    ];
                    if (isSelected) {
                      classNames.push("border-primary", "bg-primary", "text-white");
                    } else {
                      classNames.push("bg-white");
                    }

                    return (
                      <button
                        key={iso}
                        type="button"
                        className={classNames.join(" ")}
                        style={{ minHeight: "100px", position: "relative" }}
                        onClick={() => handleSelectDay(iso)}
                        onMouseEnter={() => setHoveredDate(iso)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={loading}
                        title={`${completedCount} complétées, ${missedCount} manquées`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong className={isSelected ? "text-white" : ""}>{day.getDate()}</strong>
                          {dayHabitsCount > 0 && (
                            <small className={isSelected ? "text-light" : "text-secondary"}>
                              {completedCount}/{dayHabitsCount}
                            </small>
                          )}
                        </div>

                        {/* Habit status indicators */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                          {allHabits.map((habit) => {
                            const log = dayLogs[habit._id.toString ? habit._id.toString() : String(habit._id)];
                            const statut = log?.statut;
                            const color = getStatusColor(statut);
                            return (
                              <div
                                key={habit._id}
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: color,
                                  opacity: isSelected ? 0.8 : 1,
                                }}
                                title={`${habit.nom}: ${getStatusLabel(statut)}`}
                              />
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <span>Habitudes du {selectedLabel}</span>
              </div>
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Habitude</th>
                      <th>Catégorie</th>
                      <th style={{ width: "120px" }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHabits.map((habit) => {
                      let log: HabitLog | null = null;
                      
                      // Si on a un jour survolé, chercher les logs dans habitLogsMap
                      if (hoveredDate) {
                        const dayLogs = habitLogsMap[hoveredDate] || {};
                        log = dayLogs[habit._id.toString ? habit._id.toString() : String(habit._id)] || null;
                      } else {
                        // Sinon, utiliser les données du jour sélectionné depuis l'API
                        const habitWithLog = habits.find(h => h._id.toString() === habit._id.toString());
                        log = habitWithLog?.log || null;
                      }
                      
                      const statut = log?.statut;
                      const color = getStatusColor(statut);
                      const label = getStatusLabel(statut);

                      return (
                        <tr key={habit._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  backgroundColor: color,
                                  flexShrink: 0,
                                }}
                              />
                              {habit.nom || "-"}
                            </div>
                          </td>
                          <td>{habit.statut === "pause" ? "Pause" : habit.statut === "archived" ? "Archivée" : "Active"}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: color,
                                color: "white"
                              }}
                            >
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!allHabits.length && (
                      <tr>
                        <td colSpan={4} className="text-secondary text-center py-4">
                          Aucune habitude définie.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Catch-up Modal */}
        {showCatchupModal && (
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <IconCamera size={20} className="me-2" style={{ display: "inline" }} />
                    Rattraper avec photo
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowCatchupModal(false)} disabled={catchupLoading}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label"><strong>Date: {new Date(catchupDate + "T00:00:00").toLocaleDateString("fr-FR")}</strong></label>
                  </div>

                  {incompleteHabits.length > 0 ? (
                    <>
                      {!selectedHabitForCatchup ? (
                        <div className="mb-3">
                          <label className="form-label">Habitudes non complétées ({incompleteHabits.length})</label>
                          <div className="list-group list-group-sm">
                            {incompleteHabits.map((habit) => (
                              <button
                                key={habit.habit_id}
                                type="button"
                                className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                                onClick={() => setSelectedHabitForCatchup(habit.habit_id)}
                              >
                                <div className="flex-grow-1 text-start">
                                  <div className="fw-bold">{habit.nom}</div>
                                  <small className="text-secondary">{habit.categorie} • {habit.frequence}</small>
                                </div>
                                <IconCamera size={16} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm mb-3"
                              onClick={() => setSelectedHabitForCatchup(null)}
                              disabled={catchupLoading}
                            >
                              ← Changer l'habitude
                            </button>
                            <p className="mb-2"><strong>{incompleteHabits.find(h => h.habit_id === selectedHabitForCatchup)?.nom}</strong></p>
                          </div>

                          <p className="text-secondary mb-3">Prenez une photo pour vérifier que vous avez complété cette habitude.</p>
                          
                          {catchupPhotoPreview ? (
                            <div className="mb-3">
                              <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", borderRadius: "8px", border: "2px solid #ddd" }}>
                                <img src={catchupPhotoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm mt-2"
                                onClick={() => {
                                  setCatchupPhotoPreview(null);
                                  setCatchupPhotoFile(null);
                                }}
                                disabled={catchupLoading}
                              >
                                Retirer la photo
                              </button>
                            </div>
                          ) : (
                            <label style={{ display: "block", padding: "40px 20px", border: "2px dashed #ddd", borderRadius: "8px", textAlign: "center", cursor: "pointer", marginBottom: "1rem" }}>
                              <IconCamera size={40} style={{ color: "#999", marginBottom: "10px", display: "block" }} />
                              <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>Cliquez pour sélectionner une photo</p>
                              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#999" }}>ou glissez-déposez une image</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleCatchupPhotoUpload(e.target.files[0]);
                                  }
                                }}
                                style={{ display: "none" }}
                                disabled={catchupLoading}
                              />
                            </label>
                          )}

                          <div className="mb-3">
                            <label htmlFor="catchupPhotoNotes" className="form-label">Ajouter une note (optionnel)</label>
                            <textarea
                              id="catchupPhotoNotes"
                              className="form-control"
                              rows={2}
                              value={catchupPhotoNotes}
                              onChange={(e) => setCatchupPhotoNotes(e.target.value)}
                              placeholder="Décrivez comment vous avez complété cette habitude..."
                              disabled={catchupLoading}
                            />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-info">
                      Aucune habitude non complétée pour cette date.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCatchupModal(false);
                      setSelectedHabitForCatchup(null);
                      setCatchupPhotoFile(null);
                      setCatchupPhotoPreview(null);
                      setCatchupPhotoNotes("");
                    }}
                    disabled={catchupLoading}
                  >
                    Annuler
                  </button>
                  {selectedHabitForCatchup && (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={submitCatchup}
                      disabled={catchupLoading || !catchupPhotoFile}
                    >
                      {catchupLoading ? "Sauvegarde..." : "Valider le rattrapage"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
