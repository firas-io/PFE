'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { IconCheck, IconHistory, IconNotes } from '@tabler/icons-react';

export const NotesModal = ({ show, habitNotes, onClose, onSave, onViewHistory, saving }) => {
  const [notes, setNotes] = useState(habitNotes ?? '');

  React.useEffect(() => {
    if (show) setNotes(habitNotes ?? '');
  }, [show, habitNotes]);

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Modal
      open={show}
      title={<><IconNotes size={20} className="me-2" />Notes sur l'habitude</>}
      onClose={handleClose}
      footer={
        <div className="d-flex w-100 justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onViewHistory}
            disabled={saving}
            title="Voir l'historique des modifications"
          >
            <IconHistory size={16} className="me-2" />Historique
          </button>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={saving}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onSave(notes)} disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Sauvegarde...</>
                : <><IconCheck size={16} className="me-2" />Enregistrer les notes</>}
            </button>
          </div>
        </div>
      }
    >
      <p className="text-secondary">Ajoutez des notes personnelles sur cette habitude.</p>
      <textarea
        className="form-control"
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Entrez vos notes ici... (ex: Mes motivations, conseils, difficultés, etc.)"
        disabled={saving}
      />
    </Modal>
  );
};
