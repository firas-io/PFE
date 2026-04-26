'use client';
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

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
  habits_progress: {
    habit_id: string;
    habit_nom: string;
    completion_rate: number;
    current_streak: number;
    best_streak: number;
    total_logs: number;
    completed_logs: number;
  }[];
}

const card: React.CSSProperties = {
  background: '#FFFFFF', borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  padding: '20px',
};

export default function Analytics() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    apiFetch<ProgressData>("/progress/my")
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const weeklyChartData = useMemo(() => {
    if (!progress) return [];
    return progress.weekly_progress.map(d => ({
      day: d.label.split(" ")[0],
      rate: d.rate,
      completed: d.completed,
      total: d.total,
    }));
  }, [progress]);

  const bestStreak = useMemo(() => {
    if (!progress) return 0;
    return Math.max(...progress.habits_progress.map(h => h.best_streak), 0);
  }, [progress]);

  const habitBreakdown = useMemo(() => {
    if (!progress) return [];
    return [...progress.habits_progress]
      .sort((a, b) => b.completion_rate - a.completion_rate)
      .slice(0, 5);
  }, [progress]);

  const COLORS = ['#4338CA', '#059669', '#7C3AED', '#D97706', '#0EA5E9'];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <svg style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#4338CA" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Your discipline is your freedom.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
            Export CSV
          </button>
          <button style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#4338CA', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            Share Report
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'CURRENT STREAK', value: `${progress?.summary.active_habits ?? 0}`, sub: 'Days active in a row', color: '#4338CA', icon: '⚡' },
          { label: 'BEST STREAK',    value: `${bestStreak}`, sub: 'All-time personal record', color: '#7C3AED', icon: '🏆' },
          { label: 'TOTAL COMPLETIONS', value: String(progress?.summary.completed_logs ?? 0), sub: `${progress?.summary.completion_rate ?? 0}% rate`, color: '#059669', icon: '✓' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                {kpi.label}
              </p>
              <span style={{ fontSize: 16 }}>{kpi.icon}</span>
            </div>
            <p style={{ fontSize: 36, fontWeight: 900, color: kpi.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Activity trend line chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Completion Rate Over Time</h3>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Last 30 days performance</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>
              Completion %
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyChartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338CA" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}/>
              <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fill="url(#areaGrad)" name="Taux %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Habit breakdown */}
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Habit Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {habitBreakdown.map((h, i) => (
              <div key={h.habit_id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {h.habit_nom}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: 8 }}>
                    {Math.round(h.completion_rate)}%
                  </span>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.completion_rate}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}
                  />
                </div>
              </div>
            ))}
            {habitBreakdown.length === 0 && (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Struggling habits */}
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Struggling Habits
          </h3>
          {habitBreakdown.filter(h => h.completion_rate < 50).length === 0 ? (
            <div style={{
              padding: '16px', borderRadius: 12, background: '#F0FDF4',
              border: '1px solid #BBF7D0', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: '#059669', fontWeight: 600, margin: 0 }}>
                🎉 Toutes vos habitudes sont en bonne forme !
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {habitBreakdown.filter(h => h.completion_rate < 50).slice(0, 3).map((h) => (
                <div key={h.habit_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10,
                  background: h.completion_rate < 25 ? '#FEF2F2' : '#FFFBEB',
                  border: `1px solid ${h.completion_rate < 25 ? '#FECACA' : '#FDE68A'}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{h.habit_nom}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: h.completion_rate < 25 ? '#EF4444' : '#F59E0B',
                    color: '#fff',
                  }}>
                    {h.completion_rate < 25 ? 'AT RISK' : 'DECLINING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insight card */}
        <div style={{
          borderRadius: 16, padding: '20px',
          background: 'linear-gradient(135deg, #4338CA, #7C3AED)',
          color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
              AI OPTIMIZATIONS
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, opacity: 0.95 }}>
            Increase your consistency with targeted adjustments to your routine. Your best completion window is{' '}
            <strong>between 6 AM and 10 AM</strong>.
          </p>
          <button style={{
            padding: '9px 16px', borderRadius: 10,
            border: '1.5px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Apply Optimized Schedule
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
