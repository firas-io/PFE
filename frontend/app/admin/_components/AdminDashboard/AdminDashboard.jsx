'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { userFirstName } from '@/lib/userDisplay';

const CARD = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  padding: '20px',
};

const COLORS = ['#4338CA', '#059669', '#7C3AED', '#D97706', '#0EA5E9'];

const CATEGORY_LABELS = {
  sport: 'Sport', sante: 'Santé', santé: 'Santé',
  apprentissage: 'Apprentissage', travail: 'Travail',
  bien_etre: 'Bien-être', 'bien-etre': 'Bien-être', autre: 'Autre',
};

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

// ── Admin dashboard (real-time platform stats — current week) ──────────────────
function AdminView({ sessionUser }) {
  const [mounted, setMounted] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/stats/admin');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setMounted(true); refresh(); }, [refresh]);

  if (!mounted) return <Spinner />;

  const dailyChart = (stats?.daily_progress ?? []).map(d => ({
    day:       d.label.split(' ')[0],
    label:     d.label,
    rate:      d.rate,
    completed: d.completed,
    total:     d.total,
  }));

  const topCategories = Array.isArray(stats?.top_categories) ? stats.top_categories : [];
  const maxCatCount   = topCategories.length ? Math.max(...topCategories.map(c => c.count)) : 1;

  const kpiCards = stats ? [
    {
      label: 'UTILISATEURS (TOTAL)',
      value: String(stats.total_users ?? 0),
      sub:   'inclut managers et utilisateurs',
      color: '#4338CA', icon: '👥',
    },
    {
      label: 'ACTIFS CETTE SEMAINE',
      value: String(stats.active_users_this_week ?? 0),
      sub:   'ayant enregistré au moins un log',
      color: '#7C3AED', icon: '🔥',
    },
    {
      label: 'HABITUDES PLATEFORME',
      value: String(stats.total_habits ?? 0),
      sub:   `+${stats.new_habits_this_week ?? 0} créées cette semaine`,
      color: '#059669', icon: '📋',
    },
    {
      label: 'TAUX DE COMPLÉTION',
      value: `${stats.completion_rate ?? 0}%`,
      sub:   'Semaine en cours (lundi-dimanche) — global plateforme',
      color: (stats.completion_rate ?? 0) >= 70 ? '#059669' : (stats.completion_rate ?? 0) >= 40 ? '#D97706' : '#EF4444',
      icon:  (stats.completion_rate ?? 0) >= 50 ? '📈' : '📉',
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>Tableau de bord plateforme</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {userFirstName(sessionUser) ? `Bienvenue, ${userFirstName(sessionUser)} — ` : ''}
            Performance globale des utilisateurs et managers sur la semaine en cours (lundi-dimanche).
          </p>
        </div>
        <button onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0 }}>
          <IconRefresh size={13}/> Actualiser
        </button>
      </div>
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{error}</span>
          <button onClick={refresh} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#fff', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
        </div>
      )}
      {loading && <Spinner />}
      {!loading && !stats && !error && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>📊</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Impossible de charger les données</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>Vérifiez votre connexion ou relancez le serveur.</p>
          <button onClick={refresh} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
        </div>
      )}
      {!loading && stats && (stats.total_users ?? 0) === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>👥</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Aucun compte actif</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Créez des utilisateurs ou des managers pour voir les statistiques.</p>
        </div>
      )}
      {!loading && stats && (stats.total_users ?? 0) > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {kpiCards.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ ...CARD, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{k.label}</p>
                  <span style={{ fontSize: 16 }}>{k.icon}</span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{k.value}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{k.sub}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Taux de complétion plateforme</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Semaine en cours (lundi-dimanche)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>Complétion %
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4338CA" stopOpacity={0.25}/><stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={36}/>
                  <Tooltip formatter={v => [`${v}%`, 'Complétion']} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}/>
                  <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fill="url(#adminAreaGrad)" dot={{ r: 3, fill: '#4338CA', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4338CA', stroke: '#fff', strokeWidth: 2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Entrées par jour</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChart} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={28}/>
                  <Tooltip formatter={(v, n) => [v, n === 'completed' ? 'Complétées' : 'Total']} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}/>
                  <Bar dataKey="total"     fill="#E5E7EB" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="completed" fill="#4338CA" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Top Catégories</h3>
              {topCategories.length === 0 ? <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topCategories.map((c, i) => (
                    <div key={c.category}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{CATEGORY_LABELS[c.category] || c.category}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: 8 }}>{c.count} hab.</span>
                      </div>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((c.count / maxCatCount) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ borderRadius: 16, padding: '20px', background: 'linear-gradient(135deg, #4338CA, #7C3AED)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>RÉSUMÉ PLATEFORME</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                {[
                  { label: 'Comptes actifs', value: String(stats.active_users_this_week ?? 0), icon: '🔥' },
                  { label: 'Comptes totaux', value: String(stats.total_users ?? 0), icon: '👥' },
                  { label: 'Habitudes totales', value: String(stats.total_habits ?? 0), icon: '📋' },
                  { label: 'Logs cette semaine', value: String(stats.total_logs_this_week ?? 0), icon: '📊' },
                  { label: 'Taux de complétion', value: `${stats.completion_rate ?? 0}%`, icon: (stats.completion_rate ?? 0) >= 50 ? '📈' : '📉' },
                  { label: 'Top catégorie', value: topCategories[0] ? (CATEGORY_LABELS[topCategories[0].category] || topCategories[0].category) : '—', icon: '⭐' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>{item.icon} {item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Manager dashboard (real-time team stats — current week) ────────────────────
function ManagerView({ sessionUser }) {
  const [mounted, setMounted] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/stats/manager');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setMounted(true); refresh(); }, [refresh]);

  if (!mounted) return <Spinner />;

  const dailyChart = (stats?.daily_progress ?? []).map(d => ({
    day:       d.label.split(' ')[0],
    label:     d.label,
    rate:      d.rate,
    completed: d.completed,
    total:     d.total,
  }));

  const members   = stats?.members_breakdown ?? [];
  const maxMRate  = members.length ? Math.max(...members.map(m => m.completion_rate)) : 1;

  const kpiCards = stats ? [
    {
      label: 'MEMBRES ACTIFS',
      value: String(stats.active_members),
      sub:   `${stats.team_size} membre${stats.team_size !== 1 ? 's' : ''} dans l'équipe`,
      color: '#4338CA', icon: '👥',
    },
    {
      label: 'HABITUDES ÉQUIPE',
      value: String(stats.total_habits),
      sub:   'total des habitudes de l\'équipe',
      color: '#7C3AED', icon: '📋',
    },
    {
      label: 'COMPLÉTÉES CETTE SEMAINE',
      value: String(stats.completed_this_week),
      sub:   `sur ${stats.total_logs_this_week} entrées enregistrées`,
      color: '#059669', icon: '✅',
    },
    {
      label: 'TAUX DE COMPLÉTION',
      value: `${stats.completion_rate}%`,
      sub:   'Semaine en cours (lundi-dimanche) — équipe complète',
      color: stats.completion_rate >= 70 ? '#059669' : stats.completion_rate >= 40 ? '#D97706' : '#EF4444',
      icon:  stats.completion_rate >= 50 ? '📈' : '📉',
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>Tableau de bord équipe</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {userFirstName(sessionUser) ? `Bienvenue, ${userFirstName(sessionUser)} — ` : ''}
            Performance de votre équipe sur la semaine en cours (lundi-dimanche).
          </p>
        </div>
        <button onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0 }}>
          <IconRefresh size={13}/> Actualiser
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{error}</span>
          <button onClick={refresh} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#fff', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
        </div>
      )}
      {loading && <Spinner />}

      {!loading && !stats && !error && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>📊</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Impossible de charger les données</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>Vérifiez votre connexion ou relancez le serveur.</p>
          <button onClick={refresh} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Réessayer</button>
        </div>
      )}

      {!loading && stats && stats.team_size === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>👥</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>Aucun membre dans l'équipe</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Ajoutez des membres via la section "Mon équipe".</p>
        </div>
      )}

      {!loading && stats && stats.team_size > 0 && (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {kpiCards.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ ...CARD, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{k.label}</p>
                  <span style={{ fontSize: 16 }}>{k.icon}</span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{k.value}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{k.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            {/* Daily area chart */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Taux de complétion de l'équipe</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Semaine en cours (lundi-dimanche)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>Complétion %
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="teamAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4338CA" stopOpacity={0.25}/><stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={36}/>
                  <Tooltip formatter={v => [`${v}%`, 'Complétion']} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}/>
                  <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fill="url(#teamAreaGrad)" dot={{ r: 3, fill: '#4338CA', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4338CA', stroke: '#fff', strokeWidth: 2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Daily bar chart */}
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Entrées par jour</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChart} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={28}/>
                  <Tooltip formatter={(v, n) => [v, n === 'completed' ? 'Complétées' : 'Total']} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}/>
                  <Bar dataKey="total"     fill="#E5E7EB" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="completed" fill="#4338CA" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Members breakdown */}
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Performance par membre</h3>
              {members.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Aucune activité cette semaine.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {members.map((m, i) => (
                    <div key={m._id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(m.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                          {!m.is_active && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#FEF2F2', color: '#EF4444', flexShrink: 0 }}>inactif</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: 8 }}>{m.completion_rate}%</span>
                      </div>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${maxMRate > 0 ? Math.round((m.completion_rate / maxMRate) * 100) : 0}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}/>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{m.completed_this_week} complétées · {m.total_habits} habitudes</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team summary gradient card */}
            <div style={{ borderRadius: 16, padding: '20px', background: 'linear-gradient(135deg, #4338CA, #7C3AED)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>RÉSUMÉ ÉQUIPE — LUNDI À DIMANCHE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, position: 'relative' }}>
                {[
                  { label: 'Taille équipe',        value: String(stats.team_size),                                                              icon: '👥' },
                  { label: 'Membres actifs',        value: String(stats.active_members),                                                         icon: '🔥' },
                  { label: 'Habitudes totales',     value: String(stats.total_habits),                                                           icon: '📋' },
                  { label: 'Logs cette semaine',    value: String(stats.total_logs_this_week),                                                   icon: '📊' },
                  { label: 'Taux de complétion',    value: `${stats.completion_rate}%`,                                                          icon: stats.completion_rate >= 50 ? '📈' : '📉' },
                  ...(stats.most_active_user ? [{ label: 'Meilleur membre', value: (stats.most_active_user.name || '—').split(' ')[0], icon: '🏆' }] : []),
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>{item.icon} {item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const sessionUser = getUser();
  const isAdmin = (sessionUser?.role ?? '').toString().toLowerCase() === 'admin';

  if (isAdmin) return <AdminView sessionUser={sessionUser}/>;
  return <ManagerView sessionUser={sessionUser}/>;
};
