'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AddHabitModal } from '../AddHabitModal';
import { UpdateHabitModal } from '../UpdateHabitModal';
import { HabitHeader } from './HabitHeader';
import { HabitTable } from './HabitTable';

const priorityRank = (value) => {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  if (value === 'low') return 1;
  return 0;
};

const statusRank = (value) => {
  if (value === 'active' || !value) return 0;
  if (value === 'pause') return 1;
  return 2;
};

export const HabitList = () => {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [habits, setHabits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const habitData = await apiFetch('/habits?includeArchived=true');
      setHabits(habitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les habitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const displayedHabits = useMemo(() => {
    const showActiveOnly = searchParams?.get('active') === 'true';
    const filterStatut = showActiveOnly ? 'active' : statusFilter;

    let list = habits.slice();
    if (filterStatut !== 'all') {
      list = list.filter((h) => (h.statut || 'active') === filterStatut);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((h) =>
        (h.nom || '').toLowerCase().includes(q) ||
        (h.description || '').toLowerCase().includes(q),
      );
    }
    if (sortBy === 'priority_desc') list.sort((a, b) => priorityRank(b.priorite) - priorityRank(a.priorite));
    else if (sortBy === 'priority_asc') list.sort((a, b) => priorityRank(a.priorite) - priorityRank(b.priorite));
    else if (sortBy === 'status') list.sort((a, b) => statusRank(a.statut) - statusRank(b.statut));
    else list.reverse();
    return list;
  }, [habits, statusFilter, search, sortBy, searchParams]);

  return (
    <>
      <h2 className="mb-4">Gestion des Habitudes</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <HabitHeader
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        loading={loading}
        onOpenCreate={() => setShowAddModal(true)}
      />

      <HabitTable
        habits={displayedHabits}
        loading={loading}
        onEdit={(habit) => setSelectedHabit(habit)}
        onRefetch={refresh}
      />

      <AddHabitModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />

      {selectedHabit && (
        <UpdateHabitModal
          show={!!selectedHabit}
          onHide={() => setSelectedHabit(null)}
          onSuccess={() => { refresh(); setSelectedHabit(null); }}
          selectedHabit={selectedHabit}
        />
      )}

    </>
  );
};
