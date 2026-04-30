'use client';
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

interface CalendarDay {
  date: string;
  completed: boolean;
  total: number;
  completed_logs: number;
}

interface CalendarData {
  month: number;
  year: number;
  days: CalendarDay[];
  habits: { _id: string; nom: string; statut: string; log: { statut: string } | null }[];
  allHabits: { _id: string; nom: string; statut: string }[];
}

interface ProgressData {
  habits_progress: {
    habit_id: string;
    habit_nom: string;
    current_streak: number;
    completion_rate: number;
  }[];
}

function getLevel(completedLogs: number, total: number): number {
  if (total === 0) return 0;
  const rate = completedLogs / total;
  if (rate === 0) return 0;
  if (rate < 0.25) return 1;
  if (rate < 0.5)  return 2;
  if (rate < 0.75) return 3;
  return 4;
}

function isoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function rateClass(completed: number, total: number): string {
  if (total === 0) return "";
  const r = completed / total;
  if (r >= 1)    return " hist-day-row--done";
  if (r >= 0.5)  return " hist-day-row--partial";
  return " hist-day-row--low";
}

export default function History() {
  const [calDays,    setCalDays]    = useState<CalendarDay[]>([]);
  const [monthHabits,setMonthHabits] = useState<CalendarData["habits"]>([]);
  const [allHabits,  setAllHabits]  = useState<CalendarData["allHabits"]>([]);
  const [progress,   setProgress]   = useState<ProgressData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [open,       setOpen]       = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const months = [0, 1, 2].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    });

    Promise.all([
      apiFetch<CalendarData>(`/progress/calendar?date=${months[0]}`),
      apiFetch<CalendarData>(`/progress/calendar?date=${months[1]}`).catch(() => null),
      apiFetch<CalendarData>(`/progress/calendar?date=${months[2]}`).catch(() => null),
      apiFetch<ProgressData>("/progress/my").catch(() => null),
    ]).then(([cur, prev1, prev2, prog]) => {
      const allDays: CalendarDay[] = [
        ...(prev2?.days ?? []),
        ...(prev1?.days ?? []),
        ...(cur?.days   ?? []),
      ];
      setCalDays(allDays);
      setMonthHabits(cur?.habits ?? []);
      setAllHabits(cur?.allHabits ?? []);
      setProgress(prog);
      setOpen(isoDate(now));
    }).finally(() => setLoading(false));
  }, []);

  // 12-week heatmap — 84 cells, column-first (oldest top-left)
  const heatmap = useMemo(() => {
    const dayMap = new Map(calDays.map(d => [d.date, d]));
    const today  = new Date();
    return Array.from({ length: 84 }, (_, i) => {
      const d   = new Date(today);
      d.setDate(today.getDate() - (83 - i));
      const key = isoDate(d);
      const day = dayMap.get(key);
      return {
        date:          key,
        level:         day ? getLevel(day.completed_logs, day.total) : 0,
        completed_logs: day?.completed_logs ?? 0,
        total:          day?.total ?? 0,
      };
    });
  }, [calDays]);

  // 3 recent weeks for the accordion
  const weeks = useMemo(() => {
    const dayMap    = new Map(calDays.map(d => [d.date, d]));
    const today     = new Date();
    const dayOfWeek = today.getDay() || 7;

    return [0, 1, 2].map(offset => {
      const days = Array.from({ length: offset === 0 ? dayOfWeek : 7 }, (_, i) => {
        const d   = new Date(today);
        d.setDate(today.getDate() - (dayOfWeek - 1) - offset * 7 + i);
        const key = isoDate(d);
        const cal = dayMap.get(key);
        return {
          key,
          weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }),
          dayNum:  d.toLocaleDateString("fr-FR", { day: "2-digit" }),
          label:   d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
          completed: cal?.completed_logs ?? 0,
          total:     cal?.total ?? 0,
        };
      }).reverse();

      return {
        label: offset === 0 ? "Cette semaine" : offset === 1 ? "Semaine dernière" : "Il y a 2 semaines",
        days,
      };
    });
  }, [calDays]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Chargement…</span>
        </div>
      </div>
    );
  }

  const topStreak = progress?.habits_progress?.[0]?.current_streak ?? 0;

  return (
    <div className="mx-auto w-100" style={{ maxWidth: 780 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="hist-title">Historique</h1>
        <p className="hist-subtitle">Votre activité des 3 derniers mois, semaine par semaine</p>
      </div>

      {/* ── Heatmap ─────────────────────────────────────────── */}
      <div className="hist-heatmap-card mb-4">
        <div className="hist-heatmap-header">
          <div>
            <p className="hist-heatmap-title">Activité — 12 semaines</p>
            <p className="hist-heatmap-sub">Chaque carré représente un jour</p>
          </div>
          <div className="hist-legend">
            <span>Moins</span>
            {[0,1,2,3,4].map(l => (
              <span key={l} className={`hist-cell hist-cell-${l}`} style={{ display: 'inline-block' }} />
            ))}
            <span>Plus</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div className="hist-heatmap-grid">
            {heatmap.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.003, ease: "easeOut" }}
                className={`hist-cell hist-cell-${d.level}`}
                title={`${d.date} · ${d.completed_logs}/${d.total}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly accordion ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {weeks.map((w) => (
          <section key={w.label}>
            <div className="hist-section-label">
              <span>{w.label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {w.days.map((day) => {
                const isOpen = open === day.key;
                const dotCount = Math.min(Math.max(day.total, 1), 7);

                return (
                  <div key={day.key}>
                    <button
                      onClick={() => setOpen(isOpen ? null : day.key)}
                      className={`hist-day-row${isOpen ? " is-open" : ""}${rateClass(day.completed, day.total)}`}
                    >
                      {/* Date badge */}
                      <div className="hist-date-badge">
                        <span className="hist-date-badge-day">{day.weekday}</span>
                        <span className="hist-date-badge-num">{day.dayNum}</span>
                      </div>

                      {/* Label + count */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="hist-day-label">{day.label}</p>
                        <p className="hist-day-count">
                          {day.completed}/{day.total} habitude{day.total !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Progress dots */}
                      <div className="hist-dots d-none d-sm-flex">
                        {Array.from({ length: dotCount }).map((_, i) => (
                          <span key={i} className={`hist-dot${i < day.completed ? " done" : ""}`} />
                        ))}
                      </div>

                      {/* Streak chip */}
                      {topStreak > 0 && (
                        <span
                          className="d-none d-md-inline-flex align-items-center gap-1 fw-semibold"
                          style={{ fontSize: '0.75rem', color: '#F97316', background: 'rgba(249,115,22,0.1)', borderRadius: 99, padding: '3px 10px', flexShrink: 0 }}
                        >
                          <Flame size={12} />
                          {topStreak}j
                        </span>
                      )}

                      {/* Chevron */}
                      <ChevronDown
                        size={16}
                        className={`hist-chevron${isOpen ? " open" : ""}`}
                      />
                    </button>

                    {/* Expanded habit list */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="hist-habit-list">
                            {allHabits.length === 0 ? (
                              <p style={{ gridColumn: '1/-1', fontSize: '0.8125rem', color: 'var(--hf-text-muted)', margin: 0 }}>
                                Aucune habitude trouvée
                              </p>
                            ) : allHabits.map((h) => {
                              const dayData = calDays.find(d => d.date === day.key);
                              const done = dayData
                                ? monthHabits.some(mh => mh._id === h._id && mh.log?.statut === "completee")
                                : false;
                              return (
                                <div key={h._id} className="hist-habit-item">
                                  <div className="hist-habit-icon">
                                    <Flame size={14} />
                                  </div>
                                  <p className="hist-habit-name">{h.nom}</p>
                                  <span className={`hist-habit-badge ${done ? "done" : "not-done"}`}>
                                    {done ? "Fait" : "—"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
