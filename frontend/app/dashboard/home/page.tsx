'use client';
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Trophy, Zap, CheckCircle2, Circle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { userFirstName } from "@/lib/userDisplay";
import { useToast } from "@/components/Toast";
import { HabitItem, type HabitProgressItem } from "../_components/HabitItem";

interface ProgressData {
  summary: {
    total_habits: number;
    active_habits: number;
    completion_rate: number;
    today_completed: number;
    today_logs: number;
    today_rate: number;
    total_logs: number;
    completed_logs: number;
  };
  weekly_progress: { date: string; label: string; total: number; completed: number; rate: number }[];
  habits_progress: HabitProgressItem[];
}

interface TodayData {
  habits: { _id: string; nom: string; statut: string }[];
  logs: { _id: string; habit_id: string; statut: string }[];
}

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function MiniCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>
          {MONTHS[month]} {year}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '2px 6px', borderRadius: 6 }}>‹</button>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '2px 6px', borderRadius: 6 }}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['D','L','M','M','J','V','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 12, padding: '5px 0',
            borderRadius: 8,
            background: (d && isCurrentMonth && d === today) ? '#4338CA' : 'transparent',
            color: (d && isCurrentMonth && d === today) ? '#fff'
                 : d ? '#374151' : 'transparent',
            fontWeight: (d && isCurrentMonth && d === today) ? 700 : 400,
          }}>{d || ''}</div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [today,    setToday]    = useState<TodayData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [togglingHabitId, setTogglingHabitId] = useState<string | null>(null);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; prenom?: string; nom?: string } | null>(null);

  useEffect(() => {
    setUser(getUser<{ firstName?: string; lastName?: string; prenom?: string; nom?: string }>());
    Promise.all([
      apiFetch<ProgressData>("/progress/my"),
      apiFetch<TodayData>("/progress/today"),
    ])
      .then(([p, t]) => { setProgress(p); setToday(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const todayHabits = useMemo<HabitProgressItem[]>(() => {
    if (!progress || !today) return progress?.habits_progress.slice(0, 6) ?? [];
    const doneIds = new Set(today.logs.filter(l => l.statut === "completee").map(l => l.habit_id));
    return progress.habits_progress.slice(0, 6).map(h => ({
      ...h,
      is_done_today: doneIds.has(h.habit_id),
    }));
  }, [progress, today]);

  const completedToday = progress?.summary.today_completed ?? 0;
  const totalToday     = progress?.summary.today_logs || todayHabits.length || 1;
  const completionRate = totalToday ? Math.round((completedToday / totalToday) * 100) : (progress?.summary.today_rate ?? 0);
  const ringDash       = useMemo(() => (completionRate / 100) * 220, [completionRate]);

  const firstName = userFirstName(user) || "vous";
  const todayLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const handleToggle = async (habitId: string) => {
    if (!today || togglingHabitId) return;
    const existing   = today.logs.find(l => String(l.habit_id) === String(habitId));
    const willComplete = existing?.statut !== "completee";
    const prevToday    = today;
    const prevProgress = progress;

    const optimisticLogs = existing
      ? today.logs.map(l => String(l.habit_id) === String(habitId) ? { ...l, statut: willComplete ? "completee" : "non_completee" } : l)
      : [...today.logs, { _id: `temp-${habitId}`, habit_id: habitId, statut: "completee" }];

    setTogglingHabitId(habitId);
    setToday({ ...today, logs: optimisticLogs });
    setProgress(prev => {
      if (!prev) return prev;
      const delta = willComplete ? 1 : -1;
      const nextCompleted = Math.max(0, (prev.summary.today_completed || 0) + delta);
      const total = prev.summary.today_logs || todayHabits.length || 1;
      return { ...prev, summary: { ...prev.summary, today_completed: nextCompleted, today_rate: Math.round((nextCompleted / total) * 100) } };
    });

    try {
      await apiFetch("/logs/toggle", { method: "POST", body: JSON.stringify({ habit_id: habitId, date: new Date().toISOString() }) });
      const refreshed = await apiFetch<TodayData>("/progress/today");
      setToday(refreshed);
      toast({ variant: "success", title: willComplete ? "Habitude complétée ✓" : "Habitude non complétée" });
    } catch (error) {
      setToday(prevToday);
      setProgress(prevProgress);
      toast({ variant: "error", title: "Erreur", description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setTogglingHabitId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#4338CA" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, color: '#64748B' }}>Chargement…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4, textTransform: 'capitalize' }}>{todayLabel}</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
            Welcome back, <span style={{ color: '#4338CA' }}>{firstName}</span>.
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 6, fontStyle: 'italic' }}>
            &ldquo;Excellence is not an act, but a habit.&rdquo; — Aristotle
          </p>
        </div>

        {/* Today's progress card */}
        <div style={{
          background: '#4338CA',
          borderRadius: 16, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          flexShrink: 0, minWidth: 180,
        }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Today&apos;s Progress
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '2px 0 0', letterSpacing: '-1px' }}>
              {completionRate}%
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: 500 }}>Completed</p>
          </div>
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/>
              <motion.circle
                cx="26" cy="26" r="22" fill="none"
                stroke="white" strokeWidth="4" strokeLinecap="round"
                initial={{ strokeDasharray: "0 138.2" }}
                animate={{ strokeDasharray: `${(completionRate / 100) * 138.2} 138.2` }}
                transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Habitudes actives', value: progress?.summary.active_habits ?? 0, color: '#4338CA', bg: '#EEF2FF', icon: '⚡' },
          { label: 'Taux global',        value: `${progress?.summary.completion_rate ?? 0}%`, color: '#059669', bg: '#ECFDF5', icon: '📈' },
          { label: 'Total logs',          value: progress?.summary.total_logs ?? 0, color: '#D97706', bg: '#FFFBEB', icon: '🏆' },
          { label: 'Complétés',          value: progress?.summary.completed_logs ?? 0, color: '#7C3AED', bg: '#F5F3FF', icon: '✓' },
        ].map(card => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#FFFFFF', borderRadius: 14, padding: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500, margin: 0 }}>{card.label}</p>
              <span style={{
                width: 28, height: 28, borderRadius: 8, background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: card.color, margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Content grid ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>

        {/* Today's Habits */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>
                📋 Today&apos;s Habits
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                Cliquez sur le cercle pour marquer comme fait
              </p>
            </div>
            <a href="/dashboard/habits" style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', textDecoration: 'none' }}>
              Voir tout →
            </a>
          </div>

          {todayHabits.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 100, borderRadius: 14, border: '1.5px dashed #E5E7EB',
              color: '#9CA3AF', fontSize: 13,
            }}>
              Aucune habitude pour aujourd&apos;hui
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayHabits.map((h, i) => (
                <HabitItem
                  key={h.habit_id}
                  habit={h}
                  index={i}
                  onToggle={handleToggle}
                  disabled={togglingHabitId === h.habit_id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Active Streaks */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔥 Active Streaks
            </h3>
            {[...todayHabits]
              .sort((a, b) => b.current_streak - a.current_streak)
              .slice(0, 4)
              .map(h => (
                <div key={h.habit_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid #F3F4F6',
                }}>
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.habit_nom}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ height: 4, width: 48, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, h.current_streak * 3)}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: '#F97316', borderRadius: 4 }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316', minWidth: 28, textAlign: 'right' }}>
                      {h.current_streak}j
                    </span>
                  </div>
                </div>
              ))}
            {todayHabits.length === 0 && (
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Aucune série active</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .home-grid { grid-template-columns: 1fr !important; }
          .home-right { display: none !important; }
        }
      `}</style>
    </div>
  );
}
