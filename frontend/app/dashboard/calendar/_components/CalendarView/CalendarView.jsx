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

export const CalendarView = () => {
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));
  const [hoveredDate,  setHoveredDate]  = useState(null);
  const [days,         setDays]         = useState([]);
  const [habits,       setHabits]       = useState([]);
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
      setDays(payload.days);
      setHabits(payload.habits);
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
    const first  = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const start  = first.getDay(); // 0=Sun
    for (let i = 0; i < start; i++) cells.push(null);
    const days = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
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

  // Selected day habits
  const activeDate  = hoveredDate || selectedDate;
  const dayLogs     = habitLogsMap[activeDate] || {};
  const dayHabits   = allHabits.map(h => ({ ...h, log: dayLogs[String(h._id)] || null }));
  const dayDone     = dayHabits.filter(h => h.log?.statut === 'completee').length;
  const dayPct      = dayHabits.length > 0 ? Math.round((dayDone / dayHabits.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'COMPLETION RATE', value: `${dayPct}%`, color: '#059669' },
          { label: 'ACTIVE HABITS',   value: String(allHabits.length), color: '#4338CA' },
          { label: 'SELECTED DAY',    value: dayDone + ' done', color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: s.color, margin: 0, letterSpacing: '-0.5px' }}>{s.value}</p>
          </div>
        ))}
        {/* Log retroactif */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>RATTRAPER</p>
          <input
            type="date"
            disabled={catchupLoading}
            onChange={e => { if (e.target.value) loadIncomplete(e.target.value); }}
            style={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 8px', color: '#374151', fontFamily: 'inherit', cursor: 'pointer' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px' }}>
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>
              {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth()-1, 1))}
                style={{ border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >‹</button>
              <button
                onClick={() => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth()+1, 1))}
                style={{ border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >›</button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }}/> 100%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}/> 50%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}/> Missed</span>
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

        {/* Right panel — day detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Day header */}
          <div style={{ background: '#4338CA', borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: '0 0 4px', textTransform: 'capitalize' }}>
              {selectedLabel}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              {dayDone}/{dayHabits.length} habitudes complétées
            </p>
            {dayHabits.length > 0 && (
              <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${dayPct}%`, background: '#fff', borderRadius: 4, transition: 'width 0.5s' }}/>
              </div>
            )}
          </div>

          {/* Habit list for day */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Détails du jour</h3>
            {dayHabits.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>Aucune habitude</p>
            ) : (
              dayHabits.slice(0, 6).map(h => {
                const done    = h.log?.statut === 'completee';
                const missed  = h.log && h.log.statut !== 'completee';
                return (
                  <div key={String(h._id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 10,
                    background: done ? '#F0FDF4' : missed ? '#FEF2F2' : '#F9FAFB',
                    border: `1px solid ${done ? '#BBF7D0' : missed ? '#FECACA' : '#F3F4F6'}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: done ? '#059669' : missed ? '#EF4444' : '#E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m20 6-11 11-5-5" strokeLinecap="round"/></svg> : null}
                      {missed ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/></svg> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nom}</p>
                      {h.log?.notes && (
                        <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          &ldquo;{h.log.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
