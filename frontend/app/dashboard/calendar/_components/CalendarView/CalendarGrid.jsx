'use client';
import React from 'react';
import { IconCircleFilled } from '@tabler/icons-react';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function dayKey(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getStatusColor(statut) {
  if (statut === 'completee') return '#10b981';
  if (statut === 'manquee') return '#ef4444';
  return '#9ca3af';
}

function getStatusLabel(statut) {
  if (statut === 'completee') return 'Complétée';
  if (statut === 'manquee') return 'Manquée';
  return 'Sans données';
}

export const CalendarGrid = ({ currentMonth, calendarCells, selectedDate, allHabits, habitLogsMap, loading, onSelectDay, onHoverDate }) => (
  <div className="card mb-4">
    <div className="card-body">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="h5 mb-0">{formatMonthLabel(currentMonth)}</div>
        <div className="text-secondary small">Cliquez sur un jour pour voir les détails</div>
      </div>

      <div className="mb-4 p-3 bg-light rounded d-flex gap-3 flex-wrap justify-content-center">
        <div className="d-flex align-items-center gap-2">
          <IconCircleFilled size={16} color={getStatusColor('completee')} />
          <small>Complétée</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <IconCircleFilled size={16} color={getStatusColor('manquee')} />
          <small>Manquée</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
        {WEEK_DAYS.map((label) => (
          <div key={label} className="text-center text-secondary small fw-bold">{label}</div>
        ))}
        {calendarCells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="rounded border bg-light" style={{ minHeight: '100px' }} />;
          }
          const iso = dayKey(day);
          const isSelected = selectedDate === iso;
          const dayLogs = habitLogsMap[iso] || {};
          const completedCount = Object.values(dayLogs).filter((log) => log?.statut === 'completee').length;
          const missedCount = Object.values(dayLogs).filter((log) => log?.statut === 'manquee').length;

          const cls = ['btn', 'text-start', 'p-2', 'border', 'd-flex', 'flex-column', 'justify-content-between'];
          if (isSelected) cls.push('border-primary', 'bg-primary', 'text-white');
          else cls.push('bg-white');

          return (
            <button
              key={iso}
              type="button"
              className={cls.join(' ')}
              style={{ minHeight: '100px', position: 'relative' }}
              onClick={() => onSelectDay(iso)}
              onMouseEnter={() => onHoverDate(iso)}
              onMouseLeave={() => onHoverDate(null)}
              disabled={loading}
              title={`${completedCount} complétées, ${missedCount} manquées`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <strong className={isSelected ? 'text-white' : ''}>{day.getDate()}</strong>
                {allHabits.length > 0 && (
                  <small className={isSelected ? 'text-light' : 'text-secondary'}>
                    {completedCount}/{allHabits.length}
                  </small>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {allHabits.map((habit) => {
                  const log = dayLogs[String(habit._id)];
                  return (
                    <div
                      key={habit._id}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(log?.statut), opacity: isSelected ? 0.8 : 1 }}
                      title={`${habit.nom}: ${getStatusLabel(log?.statut)}`}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
