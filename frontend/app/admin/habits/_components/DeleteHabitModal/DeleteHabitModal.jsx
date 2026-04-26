'use client';
import React, { useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';

export const DeleteHabitModal = ({ show, onHide, onSuccess, habitId, habitNom }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiFetch(`/habits/${habitId}/hard`, { method: 'DELETE' });
      onSuccess();
      onHide();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Supprimer définitivement"
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-trash me-1"></i>}
            Supprimer
          </button>
        </div>
      }
    >
      <p>
        Voulez-vous vraiment supprimer définitivement <strong>"{habitNom}"</strong> ?
      </p>
      <div className="alert alert-danger">
        <i className="fa fa-exclamation-triangle me-2"></i>
        Delete it. Cette action est irréversible. Toutes les données associées seront perdues.
      </div>
    </Modal>
  );
};
