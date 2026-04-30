'use client';
import React from 'react';

export const WeeklyTable = ({ weekly }) => {
  return (
    <div className="card mb-3">
      <div className="card-header"><h3 className="card-title mb-0">Progression sur 7 jours</h3></div>
      <div className="table-responsive">
        <table className="table card-table">
          <thead>
            <tr>
              <th>Jour</th>
              <th>Complétées</th>
              <th>Total logs</th>
              <th>Taux</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((d) => (
              <tr key={d.date}>
                <td>{d.label}</td>
                <td>{d.completed}</td>
                <td>{d.total}</td>
                <td>{d.rate}%</td>
              </tr>
            ))}
            {!weekly.length && (
              <tr>
                <td colSpan={4} className="text-secondary text-center py-4">
                  Aucune donnée hebdomadaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
