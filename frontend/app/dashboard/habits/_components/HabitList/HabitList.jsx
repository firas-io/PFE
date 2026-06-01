'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { searchHabits } from '@/lib/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getUser, setUser as storeUser } from '@/lib/auth';
import { canCreateHabits, canManageHabits, canAddNotes } from '@/src/utils/permissions';
import { useToast } from '@/components/Toast';
import { useCategories } from '@/hooks/useCategories';
import { priorityRank, statusRank } from '../../_constants';
import { HabitHeader } from './HabitHeader';
import { HabitTable } from './HabitTable';
import { AddHabitModal } from '../AddHabitModal';
import { UpdateHabitModal } from '../UpdateHabitModal';
import { NotesModal } from '../NotesModal';
import { NoteHistoryModal } from '../NoteHistoryModal';
import { PersonalizeModal } from '../PersonalizeModal/PersonalizeModal';

export const HabitList = () => {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { categories: allCategories, reload: reloadCategories } = useCategories();
  const [currentUser, setCurrentUser] = useState(null);
  const canCreate = canCreateHabits(currentUser);
  const canManage = canManageHabits(currentUser);
  const canNotes  = canAddNotes(currentUser);
  const [habits, setHabits] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [todayStatus, setTodayStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // User's onboarding-selected categories (slugs)
  const [userCategories, setUserCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | slug

  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState(null);

  const [notesHabit, setNotesHabit] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const [noteHistory, setNoteHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [weeklyCompletionMap, setWeeklyCompletionMap] = useState({});

  const [personalizeHabit, setPersonalizeHabit] = useState(null);

  // Load user + permissions; sync selected category slugs from API
  useEffect(() => {
    const u = getUser();
    setCurrentUser(u);
    setUserCategories(u?.categories ?? []);
    apiFetch('/users/me/categories')
      .then(data => { if (Array.isArray(data?.categories)) setUserCategories(data.categories); })
      .catch(() => {});
    apiFetch('/profile')
      .then((profile) => {
        if (!profile?.permissions) return;
        const updated = { ...u, permissions: profile.permissions };
        setCurrentUser(updated);
        storeUser(updated);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('add') === '1' && canCreate) {
      setShowAdd(true);
    }
  }, [searchParams, canCreate]);

  const refreshUserCategories = useCallback(async () => {
    try {
      const data = await apiFetch('/users/me/categories');
      if (Array.isArray(data?.categories)) {
        setUserCategories(data.categories);
        const u = getUser();
        if (u) storeUser({ ...u, categories: data.categories });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (showAdd || editHabit) {
      refreshUserCategories();
      reloadCategories();
    }
  }, [showAdd, editHabit, refreshUserCategories, reloadCategories]);

  // Custom categories (approved via tickets, is_custom: true)
  const customCategories = useMemo(
    () => allCategories.filter(c => c.is_custom),
    [allCategories]
  );

  // Enrich user category slugs with full metadata + append custom categories
  const userCategoryMeta = useMemo(() => {
    const selectedLower = new Set(userCategories.map((s) => String(s).toLowerCase()));
    return [
      ...allCategories.filter((c) => selectedLower.has(String(c.slug).toLowerCase())),
      ...customCategories,
    ];
  }, [allCategories, userCategories, customCategories]);

  const allowedCategorySlugs = useMemo(
    () => userCategoryMeta.map((c) => c.slug),
    [userCategoryMeta]
  );

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const habitsData = await apiFetch('/habits/my?includeArchived=true');
      setHabits(habitsData);
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur de chargement', description: err instanceof Error ? err.message : 'Impossible de charger les habitudes' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadTodayStatus = useCallback(async () => {
    try {
      const data = await apiFetch('/progress/today');
      const map = {};
      data.logs?.forEach((log) => { map[String(log.habit_id)] = { id: log._id, statut: log.statut }; });
      setTodayStatus(map);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadHabits();
    loadTodayStatus();
  }, [loadHabits, loadTodayStatus]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchHabits({
      q: debouncedSearch,
      limit: 100,
      includeArchived: true,
      statut: statusFilter !== 'all' ? statusFilter : undefined,
      categorie: categoryFilter !== 'all' ? categoryFilter : undefined,
    })
      .then((res) => {
        if (!cancelled) setSearchResults(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setSearchResults([]);
          toast({
            variant: 'error',
            title: 'Recherche',
            description: err instanceof Error ? err.message : 'Erreur de recherche',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearch, statusFilter, categoryFilter, toast]);

  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const weekDateAtIndex = (index) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(12, 0, 0, 0);
    const target = new Date(monday);
    target.setDate(monday.getDate() + index);
    return target;
  };

  const toLocalDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    setWeeklyCompletionMap((prev) => {
      const next = { ...prev };
      habits.forEach((h) => {
        const id = String(h._id);
        if (!next[id]) next[id] = [false, false, false, false, false, false, false];
        next[id][todayIndex] = todayStatus[id]?.statut === 'completee';
      });
      return next;
    });
  }, [habits, todayStatus, todayIndex]);

  const filteredHabits = useMemo(() => {
    let items = debouncedSearch && searchResults !== null ? searchResults : habits;

    // Category tab filter (client-side when not already sent to API)
    if (!debouncedSearch && categoryFilter !== 'all') {
      // Custom category tabs filter by ticket_id, normal tabs by categorie slug
      const isCustomSlug = customCategories.some(c => c.slug === categoryFilter);
      if (isCustomSlug) {
        items = items.filter(h => h.categorie_ticket_id === categoryFilter);
      } else {
        items = items.filter(h => h.categorie === categoryFilter);
      }
    } else if (!debouncedSearch && userCategories.length > 0) {
      const selectedLower = new Set(userCategories.map((s) => String(s).toLowerCase()));
      items = items.filter(h =>
        selectedLower.has(String(h.categorie ?? '').toLowerCase()) ||
        (h.categorie === 'autre' && !!h.categorie_ticket_id)
      );
    }

    if (!debouncedSearch && statusFilter !== 'all') items = items.filter((h) => h.statut === statusFilter);
    return [...items].sort((a, b) => {
      if (sortBy === 'priority_desc') return priorityRank(b.priorite) - priorityRank(a.priorite);
      if (sortBy === 'priority_asc') return priorityRank(a.priorite) - priorityRank(b.priorite);
      if (sortBy === 'status') return statusRank(a.statut) - statusRank(b.statut);
      return b._id.localeCompare(a._id);
    });
  }, [habits, searchResults, debouncedSearch, statusFilter, sortBy, categoryFilter, userCategories, customCategories]);

  const handleToggleDay = async (habitId, dayIndex) => {
    const isToday = dayIndex === todayIndex;
    const prevTodayStatus = { ...todayStatus };
    const prevWeekly = weeklyCompletionMap[String(habitId)] || [false, false, false, false, false, false, false];
    const nextWeekly = [...prevWeekly];
    nextWeekly[dayIndex] = !nextWeekly[dayIndex];
    const willComplete = nextWeekly[dayIndex] === true;
    setWeeklyCompletionMap((prev) => ({ ...prev, [String(habitId)]: nextWeekly }));
    if (isToday) {
      setTodayStatus((prev) => ({
        ...prev,
        [habitId]: { ...(prev[habitId] || {}), id: prev[habitId]?.id, statut: willComplete ? 'completee' : 'non_completee' },
      }));
    }
    setBusy(true);
    try {
      const targetDate = toLocalDateKey(weekDateAtIndex(dayIndex));
      await apiFetch('/logs/toggle', {
        method: 'POST',
        body: JSON.stringify({ habit_id: habitId, date: `${targetDate}T12:00:00.000Z` }),
      });
      await loadTodayStatus();
      await loadHabits();
      toast({ variant: 'success', title: willComplete ? 'Jour marqué complété' : 'Jour marqué non complété' });
    } catch (err) {
      setWeeklyCompletionMap((prev) => ({ ...prev, [String(habitId)]: prevWeekly }));
      if (isToday) setTodayStatus(prevTodayStatus);
      toast({ variant: 'error', title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du log' });
    } finally {
      setBusy(false);
    }
  };

  const handleClone = async (habitId) => {
    setBusy(true);
    try {
      await apiFetch(`/habits/${habitId}/clone`, { method: 'POST', body: JSON.stringify({}) });
      await loadHabits();
      toast({ variant: 'success', title: 'Habitude dupliquée' });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur de duplication', description: err instanceof Error ? err.message : 'Erreur lors de la copie' });
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePause = async (habitId, statut) => {
    setBusy(true);
    try {
      await apiFetch(`/habits/${habitId}/status`, { method: 'PATCH', body: JSON.stringify({ statut }) });
      await loadHabits();
      toast({ variant: 'success', title: statut === 'pause' ? 'Habitude mise en pause' : 'Habitude reprise' });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut' });
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (habitId) => {
    const habit = habits.find(h => String(h._id) === String(habitId));
    const isGlobal = !!(habit?.is_global || habit?.created_by_admin);
    setBusy(true);
    try {
      if (isGlobal) {
        // Archive only in personal settings — does not affect other users
        await apiFetch(`/habits/${habitId}/my-settings`, {
          method: 'PATCH',
          body: JSON.stringify({ statut_perso: 'archive' }),
        });
      } else {
        await apiFetch(`/habits/${habitId}/status`, { method: 'PATCH', body: JSON.stringify({ statut: 'archived' }) });
      }
      await loadHabits();
      toast({ variant: 'info', title: 'Habitude archivée' });
    } catch (err) {
      toast({ variant: 'error', title: "Erreur d'archivage", description: err instanceof Error ? err.message : "Erreur lors de l'archivage" });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateDate = async (habitId, dateDeDebut) => {
    setBusy(true);
    try {
      await apiFetch(`/habits/${habitId}`, { method: 'PUT', body: JSON.stringify({ date_debut: dateDeDebut || undefined }) });
      await loadHabits();
      toast({ variant: 'success', title: 'Date mise à jour' });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la date' });
    } finally {
      setBusy(false);
    }
  };

  const handleOpenNotes = (habit) => {
    setNotesHabit(habit);
    setShowNotes(true);
  };

  const handleSaveNotes = async (notes) => {
    if (!notesHabit) return;
    const isGlobal = !!(notesHabit.is_global || notesHabit.created_by_admin);
    setBusy(true);
    try {
      const endpoint = isGlobal
        ? `/habits/${notesHabit._id}/my-settings`
        : `/habits/${notesHabit._id}/notes`;
      await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify({ note: notes || undefined }) });
      await loadHabits();
      setShowNotes(false);
      setNotesHabit(null);
      toast({ variant: 'success', title: 'Notes sauvegardées' });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des notes' });
    } finally {
      setBusy(false);
    }
  };

  const handlePersonalize = async (habitId, settings) => {
    setBusy(true);
    try {
      await apiFetch(`/habits/${habitId}/my-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      await loadHabits();
      setPersonalizeHabit(null);
      toast({ variant: 'success', title: 'Personnalisation sauvegardée' });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur lors de la personnalisation' });
    } finally {
      setBusy(false);
    }
  };

  const handleViewHistory = async () => {
    if (!notesHabit) return;
    try {
      const history = await apiFetch(`/habits/${notesHabit._id}/notes/history`);
      setNoteHistory(history);
      setShowNotes(false);
      setShowHistory(true);
    } catch (err) {
      toast({ variant: 'error', title: "Erreur d'historique", description: err instanceof Error ? err.message : "Erreur lors du chargement de l'historique" });
    }
  };

  return (
    <div className="mx-auto w-100 max-w-7xl space-y-6">
      {/* Page header */}
      <div className="d-flex flex-column gap-3 flex-sm-row align-items-sm-start justify-content-between">
        <div>
          <h1 className="fs-2 fw-bold tracking-tight text-body">Mes habitudes</h1>
          <p className="mt-1 text-sm text-muted">Gérez, suivez et améliorez vos habitudes au quotidien.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn btn-primary d-inline-flex align-items-center gap-2 rounded-4 px-3 py-2 text-sm fw-semibold flex-shrink-0"
          >
            Ajouter une habitude
          </button>
        )}
      </div>

      <div className="card-elevated overflow-hidden">
        <HabitHeader
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          search={search}
          onSearch={setSearch}
          sortBy={sortBy}
          onSortBy={setSortBy}
          userCategoryMeta={userCategoryMeta}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
        />
        <HabitTable
          habits={filteredHabits}
          todayStatus={todayStatus}
          loading={loading || searchLoading}
          disabled={busy}
          onEdit={(habit) => setEditHabit(habit)}
          onClone={handleClone}
          onTogglePause={handleTogglePause}
          onArchive={handleArchive}
          onToggleDay={handleToggleDay}
          onNotes={canNotes ? handleOpenNotes : undefined}
          onPersonalize={(habit) => setPersonalizeHabit(habit)}
          onUpdateDate={handleUpdateDate}
          weeklyCompletionMap={weeklyCompletionMap}
          todayIndex={todayIndex}
          canManage={canManage}
          canNotes={canNotes}
        />
      </div>

      <AddHabitModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); loadHabits(); }}
      />

      <UpdateHabitModal
        show={editHabit !== null}
        habit={editHabit}
        onClose={() => setEditHabit(null)}
        onSuccess={() => { setEditHabit(null); loadHabits(); }}
        allowedCategories={allowedCategorySlugs.length > 0 ? allowedCategorySlugs : userCategories}
      />

      {canNotes && (
        <NotesModal
          show={showNotes}
          habitNotes={notesHabit?.note ?? ''}
          onClose={() => { setShowNotes(false); setNotesHabit(null); }}
          onSave={handleSaveNotes}
          onViewHistory={handleViewHistory}
          saving={busy}
        />
      )}

      {canNotes && (
        <NoteHistoryModal
          show={showHistory}
          history={noteHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {personalizeHabit && (
        <PersonalizeModal
          habit={personalizeHabit}
          onClose={() => setPersonalizeHabit(null)}
          onSave={(settings) => handlePersonalize(personalizeHabit._id, settings)}
          saving={busy}
        />
      )}
    </div>
  );
};
