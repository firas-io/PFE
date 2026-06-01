'use client';
import React from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { userFirstName, userLastName } from '@/lib/userDisplay';

export const NoteTable = ({ notes, loading, page, pagination, onPageChange }) => {
  const actionLabel = (action) => {
    if (action === 'created') return <span className="adm-status adm-status--done">Créée</span>;
    if (action === 'updated') return <span className="adm-status adm-status--review">Modifiée</span>;
    return <span className="adm-status adm-status--rejected">Supprimée</span>;
  };

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table card-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Habitude</th>
              <th>Action</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm me-2" />Chargement…
                </td>
              </tr>
            ) : notes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-secondary">Aucune note trouvée.</td>
              </tr>
            ) : (
              notes.map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <div className="fw-medium">{userFirstName(entry.user_id)} {userLastName(entry.user_id)}</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>{entry.user_id?.email}</div>
                  </td>
                  <td>
                    <div className="fw-medium">{entry.habit_id?.nom}</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>{entry.habit_id?.categorie}</div>
                  </td>
                  <td>{actionLabel(entry.action)}</td>
                  <td>
                    <span className="text-secondary" style={{ maxWidth: 260, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
                      {entry.new_note || <em style={{ opacity: 0.6 }}>vide</em>}
                    </span>
                  </td>
                  <td className="text-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(entry.createdAt).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="adm-pagination">
          <span className="adm-pagination-info">
            Page {page} sur {pagination.pages}
          </span>
          <div className="adm-pagination-btns">
            <button className="adm-pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}><IconChevronLeft size={14} /></button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 1 || p === 1 || p === pagination.pages)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: '5px 4px', color: '#94A3B8', fontSize: 12 }}>…</span>}
                  <button
                    className="adm-pagination-btn"
                    style={p === page ? { background: '#4338CA', color: '#fff', borderColor: '#4338CA' } : {}}
                    onClick={() => onPageChange(p)}
                  >{p}</button>
                </React.Fragment>
              ))}
            <button className="adm-pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page === pagination.pages}><IconChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
