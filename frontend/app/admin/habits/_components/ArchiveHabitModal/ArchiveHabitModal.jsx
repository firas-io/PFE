'use client';
import React, { useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';

export const ArchiveHabitModal = ({ show, onHide, onSuccess, habitId, habitNom }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await apiFetch(`/habits/${habitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'archived' }),
      });
      onSuccess();
      onHide();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Archiver l'habitude"
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button className="btn btn-warning" type="button" onClick={handleArchive} disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-archive me-1"></i>}
            Archiver
          </button>
        </div>
      }
    >
      <p>
        Archiver l'habitude <strong>"{habitNom}"</strong> ?
      </p>
      <div className="alert alert-warning">
        <i className="fa fa-exclamation-triangle me-2"></i>
        L'habitude sera masquée mais ses données seront conservées.
      </div>
    </Modal>
  );
};
