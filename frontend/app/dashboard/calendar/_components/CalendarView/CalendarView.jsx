'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CalendarGrid } from './CalendarGrid';
import { CatchupModal } from './CatchupModal';

function dayKey(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const CHECK_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <path d="m20 6-11 11-5-5" strokeLinecap="round"/>
  </svg>
);
const X_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
  </svg>
);

export const CalendarView = () => {
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));
  const [hoveredDate,  setHoveredDate]  = useState(null);
  const [allHabits,    setAllHabits]    = useState([]);
  const [allLogs,      setAllLogs]      = useState([]);

  const [showCatchup,             setShowCatchup]             = useState(false);
  const [catchupDate,             setCatchupDate]             = useState('');
  const [incompleteHabits,        setIncompleteHabits]        = useState([]);
  const [selectedHabitForCatchup, setSelectedHabitForCatchup] = useState(null);
  const [catchupPhotoFile,        setCatchupPhotoFile]        = useState(null);
  const [catchupPhotoPreview,     setCatchupPhotoPreview]     = useState(null);
  const [catchupNotes,            setCatchupNotes]            = useState('');
  const [catchupLoading,          setCatchupLoading]          = useState(false);

  const loadCalendar = useCallback(async (isoDate) => {
    try {
      setLoading(true); setError(null);
      const payload = await apiFetch(`/progress/calendar?date=${encodeURIComponent(isoDate)}`);
      setSelectedDate(payload.selectedDate);
      setAllHabits(payload.allHabits || payload.habits.map(h => ({ _id: h._id, nom: h.nom, statut: h.statut })));
      setAllLogs(payload.allLogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadCalendar(dayKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)));
  }, [currentMonth, loadCalendar]);

  const selectedLabel = useMemo(() => {
    const d = hoveredDate || selectedDate;
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }, [selectedDate, hoveredDate]);

  const calendarCells = useMemo(() => {
    const cells = [];
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const start = first.getDay();
    for (let i = 0; i < start; i++) cells.push(null);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    return cells;
  }, [currentMonth]);

  const habitLogsMap = useMemo(() => {
    const map = {};
    allLogs.forEach(log => {
      const key = dayKey(log.date);
      if (!map[key]) map[key] = {};
      map[key][String(log.habit_id)] = log;
    });
    return map;
  }, [allLogs]);

  const loadIncomplete = async (date) => {
    try {
      setCatchupLoading(true); setError(null);
      const r = await apiFetch(`/logs/incomplete-for-date/${date}`);
      setIncompleteHabits(r.incomplete_habits || []);
      setCatchupDate(date);
      setShowCatchup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setCatchupLoading(false); }
  };

  const handleCatchupSubmit = async () => {
    if (!selectedHabitForCatchup || !catchupPhotoFile) {
      setError('Sélectionnez une habitude et une photo'); return;
    }
    try {
      setCatchupLoading(true); setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        await apiFetch('/logs/catchup', { method: 'POST', body: JSON.stringify({ habit_id: selectedHabitForCatchup, date: catchupDate, photo_url: e.target?.result, notes: catchupNotes || undefined }) });
        await loadCalendar(selectedDate);
        setShowCatchup(false); setCatchupPhotoFile(null); setCatchupPhotoPreview(null); setCatchupNotes(''); setSelectedHabitForCatchup(null);
      };
      reader.readAsDataURL(catchupPhotoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setCatchupLoading(false); }
  };

  const activeDate = hoveredDate || selectedDate;
  const dayLogs    = habitLogsMap[activeDate] || {};
  const dayHabits  = allHabits.map(h => ({ ...h, log: dayLogs[String(h._id)] || null }));
  const dayDone    = dayHabits.filter(h => h.log?.statut === 'completee').length;
  const dayPct     = dayHabits.length > 0 ? Math.round((dayDone / dayHabits.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats bar */}
      <div className="cal-stats">
        <div className="cal-stat-card">
          <p className="cal-stat-label">Completion</p>
          <p className="cal-stat-value cal-stat-value--green">{dayPct}%</p>
        </div>
        <div className="cal-stat-card">
          <p className="cal-stat-label">Habitudes</p>
          <p className="cal-stat-value cal-stat-value--indigo">{allHabits.length}</p>
        </div>
        <div className="cal-stat-card">
          <p className="cal-stat-label">Ce jour</p>
          <p className="cal-stat-value cal-stat-value--purple">{dayDone} fait{dayDone !== 1 ? "s" : ""}</p>
        </div>
        <div className="cal-stat-card">
          <p className="cal-stat-label">Rattraper</p>
          <input
            type="date"
            disabled={catchupLoading}
            onChange={e => { if (e.target.value) loadIncomplete(e.target.value); }}
            className="cal-catchup-input"
          />
        </div>
      </div>

      {error && <div className="cal-error">{error}</div>}

      {/* Main layout */}
      <div className="cal-layout">

        {/* Calendar panel */}
        <div className="cal-main">
          <div className="cal-month-header">
            <h2 className="cal-month-title">
              {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <div className="cal-nav">
              <button
                onClick={() => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                className="cal-nav-btn"
              >‹</button>
              <button
                onClick={() => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                className="cal-nav-btn"
              >›</button>
            </div>
          </div>

          <div className="cal-legend">
            <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--done" /> 100%</span>
            <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--partial" /> Partiel</span>
            <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--missed" /> Manqué</span>
          </div>

          <CalendarGrid
            currentMonth={currentMonth}
            calendarCells={calendarCells}
            selectedDate={selectedDate}
            allHabits={allHabits}
            habitLogsMap={habitLogsMap}
            loading={loading}
            onSelectDay={async (d) => { setSelectedDate(d); await loadCalendar(d); }}
            onHoverDate={setHoveredDate}
          />
        </div>

        {/* Right panel */}
        <div className="cal-right">

          {/* Day header */}
          <div className="cal-day-header">
            <p className="cal-day-header-label">{selectedLabel}</p>
            <p className="cal-day-header-count">{dayDone}/{dayHabits.length} habitudes complétées</p>
            {dayHabits.length > 0 && (
              <div className="cal-day-progress-track">
                <div className="cal-day-progress-fill" style={{ width: `${dayPct}%` }} />
              </div>
            )}
          </div>

          {/* Habit list */}
          <div className="cal-habits-panel">
            <h3 className="cal-habits-panel-title">Détails du jour</h3>
            {dayHabits.length === 0 ? (
              <p className="cal-habits-empty">Aucune habitude</p>
            ) : dayHabits.slice(0, 6).map(h => {
              const done   = h.log?.statut === 'completee';
              const missed = h.log && h.log.statut !== 'completee';
              const variant = done ? 'done' : missed ? 'missed' : 'neutral';
              return (
                <div key={String(h._id)} className={`cal-habit-row cal-habit-row--${variant}`}>
                  <div className={`cal-habit-icon cal-habit-icon--${variant}`}>
                    {done   && CHECK_ICON}
                    {missed && X_ICON}
                  </div>
                  <div className="cal-habit-name">
                    <p>{h.nom}</p>
                    {h.log?.notes && <p className="cal-habit-notes">&ldquo;{h.log.notes}&rdquo;</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CatchupModal
        show={showCatchup}
        catchupDate={catchupDate}
        incompleteHabits={incompleteHabits}
        selectedHabit={selectedHabitForCatchup}
        onSelectHabit={setSelectedHabitForCatchup}
        photoPreview={catchupPhotoPreview}
        onPhotoChange={file => { setCatchupPhotoFile(file); const r = new FileReader(); r.onload = e => setCatchupPhotoPreview(e.target?.result); r.readAsDataURL(file); }}
        onRemovePhoto={() => { setCatchupPhotoPreview(null); setCatchupPhotoFile(null); }}
        catchupNotes={catchupNotes}
        onNotesChange={setCatchupNotes}
        onClose={() => { setShowCatchup(false); setSelectedHabitForCatchup(null); setCatchupPhotoFile(null); setCatchupPhotoPreview(null); setCatchupNotes(''); }}
        onSubmit={handleCatchupSubmit}
        loading={catchupLoading}
      />
    </div>
  );
};
