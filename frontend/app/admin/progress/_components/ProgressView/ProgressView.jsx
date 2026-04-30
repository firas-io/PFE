'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SummaryCards } from './SummaryCards';
import { WeeklyTable } from './WeeklyTable';
import { HabitsProgressTable } from './HabitsProgressTable';

export const ProgressView = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch('/progress/my');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'avancement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  if (token === null) return <div className="text-secondary">Chargement...</div>;

  if (!token) {
    return (
      <div>
        <div className="alert alert-warning">Vous devez être connecté pour consulter votre avancement.</div>
        <Link className="btn btn-primary" href="/login">Aller à la connexion</Link>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Mon Avancement</h1>
          <p className="adm-subtitle">Suivi de vos habitudes et progression quotidienne.</p>
        </div>
        <div className="adm-header-actions">
          <button className="btn btn-outline-secondary" type="button" onClick={refresh} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <SummaryCards summary={data?.summary} />
      <WeeklyTable weekly={data?.weekly_progress ?? []} />
      <HabitsProgressTable habits={data?.habits_progress ?? []} />
    </div>
  );
};
