'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { userFirstName } from '@/lib/userDisplay';
import { canViewTeamAnalytics } from '@/src/utils/permissions';
import DateFilter from '@/components/DateFilter';
import { StatsChartsGrid } from '../charts/StatsChartsGrid';
import { CARD, COLORS, Spinner } from '../charts/_chartTheme';

function statsQuery(range) {
  const params = new URLSearchParams();
  if (range?.period)   params.set('period', range.period);
  if (range?.dateFrom) params.set('dateFrom', range.dateFrom);
  if (range?.dateTo)   params.set('dateTo', range.dateTo);
  const q = params.toString();
  return q ? `?${q}` : '';
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

function resolveStatsEndpoint(user) {
  const role = (user?.role ?? '').toString().toLowerCase();
  if (role === 'admin') return '/stats/admin';
  if (role === 'manager') return '/stats/manager';
  return '/stats/user';
}

function hasStatsContent(stats, role) {
  if (!stats) return false;
  if (role === 'admin') return (stats.total_users ?? 0) > 0;
  if (role === 'manager') return (stats.team_size ?? 0) > 0;
  return (stats.total_habits ?? 0) > 0;
}

function buildKpiCards(stats, role) {
  if (!stats) return [];

  if (role === 'admin') {
    return [
      { label: 'UTILISATEURS (TOTAL)', value: String(stats.total_users ?? 0), sub: 'plateforme', color: '#4338CA' },
      { label: 'ACTIFS SUR LA PÉRIODE', value: String(stats.active_users_this_week ?? 0), sub: 'avec au moins un log', color: '#7C3AED' },
      { label: 'HABITUDES', value: String(stats.total_habits ?? 0), sub: `+${stats.new_habits_this_week ?? 0} nouvelles`, color: '#059669' },
      { label: 'TAUX DE COMPLÉTION', value: `${stats.completion_rate ?? 0}%`, sub: rateLabel(stats.completion_rate ?? 0), color: rateColor(stats.completion_rate ?? 0) },
    ];
  }

  if (role === 'manager') {
    return [
      { label: 'MEMBRES ACTIFS', value: String(stats.active_members ?? 0), sub: `${stats.team_size ?? 0} dans l'équipe`, color: '#4338CA' },
      { label: 'HABITUDES ÉQUIPE', value: String(stats.total_habits ?? 0), sub: 'total équipe', color: '#7C3AED' },
      { label: 'COMPLÉTÉES', value: String(stats.completed_this_week ?? 0), sub: `sur ${stats.total_logs_this_week ?? 0} logs`, color: '#059669' },
      { label: 'TAUX DE COMPLÉTION', value: `${stats.completion_rate ?? 0}%`, sub: 'équipe — période sélectionnée', color: rateColor(stats.completion_rate ?? 0) },
    ];
  }

  const habitsStats = stats.habits_stats ?? [];
  const bestHabit   = habitsStats.find(h => h.total > 0 && h.rate > 0) ?? null;

  return [
    { label: 'HABITUDES ACTIVES', value: String(stats.active_habits ?? 0), sub: `${stats.total_habits ?? 0} au total`, color: '#4338CA' },
    { label: 'COMPLÉTÉES', value: String(stats.completed_this_week ?? 0), sub: `sur ${stats.total_logs_this_week ?? 0} entrées`, color: '#059669' },
    { label: 'TAUX DE COMPLÉTION', value: `${stats.completion_rate ?? 0}%`, sub: rateLabel(stats.completion_rate ?? 0), color: rateColor(stats.completion_rate ?? 0) },
    { label: 'MEILLEURE HABITUDE', value: bestHabit ? `${bestHabit.rate}%` : '—', sub: bestHabit ? bestHabit.nom : 'Aucune activité', color: '#7C3AED' },
  ];
}

export function StatsDashboard() {
  const sessionUser = getUser();
  const role        = (sessionUser?.role ?? 'utilisateur').toString().toLowerCase();
  const showTeam    = canViewTeamAnalytics(sessionUser);
  const endpoint    = resolveStatsEndpoint(sessionUser);

  const [token, setToken]       = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [habitFilter, setHabitFilter] = useState('all');

  const refresh = useCallback(async (range) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`${endpoint}${statsQuery(range)}`);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const kpiCards = useMemo(() => buildKpiCards(stats, role), [stats, role]);

  const weeklyHabits = stats?.weekly_habits ?? [];
  const weekDays     = stats?.week_days ?? [];
  const habitsStats  = stats?.habits_stats ?? [];
  const filteredWeeklyHabits = weeklyHabits.filter(h => {
    if (habitFilter === 'active') return (h.statut || '').toLowerCase() === 'active';
    if (habitFilter === 'paused') return (h.statut || '').toLowerCase() !== 'active';
    return true;
  });
  const strugglingHabits = habitsStats.filter(h => h.statut === 'active' && h.total > 0 && h.rate < 50);

  const pageTitle = role === 'admin'
    ? 'Statistiques plateforme'
    : role === 'manager'
      ? 'Statistiques équipe'
      : 'Mes statistiques';

  const pageSub = role === 'admin'
    ? 'Vue globale — tous les utilisateurs et équipes'
    : role === 'manager'
      ? 'Performance de votre équipe'
      : `${userFirstName(sessionUser) ? `${userFirstName(sessionUser)}, voici` : 'Voici'} votre bilan personnel`;

  if (token === null) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>{pageTitle}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{pageSub}</p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0 }}
        >
          <IconRefresh size={13}/> Actualiser
        </button>
      </div>

      <DateFilter onChange={(range) => refresh(range)} />

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && <Spinner />}

      {!loading && stats && !hasStatsContent(stats, role) && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Aucune donnée</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            {role === 'utilisateur'
              ? 'Créez vos premières habitudes pour voir vos statistiques.'
              : role === 'manager'
                ? 'Ajoutez des membres à votre équipe.'
                : 'Aucun compte actif sur la plateforme.'}
          </p>
        </div>
      )}

      {!loading && stats && hasStatsContent(stats, role) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {kpiCards.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ ...CARD, position: 'relative', overflow: 'hidden' }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{k.label}</p>
                <p style={{ fontSize: 34, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{k.value}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{k.sub}</p>
              </motion.div>
            ))}
          </div>

          <StatsChartsGrid
            stats={stats}
            showTeamCharts={showTeam}
            gradientId={`statsGrad-${role}`}
          />

          {role === 'utilisateur' && strugglingHabits.length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px' }}>Habitudes à améliorer</h3>
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

          {role === 'utilisateur' && stats.show_weekly_table !== false && weeklyHabits.length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Liste des habitudes de la semaine</h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>Suivi par jour (lundi à dimanche)</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <select className="form-select" style={{ maxWidth: 220 }} value={habitFilter} onChange={e => setHabitFilter(e.target.value)}>
                  <option value="all">Toutes les habitudes</option>
                  <option value="active">Habitudes actives</option>
                  <option value="paused">Habitudes pausées/inactives</option>
                </select>
              </div>
              <div className="d-none d-md-block" style={{ overflowX: 'auto' }}>
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
              {filteredWeeklyHabits.length === 0 && (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '6px 0 0' }}>Aucune habitude pour ce filtre.</p>
              )}
            </div>
          )}

          {role === 'manager' && (stats.members_breakdown ?? []).length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Performance par membre</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(stats.members_breakdown ?? []).map((m, i) => (
                  <div key={m._id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{m.completion_rate}%</span>
                    </div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.completion_rate}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
