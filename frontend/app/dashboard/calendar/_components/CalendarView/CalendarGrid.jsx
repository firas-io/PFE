'use client';
import React from 'react';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function dayKey(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function getDotColor(statut) {
  if (statut === 'completee') return '#10b981';
  if (statut === 'manquee')   return '#ef4444';
  return '#cbd5e1';
}

export const CalendarGrid = ({ calendarCells, selectedDate, allHabits, habitLogsMap, loading, onSelectDay, onHoverDate }) => (
  <div className="cal-grid">
    {/* Weekday headers */}
    {WEEK_DAYS.map(label => (
      <div key={label} className="cal-grid-header">{label}</div>
    ))}

    {/* Day cells */}
    {calendarCells.map((day, index) => {
      if (!day) {
        return <div key={`empty-${index}`} className="cal-day-empty" />;
      }

      const iso = dayKey(day);
      const isSelected = selectedDate === iso;
      const dayLogs = habitLogsMap[iso] || {};
      const completedCount = Object.values(dayLogs).filter(l => l?.statut === 'completee').length;

      return (
        <button
          key={iso}
          type="button"
          className={`cal-day-cell${isSelected ? ' is-selected' : ''}`}
          onClick={() => onSelectDay(iso)}
          onMouseEnter={() => onHoverDate(iso)}
          onMouseLeave={() => onHoverDate(null)}
          disabled={loading}
          title={`${completedCount}/${allHabits.length} complétées`}
        >
          <div className="cal-day-top">
            <span className="cal-day-num">{day.getDate()}</span>
            {allHabits.length > 0 && (
              <span className="cal-day-ratio">{completedCount}/{allHabits.length}</span>
            )}
          </div>
          <div className="cal-day-dots">
            {allHabits.map(habit => {
              const log = dayLogs[String(habit._id)];
              return (
                <span
                  key={habit._id}
                  className="cal-day-dot"
                  style={{ background: getDotColor(log?.statut) }}
                  title={habit.nom}
                />
              );
            })}
          </div>
        </button>
      );
    })}
  </div>
);
