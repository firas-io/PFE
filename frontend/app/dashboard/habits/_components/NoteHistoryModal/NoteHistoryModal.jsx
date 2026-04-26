'use client';
import React from 'react';
import { Modal } from '@/components/Modal';
import { IconHistory } from '@tabler/icons-react';

export const NoteHistoryModal = ({ show, history, onClose }) => (
  <Modal
    open={show}
    title={<><IconHistory size={20} className="me-2" />Historique des modifications</>}
    size="lg"
    onClose={onClose}
    footer={
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Fermer
      </button>
    }
  >
    {history.length === 0 ? (
      <p className="text-secondary text-center py-4">Aucune modification enregistrée.</p>
    ) : (
      <div className="timeline" style={{ paddingLeft: '20px' }}>
        {history.map((entry) => (
          <div key={entry._id} style={{ marginBottom: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-30px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0d6efd' }} />
            <div style={{ paddingLeft: '10px', borderLeft: '2px solid #ddd', paddingBottom: '1rem' }}>
              <div className="fw-semibold">
                {entry.utilisateur_id?.prenom} {entry.utilisateur_id?.nom}
                <small className="ms-2 text-secondary">({entry.utilisateur_id?.email})</small>
              </div>
              <small className="text-secondary d-block mb-2">
                {new Date(entry.createdAt).toLocaleString('fr-FR')}
              </small>
              <span className="badge bg-info me-2 mb-2">
                {entry.action === 'created' ? 'Créée' : entry.action === 'updated' ? 'Modifiée' : 'Supprimée'}
              </span>
              {entry.old_note && (
                <div className="mb-2">
                  <small className="text-secondary d-block">Avant:</small>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #dc3545' }}>
                    <small>{entry.old_note}</small>
                  </div>
                </div>
              )}
              {entry.new_note && (
                <div>
                  <small className="text-secondary d-block">Après:</small>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #28a745' }}>
                    <small>{entry.new_note}</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </Modal>
);
