'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

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

function rateColor(rate) {
  if (rate >= 70) return '#059669';
  if (rate >= 40) return '#D97706';
  return '#EF4444';
}

export function StatsManager() {
  const [token,   setToken]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/stats/admin');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  if (token === null) return <Spinner />;

  const dailyChart  = (stats?.daily_progress ?? []).map(d => ({
    day:       d.label.split(' ')[0],
    label:     d.label,
    rate:      d.rate,
    completed: d.completed,
    total:     d.total,
  }));
  const topCategories = stats?.top_categories ?? [];
  const maxCatCount   = topCategories.length ? Math.max(...topCategories.map(c => c.count)) : 1;

  const kpiCards = stats ? [
    {
      label: 'UTILISATEURS ACTIFS',
      value: String(stats.active_users_this_week),
      sub:   `${stats.total_users} au total sur la plateforme`,
      color: '#4338CA', icon: '👥',
    },
    {
      label: 'HABITUDES ENREGISTRÉES',
      value: String(stats.total_habits),
      sub:   `+${stats.new_habits_this_week} créée${stats.new_habits_this_week !== 1 ? 's' : ''} cette semaine`,
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
      sub:   'Semaine en cours (lundi-dimanche) — tous utilisateurs',
      color: rateColor(stats.completion_rate),
      icon:  stats.completion_rate >= 50 ? '📈' : '📉',
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
            Statistiques hebdomadaires
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Aperçu en temps réel — semaine en cours (lundi-dimanche), tous utilisateurs confondus.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0 }}
        >
          <IconRefresh size={13} /> Actualiser
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && <Spinner />}

      {!loading && !stats && !error && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 20px', color: '#64748B', fontSize: 13 }}>
          Aucune donnée disponible.
        </div>
      )}

      {!loading && stats && (
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
                  <span style={{ fontSize: 16 }}>{k.icon}</span>
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
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Taux de complétion quotidien</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Semaine en cours (lundi-dimanche) — toute la plateforme</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>
                  Complétion %
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="adminWeeklyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#4338CA" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={36}/>
                  <Tooltip
                    formatter={v => [`${v}%`, 'Complétion']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                    contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fill="url(#adminWeeklyGrad)" dot={{ r: 3, fill: '#4338CA', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4338CA', stroke: '#fff', strokeWidth: 2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top categories */}
            <div style={CARD}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Top Catégories</h3>
              {topCategories.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topCategories.map((c, i) => (
                    <div key={c.category}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {CATEGORY_LABELS[c.category] || c.category}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0, marginLeft: 8 }}>
                          {c.count} hab.
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((c.count / maxCatCount) * 100)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 6 }}
                        />
                      </div>
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
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>Entrées quotidiennes</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={30}/>
                  <Tooltip
                    formatter={(v, name) => [v, name === 'completed' ? 'Complétées' : 'Total']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                    contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="total"     fill="#E5E7EB" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="completed" fill="#4338CA" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform summary gradient card */}
            <div style={{
              borderRadius: 16, padding: '20px',
              background: 'linear-gradient(135deg, #4338CA, #7C3AED)',
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
                  RÉSUMÉ PLATEFORME — LUNDI À DIMANCHE
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, position: 'relative' }}>
                {[
                  { label: 'Utilisateurs totaux',    value: String(stats.total_users),            icon: '👥' },
                  { label: 'Actifs cette semaine',   value: String(stats.active_users_this_week), icon: '🔥' },
                  { label: 'Habitudes créées',       value: String(stats.total_habits),           icon: '📋' },
                  { label: 'Nouvelles ce semaine',   value: `+${stats.new_habits_this_week}`,     icon: '✨' },
                  { label: 'Logs enregistrés',       value: String(stats.total_logs_this_week),   icon: '📊' },
                  { label: 'Taux moyen (semaine)',   value: `${stats.completion_rate}%`,          icon: stats.completion_rate >= 50 ? '📈' : '📉' },
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
