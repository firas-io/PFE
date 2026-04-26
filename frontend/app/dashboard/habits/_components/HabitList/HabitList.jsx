'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useCategories } from '@/hooks/useCategories';
import { priorityRank, statusRank, CATEGORY_LABELS, FREQUENCY_LABELS, PRIORITY_LABELS } from '../../_constants';
import { HabitHeader } from './HabitHeader';
import { HabitTable } from './HabitTable';
import { AddHabitModal } from '../AddHabitModal';
import { UpdateHabitModal } from '../UpdateHabitModal';
import { NotesModal } from '../NotesModal';
import { NoteHistoryModal } from '../NoteHistoryModal';

export const HabitList = () => {
  const { toast } = useToast();
  const { categories: allCategories } = useCategories();
  const [habits, setHabits] = useState([]);
  const [todayStatus, setTodayStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // User's onboarding-selected categories (slugs)
  const [userCategories, setUserCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | slug

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState(null);

  const [notesHabit, setNotesHabit] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const [noteHistory, setNoteHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [weeklyCompletionMap, setWeeklyCompletionMap] = useState({});

  // Load onboarding categories once on mount — only for role 'utilisateur'
  useEffect(() => {
    const u = getUser();
    setUserCategories(u?.role === 'utilisateur' ? (u?.categories ?? []) : []);
  }, []);

  // Enrich user category slugs with full metadata (label + color) for tab UI
  const userCategoryMeta = useMemo(
    () => allCategories.filter((c) => userCategories.includes(c.slug)),
    [allCategories, userCategories]
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
    let items = habits;

    // Category tab filter: specific category selected → show only that one.
    // No specific tab → restrict to user's onboarding categories (if set).
    if (categoryFilter !== 'all') {
      items = items.filter((h) => h.categorie === categoryFilter);
    } else if (userCategories.length > 0) {
      items = items.filter((h) => userCategories.includes(h.categorie));
    }

    if (statusFilter !== 'all') items = items.filter((h) => h.statut === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((h) => {
        const text = `${h.nom ?? h.titre ?? ''} ${h.description ?? ''} ${h.categorie_label ?? ''} ${CATEGORY_LABELS[h.categorie] ?? ''} ${FREQUENCY_LABELS[h.frequence] ?? ''} ${PRIORITY_LABELS[h.priorite] ?? ''}`.toLowerCase();
        return text.includes(q);
      });
    }
    return [...items].sort((a, b) => {
      if (sortBy === 'priority_desc') return priorityRank(b.priorite) - priorityRank(a.priorite);
      if (sortBy === 'priority_asc') return priorityRank(a.priorite) - priorityRank(b.priorite);
      if (sortBy === 'status') return statusRank(a.statut) - statusRank(b.statut);
      return b._id.localeCompare(a._id);
    });
  }, [habits, statusFilter, search, sortBy, categoryFilter, userCategories]);

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
    setBusy(true);
    try {
      await apiFetch(`/habits/${habitId}/status`, { method: 'PATCH', body: JSON.stringify({ statut: 'archived' }) });
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
    setBusy(true);
    try {
      await apiFetch(`/habits/${notesHabit._id}/notes`, { method: 'PATCH', body: JSON.stringify({ note: notes || undefined }) });
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mes habitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez, suivez et améliorez vos habitudes au quotidien.</p>
      </div>

      <div className="card-elevated overflow-hidden">
        <HabitHeader
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          search={search}
          onSearch={setSearch}
          sortBy={sortBy}
          onSortBy={setSortBy}
          onAdd={() => setShowAdd(true)}
          userCategoryMeta={userCategoryMeta}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
        />
        <HabitTable
          habits={filteredHabits}
          todayStatus={todayStatus}
          loading={loading}
          disabled={busy}
          onEdit={(habit) => setEditHabit(habit)}
          onClone={handleClone}
          onTogglePause={handleTogglePause}
          onArchive={handleArchive}
          onToggleDay={handleToggleDay}
          onNotes={handleOpenNotes}
          onUpdateDate={handleUpdateDate}
          weeklyCompletionMap={weeklyCompletionMap}
          todayIndex={todayIndex}
        />
      </div>

      <AddHabitModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); loadHabits(); }}
        allowedCategories={userCategories}
      />

      <UpdateHabitModal
        show={editHabit !== null}
        habit={editHabit}
        onClose={() => setEditHabit(null)}
        onSuccess={() => { setEditHabit(null); loadHabits(); }}
        allowedCategories={userCategories}
      />

      <NotesModal
        show={showNotes}
        habitNotes={notesHabit?.note ?? ''}
        onClose={() => { setShowNotes(false); setNotesHabit(null); }}
        onSave={handleSaveNotes}
        onViewHistory={handleViewHistory}
        saving={busy}
      />

      <NoteHistoryModal
        show={showHistory}
        history={noteHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};
