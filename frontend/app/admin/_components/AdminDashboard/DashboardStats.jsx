'use client';
import React from 'react';
import Link from 'next/link';

export const DashboardStats = ({ managers, rosterTotals, habits }) => {
  const habitsActive = habits.filter((h) => (h.statut || 'active') === 'active').length;
  const habitsPaused = habits.filter((h) => h.statut === 'pause').length;
  const habitsArchived = habits.filter((h) => h.statut === 'archived').length;

  return (
    <div className="row g-3 mb-3">
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-secondary small">MANAGERS &amp; ÉQUIPES</div>
            <div className="h2 mb-1">{managers.length}</div>
            <div className="text-secondary mb-3">
              {rosterTotals.total} utilisateur{rosterTotals.total === 1 ? '' : 's'} encadré{rosterTotals.total === 1 ? '' : 's'}
              {' · '}
              {rosterTotals.active} actif{rosterTotals.active === 1 ? '' : 's'}
            </div>
            <Link className="btn btn-primary btn-sm me-2" href="/admin/managers">Gérer les managers</Link>
            <Link className="btn btn-outline-primary btn-sm" href="/admin/users">Voir les équipes</Link>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-secondary small">MES HABITUDES (admin)</div>
            <div className="h2 mb-1">{habits.length}</div>
            <div className="text-secondary mb-3">
              {habitsActive} actives · {habitsPaused} en pause · {habitsArchived} archivées
            </div>
            <Link className="btn btn-primary btn-sm" href="/admin/habits">Gérer les habitudes</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
