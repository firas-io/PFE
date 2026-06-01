'use client';
import React from 'react';

import { CATEGORY_LABELS, FREQUENCY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../../_constants';
import { Actions } from './Actions/Actions';

const StatusBadge = ({ statut }) => {
  const cls = statut === 'archived' ? 'adm-status--inactive' : statut === 'pause' ? 'adm-status--pending' : 'adm-status--active';
  return <span className={`adm-status ${cls}`}>{STATUS_LABELS[statut] || 'Active'}</span>;
};

const VisibilityBadge = ({ visible }) =>
  visible
    ? <span className="adm-status adm-status--team">Public</span>
    : <span className="adm-status adm-status--personal">Privé</span>;

export const HabitTable = ({ habits, loading, onEdit, onRefetch, canManage }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <p>Aucune habitude trouvée.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop ── */}
      <div className="card d-none d-md-block">
        <div className="table-responsive">
          <table className="table card-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Fréquence</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Visibilité</th>
                {canManage && <th style={{ width: 1 }} />}
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => (
                <tr key={h._id}>
                  <td>
                    <div className="fw-medium">{h.nom}</div>
                    {h.description && <div className="text-secondary" style={{ fontSize: 12 }}>{h.description}</div>}
                  </td>
                  <td>{h.categorie_label || CATEGORY_LABELS[h.categorie] || h.categorie || <span className="text-secondary">—</span>}</td>
                  <td>{FREQUENCY_LABELS[h.frequence] || h.frequence || <span className="text-secondary">—</span>}</td>
                  <td>{PRIORITY_LABELS[h.priorite] || h.priorite || <span className="text-secondary">—</span>}</td>
                  <td><StatusBadge statut={h.statut} /></td>
                  <td><VisibilityBadge visible={h.visible_pour_tous} /></td>
                  {canManage && <td><Actions habit={h} onEdit={onEdit} onRefetch={onRefetch} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {habits.map((h) => (
          <div key={h._id} className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-semibold">{h.nom}</div>
                  {h.description && <div className="text-secondary" style={{ fontSize: 12 }}>{h.description}</div>}
                </div>
                <StatusBadge statut={h.statut} />
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="adm-status adm-status--personal">{h.categorie_label || CATEGORY_LABELS[h.categorie] || h.categorie}</span>
                <VisibilityBadge visible={h.visible_pour_tous} />
              </div>
              <div className="text-secondary mb-2" style={{ fontSize: 12 }}>
                {h.date_debut ? new Date(h.date_debut).toLocaleDateString('fr-FR') : ''}
                {h.frequence ? ` · ${FREQUENCY_LABELS[h.frequence] || h.frequence}` : ''}
              </div>
              {canManage && <Actions habit={h} onEdit={onEdit} onRefetch={onRefetch} />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
