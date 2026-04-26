'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { DashboardStats } from './DashboardStats';
import { DashboardTable } from './DashboardTable';

export const AdminDashboard = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [managers, setManagers] = useState([]);
  const [habits, setHabits] = useState([]);

  const rosterTotals = useMemo(() => {
    const total = managers.reduce((s, m) => s + (Number(m.managedUsersCount) || 0), 0);
    const active = managers.reduce((s, m) => s + (Number(m.managedUsersActive) || 0), 0);
    return { total, active };
  }, [managers]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [managersData, habitsData] = await Promise.all([
        apiFetch('/managers'),
        apiFetch('/habits/my?includeArchived=true'),
      ]);
      setManagers(managersData);
      setHabits(habitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setToken(getToken()); }, []);

  useEffect(() => {
    if (token === null || !token) return;
    const u = getUser();
    if ((u?.role ?? '').toString().toLowerCase() !== 'admin') router.replace('/admin/habits');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    const u = getUser();
    if ((u?.role ?? '').toString().toLowerCase() !== 'admin') return;
    refresh();
  }, [token, refresh]);

  const sessionUser = getUser();
  const isAdmin = (sessionUser?.role ?? '').toString().toLowerCase() === 'admin';

  if (token === null) return <div className="text-secondary">Chargement...</div>;

  if (!token) {
    return (
      <div>
        <div className="alert alert-warning">Vous devez être connecté pour accéder au tableau de bord.</div>
        <Link className="btn btn-primary" href="/login">Aller à la connexion</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="text-secondary">Redirection vers vos habitudes…</div>;
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="h3 mb-1 text-primary">Tableau de Bord</h2>
        <div className="text-secondary small">Vue managers &amp; effectifs encadrés</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <DashboardStats managers={managers} rosterTotals={rosterTotals} habits={habits} />
      <DashboardTable managers={managers} rosterTotals={rosterTotals} habits={habits} loading={loading} />
    </div>
  );
};
