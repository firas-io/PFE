'use client';
import React from 'react';

import { CATEGORY_LABELS, FREQUENCY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../../_constants';
import { Actions } from './Actions/Actions';

export const HabitTable = ({ habits, loading, onEdit, onRefetch }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Date de début</th>
              <th>Fréquence</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Visibilité</th>
              <th style={{ width: 1 }} />
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h._id}>
                <td>
                  <div className="fw-medium">{h.nom}</div>
                  {h.description && <div className="text-secondary small">{h.description}</div>}
                </td>
                <td>{h.categorie_label || CATEGORY_LABELS[h.categorie] || h.categorie || '-'}</td>
                <td>{h.date_debut ? new Date(h.date_debut).toLocaleDateString('fr-FR') : '-'}</td>
                <td>{FREQUENCY_LABELS[h.frequence] || h.frequence || '-'}</td>
                <td>{PRIORITY_LABELS[h.priorite] || h.priorite || '-'}</td>
                <td>
                  <span
                    className={`badge ${
                      h.statut === 'archived'
                        ? 'bg-secondary'
                        : h.statut === 'pause'
                        ? 'bg-warning text-dark'
                        : 'bg-success'
                    }`}
                  >
                    {STATUS_LABELS[h.statut] || 'Active'}
                  </span>
                </td>
                <td>
                  {h.visible_pour_tous ? (
                    <span className="badge bg-info text-dark">Tous les utilisateurs</span>
                  ) : (
                    <span className="badge bg-light text-dark border">Admin uniquement</span>
                  )}
                </td>
                <td>
                  <Actions habit={h} onEdit={onEdit} onRefetch={onRefetch} />
                </td>
              </tr>
            ))}
            {habits.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-secondary py-4">
                  Aucune habitude.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
