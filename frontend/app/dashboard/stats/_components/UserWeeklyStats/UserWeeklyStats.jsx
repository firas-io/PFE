'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { userFirstName } from '@/lib/userDisplay';

const CARD = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  padding: '20px',
};

const COLORS = ['#4338CA', '#059669', '#7C3AED', '#D97706', '#0EA5E9'];

function Spinner() {
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

function rateColor(rate) {
  if (rate >= 70) return '#059669';
  if (rate >= 40) return '#D97706';
  return '#EF4444';
}

function rateLabel(rate) {
  if (rate >= 70) return 'Excellent';
  if (rate >= 50) return 'Bon';
  if (rate >= 30) return 'À améliorer';
  return 'Critique';
}

export function UserWeeklyStats() {
  const [token,   setToken]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [habitFilter, setHabitFilter] = useState('all');

  const sessionUser = getUser();

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/stats/user');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  if (token === null) return <Spinner />;

  const dailyChart = (stats?.daily_progress ?? []).map(d => ({
    day:       d.label.split(' ')[0],
    label:     d.label,
    rate:      d.rate,
    completed: d.completed,
    total:     d.total,
  }));

  const habitsStats     = stats?.habits_stats ?? [];
  const weeklyHabits    = stats?.weekly_habits ?? [];
  const weekDays        = stats?.week_days ?? [];
  const filteredWeeklyHabits = weeklyHabits.filter(h => {
    if (habitFilter === 'active') return (h.statut || '').toLowerCase() === 'active';
    if (habitFilter === 'paused') return (h.statut || '').toLowerCase() !== 'active';
    return true;
  });
  const topHabits       = habitsStats.slice(0, 5);
  const maxHabitRate    = topHabits.length ? Math.max(...topHabits.map(h => h.rate), 1) : 1;
  const strugglingHabits = habitsStats.filter(h => h.statut === 'active' && h.total > 0 && h.rate < 50);
  const bestHabit        = habitsStats.find(h => h.total > 0 && h.rate > 0) ?? null;

  const kpiCards = stats ? [
    {
      label: 'HABITUDES ACTIVES',
      value: String(stats.active_habits),
      sub:   `${stats.total_habits} au total (actives + pausées)`,
      color: '#4338CA',
    },
    {
      label: 'COMPLÉTÉES CETTE SEMAINE',
      value: String(stats.completed_this_week),
      sub:   `sur ${stats.total_logs_this_week} entrées enregistrées`,
      color: '#059669',
    },
    {
      label: 'TAUX DE COMPLÉTION',
      value: `${stats.completion_rate}%`,
      sub:   rateLabel(stats.completion_rate) + ' — semaine en cours (lundi-dimanche)',
      color: rateColor(stats.completion_rate),
    },
    {
      label: 'MEILLEURE HABITUDE',
      value: bestHabit ? `${bestHabit.rate}%` : '—',
      sub:   bestHabit ? bestHabit.nom : 'Aucune activité cette semaine',
      color: '#7C3AED',
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
            Mes statistiques
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {userFirstName(sessionUser) ? `${userFirstName(sessionUser)}, voici` : 'Voici'} votre bilan de la semaine en cours (lundi-dimanche).
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0 }}
        >
          <IconRefresh size={13}/> Actualiser
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && <Spinner />}

      {!loading && stats && stats.total_habits === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Aucune habitude enregistrée</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Créez vos premières habitudes pour voir vos statistiques ici.</p>
        </div>
      )}

      {!loading && stats && stats.total_habits > 0 && (
        <>
          {/* ── KPI Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {kpiCards.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ ...CARD, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{k.label}</p>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{k.value}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{k.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            {/* Daily completion rate area chart */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Progression quotidienne</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Taux de complétion — semaine en cours (lundi-dimanche)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>
                  Complétion %
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="userWeeklyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#4338CA" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={36}/>
                  <Tooltip
                    formatter={v => [`${v}%`, 'Complétion']}
                    labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
                    contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fill="url(#userWeeklyGrad)" dot={{ r: 3, fill: '#4338CA', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4338CA', stroke: '#fff', strokeWidth: 2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top habits breakdown */}
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Mes habitudes (top 5)</h3>
              {topHabits.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Aucune activité cette semaine</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topHabits.map((h, i) => (
                    <div key={h._id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {h.nom}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: 8 }}>
                          {h.rate}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${maxHabitRate > 0 ? Math.round((h.rate / maxHabitRate) * 100) : 0}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{h.completed}/{h.total} entrées</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Daily entries bar chart */}
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Entrées par jour</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={28}/>
                  <Tooltip
                    formatter={(v, n) => [v, n === 'completed' ? 'Complétées' : 'Total']}
                    labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
                    contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="total"     fill="#E5E7EB" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="completed" fill="#4338CA" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Personal summary gradient card */}
            <div style={{
              borderRadius: 16, padding: '20px',
              background: 'linear-gradient(135deg, #4338CA, #7C3AED)',
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
                  BILAN PERSONNEL — LUNDI À DIMANCHE
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, position: 'relative' }}>
                {[
                  { label: 'Habitudes actives',   value: String(stats.active_habits) },
                  { label: 'Logs enregistrés',     value: String(stats.total_logs_this_week) },
                  { label: 'Complétées',           value: String(stats.completed_this_week) },
                  { label: 'Taux de complétion',   value: `${stats.completion_rate}%` },
                  ...(bestHabit ? [{ label: 'Top habitude', value: bestHabit.nom.length > 14 ? bestHabit.nom.slice(0, 14) + '…' : bestHabit.nom }] : []),
                  ...(strugglingHabits.length > 0 ? [{ label: 'À améliorer', value: `${strugglingHabits.length} hab.` }] : [{ label: 'Tout est en ordre', value: 'OK' }]),
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Struggling habits ── */}
          {strugglingHabits.length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px' }}>
                Habitudes à améliorer
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {strugglingHabits.slice(0, 4).map(h => {
                  const critical = h.rate < 25;
                  return (
                    <div key={h._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: critical ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${critical ? '#FECACA' : '#FDE68A'}` }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{h.nom}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: critical ? '#EF4444' : '#F59E0B', color: '#fff' }}>
                        {h.rate}% — {critical ? 'CRITIQUE' : 'FAIBLE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Weekly habits list ── */}
          {weeklyHabits.length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>
                Liste des habitudes de la semaine
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
                Suivi par jour (lundi à dimanche)
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <select
                  className="form-select"
                  style={{ maxWidth: 220 }}
                  value={habitFilter}
                  onChange={e => setHabitFilter(e.target.value)}
                >
                  <option value="all">Toutes les habitudes</option>
                  <option value="active">Habitudes actives</option>
                  <option value="paused">Habitudes pausées/inactives</option>
                </select>
              </div>

              <div className="d-none d-md-block">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 180 }}>Habitude</th>
                        {weekDays.map(day => (
                          <th key={day.key} style={{ textAlign: 'center', minWidth: 64 }}>{day.label.split(' ')[0]}</th>
                        ))}
                        <th style={{ textAlign: 'right', minWidth: 88 }}>Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWeeklyHabits.map(h => (
                        <tr key={h._id}>
                          <td>
                            <div className="fw-medium">{h.nom}</div>
                            <div className="text-secondary" style={{ fontSize: 11 }}>{h.completed}/{h.total} entrées</div>
                          </td>
                          {h.days.map(d => {
                            const color = d.status === 'completee'
                              ? { bg: '#DCFCE7', fg: '#166534', txt: '✓' }
                              : d.status === 'non_completee'
                                ? { bg: '#FFEDD5', fg: '#9A3412', txt: '•' }
                                : d.status === 'manquee'
                                  ? { bg: '#FEE2E2', fg: '#991B1B', txt: '✕' }
                                  : { bg: '#F3F4F6', fg: '#6B7280', txt: '—' };
                            return (
                              <td key={d.key} style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: color.bg, color: color.fg, fontSize: 12, fontWeight: 700 }}>
                                  {color.txt}
                                </span>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'right', fontWeight: 700, color: rateColor(h.rate) }}>{h.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredWeeklyHabits.map(h => (
                  <div key={h._id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 10 }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium" style={{ fontSize: 13 }}>{h.nom}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(h.rate) }}>{h.rate}%</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                      {h.days.map(d => {
                        const color = d.status === 'completee'
                          ? { bg: '#DCFCE7', fg: '#166534', txt: '✓' }
                          : d.status === 'non_completee'
                            ? { bg: '#FFEDD5', fg: '#9A3412', txt: '•' }
                            : d.status === 'manquee'
                              ? { bg: '#FEE2E2', fg: '#991B1B', txt: '✕' }
                              : { bg: '#F3F4F6', fg: '#6B7280', txt: '—' };
                        return (
                          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: '#64748B' }}>{d.label.split(' ')[0]}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 7, background: color.bg, color: color.fg, fontSize: 11, fontWeight: 700 }}>
                              {color.txt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {filteredWeeklyHabits.length === 0 && (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '6px 0 0' }}>
                  Aucune habitude pour ce filtre.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
