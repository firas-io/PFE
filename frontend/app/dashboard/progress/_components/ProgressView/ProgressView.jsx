'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SummaryCards } from './SummaryCards';
import { WeeklyTable } from './WeeklyTable';
import { HabitsProgressTable } from './HabitsProgressTable';

export const ProgressView = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch('/progress/my', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de l'avancement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const summary = data?.summary;
  const weekly = data?.weekly_progress ?? [];
  const habits = data?.habits_progress ?? [];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1">Mon Avancement</h1>
        </div>
        <button className="btn btn-outline-primary" type="button" onClick={refresh} disabled={loading}>
          {loading ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <SummaryCards summary={summary} />
      <WeeklyTable weekly={weekly} />
      <HabitsProgressTable habits={habits} />
    </div>
  );
};
