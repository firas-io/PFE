'use client';
import React from 'react';

export const HabitsProgressTable = ({ habits }) => (
  <div className="card">
    <div className="card-header">Avancement par habitude</div>
    <div className="table-responsive">
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            <th>Habitude</th>
            <th>Statut</th>
            <th>Complétées</th>
            <th>Total logs</th>
            <th>Taux</th>
            <th>Dernier log</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => (
            <tr key={h.habit_id}>
              <td><div className="fw-medium">{h.habit_nom}</div></td>
              <td>{h.statut}</td>
              <td>{h.completed_logs}</td>
              <td>{h.total_logs}</td>
              <td>{h.completion_rate}%</td>
              <td>{h.last_log_date ? new Date(h.last_log_date).toLocaleString('fr-FR') : '-'}</td>
            </tr>
          ))}
          {!habits.length && (
            <tr>
              <td colSpan={6} className="text-secondary text-center py-4">
                Aucune habitude trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
