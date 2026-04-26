'use client';
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";

interface CalendarDay {
  date: string; // "YYYY-MM-DD"
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

const levelColor = ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"];

function getLevel(completedLogs: number, total: number): number {
  if (total === 0) return 0;
  const rate = completedLogs / total;
  if (rate === 0) return 0;
  if (rate < 0.25) return 1;
  if (rate < 0.5) return 2;
  if (rate < 0.75) return 3;
  return 4;
}

function isoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function History() {
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [monthHabits, setMonthHabits] = useState<CalendarData["habits"]>([]);
  const [allHabits, setAllHabits] = useState<CalendarData["allHabits"]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

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
      // Merge all calendar days from 3 months
      const allDays: CalendarDay[] = [
        ...(prev2?.days ?? []),
        ...(prev1?.days ?? []),
        ...(cur?.days ?? []),
      ];
      setCalDays(allDays);
      setMonthHabits(cur?.habits ?? []);
      setAllHabits(cur?.allHabits ?? []);
      setProgress(prog);
      // Open the most recent day that has data
      const today = isoDate(now);
      setOpen(today);
    }).finally(() => setLoading(false));
  }, []);

  // Build last 84 cells (12 weeks × 7 days), most recent = last cell
  const heatmap = useMemo(() => {
    const dayMap = new Map(calDays.map(d => [d.date, d]));
    const today = new Date();
    return Array.from({ length: 84 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (83 - i));
      const key = isoDate(d);
      const day = dayMap.get(key);
      return {
        date: key,
        level: day ? getLevel(day.completed_logs, day.total) : 0,
        completed_logs: day?.completed_logs ?? 0,
        total: day?.total ?? 0,
      };
    });
  }, [calDays]);

  // Build 3 weeks for accordion
  const weeks = useMemo(() => {
    const dayMap = new Map(calDays.map(d => [d.date, d]));
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // Mon=1..Sun=7

    return [0, 1, 2].map(offset => {
      const days = Array.from({ length: offset === 0 ? dayOfWeek : 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (dayOfWeek - 1) - offset * 7 + i);
        const key = isoDate(d);
        const cal = dayMap.get(key);
        return {
          key,
          label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }),
          completed: cal?.completed_logs ?? 0,
          total: cal?.total ?? 0,
        };
      }).reverse();

      return {
        label: offset === 0 ? "Cette semaine" : offset === 1 ? "La semaine dernière" : "Il y a 2 semaines",
        days,
      };
    });
  }, [calDays]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Historique</h1>
        <p className="mt-1 text-sm text-muted-foreground">Regardez en arrière sur votre parcours, semaine par semaine</p>
      </div>

      {/* 12-week heatmap */}
      <div className="card-elevated p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Activité sur 12 semaines</h3>
            <p className="text-xs text-muted-foreground">Chaque carré représente un jour</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            Moins
            {levelColor.map((c, i) => <span key={i} className={cn("h-3 w-3 rounded-sm", c)} />)}
            Plus
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5" style={{ width: "max-content" }}>
            {heatmap.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.003 }}
                className={cn(
                  "h-3.5 w-3.5 rounded-sm transition-smooth hover:ring-2 hover:ring-primary hover:ring-offset-1",
                  levelColor[d.level]
                )}
                title={`${d.date} · ${d.completed_logs}/${d.total} habitudes`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Weekly accordion */}
      <div className="space-y-6">
        {weeks.map((w) => (
          <section key={w.label}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{w.label}</h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {w.days.map((day) => {
                const isOpen = open === day.key;
                const barMax = Math.max(day.total || 6, 1);
                return (
                  <div key={day.key} className="card-elevated overflow-hidden">
                    <button
                      onClick={() => setOpen(isOpen ? null : day.key)}
                      className="flex w-full items-center gap-4 p-4 text-left transition-smooth hover:bg-muted/40"
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-soft">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {day.label.split(" ")[0]}
                        </span>
                        <span className="text-lg font-bold leading-none text-foreground">
                          {day.label.split(" ")[1]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{day.label}</p>
                        <p className="text-xs text-muted-foreground">{day.completed}/{barMax} habitudes</p>
                      </div>
                      <div className="hidden items-center gap-1 sm:flex">
                        {Array.from({ length: Math.min(barMax, 6) }).map((_, i) => (
                          <span
                            key={i}
                            className={cn("h-2 w-6 rounded-full", i < day.completed ? "bg-gradient-primary" : "bg-muted")}
                          />
                        ))}
                      </div>
                      {progress && progress.habits_progress[0] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          <Flame className="h-3 w-3 text-streak" />
                          {progress.habits_progress[0].current_streak}j
                        </span>
                      )}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden border-t border-border/60"
                        >
                          <div className="p-4">
                            {allHabits.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Aucune habitude trouvée</p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {allHabits.map((h) => {
                                  // For the current month we have log data; for other days fallback to "unknown"
                                  const dayCalData = calDays.find(d => d.date === day.key);
                                  const done = dayCalData
                                    ? monthHabits.find(mh => mh._id === h._id && mh.log?.statut === "completee") != null
                                    : false;
                                  return (
                                    <div key={h._id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <Flame className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{h.nom}</p>
                                        <p className="text-[11px] capitalize text-muted-foreground">{h.statut}</p>
                                      </div>
                                      <span
                                        className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                          done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                                        )}
                                      >
                                        {done ? "Fait" : "Non fait"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
