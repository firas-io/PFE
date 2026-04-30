'use client';
import React from 'react';

function StatusBadge({ statut }) {
  if (statut === 'active')   return <span className="adm-status adm-status--active">Active</span>;
  if (statut === 'inactive') return <span className="adm-status adm-status--inactive">Inactive</span>;
  if (statut === 'pending')  return <span className="adm-status adm-status--pending">En attente</span>;
  return <span className="adm-status adm-status--inactive">{statut}</span>;
}

export const HabitsProgressTable = ({ habits }) => {
  return (
    <div className="card">
      <div className="card-header"><h3 className="card-title mb-0">Avancement par habitude</h3></div>
      <div className="table-responsive">
        <table className="table card-table">
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
                <td>
                  <div className="fw-medium">{h.habit_nom}</div>
                  {h.visible_pour_tous && <div className="text-secondary" style={{ fontSize: 12 }}>Habitude partagée</div>}
                </td>
                <td><StatusBadge statut={h.statut} /></td>
                <td>{h.completed_logs}</td>
                <td>{h.total_logs}</td>
                <td>{h.completion_rate}%</td>
                <td className="text-secondary" style={{ fontSize: 12 }}>
                  {h.last_log_date ? new Date(h.last_log_date).toLocaleString('fr-FR') : '—'}
                </td>
              </tr>
            ))}
            {!habits.length && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">Aucune habitude trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
