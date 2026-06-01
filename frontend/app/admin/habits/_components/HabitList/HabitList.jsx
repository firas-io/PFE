'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { searchHabits } from '@/lib/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getToken, getUser } from '@/lib/auth';
import { canManageHabits } from '@/src/utils/permissions';
import { AddHabitModal } from '../AddHabitModal';
import { UpdateHabitModal } from '../UpdateHabitModal';
import { HabitHeader } from './HabitHeader';
import { HabitTable } from './HabitTable';
import Pagination from '@/components/Pagination';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [habits, setHabits] = useState([]);
  const [pagination, setPagination] = useState({ pages: 1, currentPage: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const refresh = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const showActiveOnly = searchParams?.get('active') === 'true';
      const filterStatut = showActiveOnly ? 'active' : (statusFilter !== 'all' ? statusFilter : undefined);
      const filterVisibility = visibilityFilter !== 'all' ? visibilityFilter : undefined;

      if (debouncedSearch) {
        const result = await searchHabits({
          q: debouncedSearch,
          page,
          limit: 5,
          includeArchived: true,
          statut: filterStatut,
          visibility: filterVisibility,
        });
        setHabits(result.data ?? []);
        setPagination(result.pagination ?? { pages: 1, currentPage: page });
      } else {
        const params = new URLSearchParams({ includeArchived: 'true', page: String(page), limit: '5' });
        if (filterStatut)    params.set('statut',     filterStatut);
        if (filterVisibility) params.set('visibility', filterVisibility);
        const result = await apiFetch(`/habits?${params}`);
        if (result && result.data) {
          setHabits(result.data);
          setPagination(result.pagination);
        } else {
          setHabits(Array.isArray(result) ? result : []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les habitudes.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, visibilityFilter, searchParams]);

  useEffect(() => { setToken(getToken()); setCurrentUser(getUser()); }, []);
  useEffect(() => {
    if (token) {
      setCurrentPage(1);
      refresh(1);
    }
  }, [token, debouncedSearch, statusFilter, visibilityFilter, refresh]);

  function handlePageChange(page) {
    setCurrentPage(page);
    refresh(page);
  }

  const displayedHabits = useMemo(() => {
    let list = habits.slice();
    if (!debouncedSearch) {
      const showActiveOnly = searchParams?.get('active') === 'true';
      const filterStatut = showActiveOnly ? 'active' : statusFilter;
      if (filterStatut !== 'all') {
        list = list.filter((h) => (h.statut || 'active') === filterStatut);
      }
    }

    if (sortBy === 'priority_desc') list.sort((a, b) => priorityRank(b.priorite) - priorityRank(a.priorite));
    else if (sortBy === 'priority_asc') list.sort((a, b) => priorityRank(a.priorite) - priorityRank(b.priorite));
    else if (sortBy === 'status') list.sort((a, b) => statusRank(a.statut) - statusRank(b.statut));
    else list.reverse();
    return list;
  }, [habits, statusFilter, debouncedSearch, sortBy, searchParams]);

  const canManage = canManageHabits(currentUser);

  return (
    <div className="adm-page">
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <HabitHeader
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        loading={loading}
        onOpenCreate={() => setShowAddModal(true)}
        total={displayedHabits.length}
        canManage={canManage}
      />

      <HabitTable
        habits={displayedHabits}
        loading={loading}
        onEdit={(habit) => setSelectedHabit(habit)}
        onRefetch={refresh}
        canManage={canManage}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.pages}
        onPageChange={handlePageChange}
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
    </div>
  );
};
