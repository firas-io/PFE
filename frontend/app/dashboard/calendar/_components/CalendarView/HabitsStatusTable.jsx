'use client';
import React from 'react';

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

export const HabitsStatusTable = ({ selectedLabel, allHabits, habits, habitLogsMap, hoveredDate, selectedDate }) => (
  <div className="card">
    <div className="card-header d-flex align-items-center justify-content-between">
      <span>Habitudes du {selectedLabel}</span>
    </div>
    <div className="table-responsive">
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            <th>Habitude</th>
            <th>Catégorie</th>
            <th style={{ width: '120px' }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {allHabits.map((habit) => {
            let log = null;
            if (hoveredDate) {
              const dayLogs = habitLogsMap[hoveredDate] || {};
              log = dayLogs[String(habit._id)] || null;
            } else {
              const habitWithLog = habits.find((h) => String(h._id) === String(habit._id));
              log = habitWithLog?.log || null;
            }
            const color = getStatusColor(log?.statut);
            const label = getStatusLabel(log?.statut);

            return (
              <tr key={habit._id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    {habit.nom || '-'}
                  </div>
                </td>
                <td>{habit.statut === 'pause' ? 'Pause' : habit.statut === 'archived' ? 'Archivée' : 'Active'}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: color, color: 'white' }}>
                    {label}
                  </span>
                </td>
              </tr>
            );
          })}
          {!allHabits.length && (
            <tr>
              <td colSpan={3} className="text-secondary text-center py-4">
                Aucune habitude définie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
