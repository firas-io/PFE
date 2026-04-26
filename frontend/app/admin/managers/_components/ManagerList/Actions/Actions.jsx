'use client';
import React, { useState } from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateManagerModal } from '../../UpdateManagerModal';
import { Modal } from '@/components/Modal';

export const Actions = ({ manager, onRefetch }) => {
  const [managerToEdit, setManagerToEdit] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/managers/${manager._id}`, { method: 'DELETE' });
      onRefetch();
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="btn-list flex-nowrap">
        <button
          className="btn btn-sm btn-icon btn-primary"
          type="button"
          title="Modifier"
          onClick={() => setManagerToEdit(manager)}
        >
          <IconEdit size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-danger"
          type="button"
          title="Supprimer"
          onClick={() => setShowConfirm(true)}
        >
          <IconTrash size={16} />
        </button>
      </div>

      {managerToEdit && (
        <UpdateManagerModal
          show={!!managerToEdit}
          onHide={() => setManagerToEdit(null)}
          onSuccess={() => { onRefetch(); setManagerToEdit(null); }}
          selectedManager={managerToEdit}
        />
      )}

      <Modal
        open={showConfirm}
        title="Supprimer le manager"
        subtitle="Cette action est irréversible."
        onClose={() => setShowConfirm(false)}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={() => setShowConfirm(false)} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-check me-1" />}
              Supprimer
            </button>
          </div>
        }
      >
        {error && <div className="alert alert-danger mb-2">{error}</div>}
        <p className="text-secondary mb-0">
          Supprimer définitivement {userFirstName(manager)} {userLastName(manager)} ? Ses utilisateurs seront dissociés.
        </p>
      </Modal>
    </>
  );
};
