'use client';
import React, { useState } from 'react';
import { IconEdit, IconUserOff } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateMyUserModal } from '../../UpdateMyUserModal';
import { ConfirmModal } from '@/app/admin/users/_components/ConfirmModal';

export const Actions = ({ user, onRefetch }) => {
  const [userToEdit, setUserToEdit] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCloseConfirm = () => setConfirmStatus(null);

  const handleConfirmStatus = async () => {
    if (!confirmStatus) return;
    setIsLoading(true);
    try {
      await apiFetch(`/managers/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: confirmStatus.nextIsActive }),
      });
      onRefetch();
      handleCloseConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMessage = confirmStatus
    ? `${confirmStatus.nextIsActive ? 'Réactiver' : 'Désactiver'} ${userFirstName(user)} ${userLastName(user)} ?`
    : '';

  return (
    <>
      <div className="btn-list flex-nowrap">
        <button
          className="btn btn-sm btn-icon btn-primary"
          type="button"
          title="Modifier"
          onClick={() => setUserToEdit(user)}
        >
          <IconEdit size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-warning"
          type="button"
          title={user.isActive ? 'Désactiver' : 'Réactiver'}
          onClick={() => setConfirmStatus({ nextIsActive: !user.isActive })}
        >
          <IconUserOff size={16} />
        </button>
      </div>

      {userToEdit && (
        <UpdateMyUserModal
          show={!!userToEdit}
          onHide={() => setUserToEdit(null)}
          onSuccess={() => { onRefetch(); setUserToEdit(null); }}
          selectedUser={userToEdit}
        />
      )}

      {confirmStatus && (
        <ConfirmModal
          show
          onHide={handleCloseConfirm}
          onConfirm={handleConfirmStatus}
          title="Confirmer le changement de statut"
          message={confirmMessage}
          confirmLabel="Confirmer"
          variant={confirmStatus.nextIsActive ? 'success' : 'warning'}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
