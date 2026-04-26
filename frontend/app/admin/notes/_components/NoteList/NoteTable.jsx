'use client';
import React from 'react';
import { userFirstName, userLastName } from '@/lib/userDisplay';

export const NoteTable = ({ notes, loading, page, pagination, onPageChange }) => {
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Habitude</th>
              <th>Action</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Chargement...
                </td>
              </tr>
            ) : notes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-secondary">Aucune note trouvée.</td>
              </tr>
            ) : (
              notes.map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <div className="fw-semibold">
                      {userFirstName(entry.utilisateur_id)} {userLastName(entry.utilisateur_id)}
                    </div>
                  </td>
                  <td>
                    <small className="text-secondary">{entry.utilisateur_id?.email}</small>
                  </td>
                  <td>
                    <div className="fw-semibold">{entry.habit_id?.nom}</div>
                    <small className="text-secondary">{entry.habit_id?.categorie}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        entry.action === 'created'
                          ? 'bg-success'
                          : entry.action === 'updated'
                          ? 'bg-info'
                          : 'bg-danger'
                      }`}
                    >
                      {entry.action === 'created' ? 'Créée' : entry.action === 'updated' ? 'Modifiée' : 'Supprimée'}
                    </span>
                  </td>
                  <td>
                    <small
                      className="text-secondary"
                      style={{ maxWidth: 300, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {entry.note_text || '(vide)'}
                    </small>
                  </td>
                  <td>
                    <small className="text-secondary">
                      {new Date(entry.createdAt).toLocaleString('fr-FR')}
                    </small>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="card-footer d-flex align-items-center">
          <div className="ms-auto">
            <nav aria-label="Page navigation">
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
                    Précédent
                  </button>
                </li>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 1 || p === 1 || p === pagination.pages)
                  .map((p, i, arr) => (
                    <li key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="page-link">...</span>}
                      <button className={`page-link ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
                        {p}
                      </button>
                    </li>
                  ))}
                <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === pagination.pages}>
                    Suivant
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
