'use client';
import React from 'react';
import Link from 'next/link';

export const DashboardTable = ({ managers, rosterTotals, habits, loading }) => {
  const habitsActive = habits.filter((h) => (h.statut || 'active') === 'active').length;

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div>Vue rapide</div>
        {loading && <div className="text-secondary small">Mise à jour...</div>}
      </div>
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Indicateur</th>
              <th>Valeur</th>
              <th style={{ width: 1 }} />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Managers</td>
              <td>Comptes managers</td>
              <td>{managers.length}</td>
              <td><Link href="/admin/managers" className="btn btn-sm btn-outline-primary">Ouvrir</Link></td>
            </tr>
            <tr>
              <td>Équipes</td>
              <td>Utilisateurs encadrés (tous managers)</td>
              <td>{rosterTotals.total}</td>
              <td><Link href="/admin/users" className="btn btn-sm btn-outline-primary">Consulter</Link></td>
            </tr>
            <tr>
              <td>Équipes</td>
              <td>Utilisateurs actifs</td>
              <td>{rosterTotals.active}</td>
              <td><Link href="/admin/users" className="btn btn-sm btn-outline-primary">Consulter</Link></td>
            </tr>
            <tr>
              <td>Habitudes</td>
              <td>Total habitudes (compte admin)</td>
              <td>{habits.length}</td>
              <td><Link href="/admin/habits" className="btn btn-sm btn-outline-primary">Ouvrir</Link></td>
            </tr>
            <tr>
              <td>Habitudes</td>
              <td>Habitudes actives</td>
              <td>{habitsActive}</td>
              <td><Link href="/admin/habits?active=true" className="btn btn-sm btn-outline-primary">Ouvrir</Link></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
