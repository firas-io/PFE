'use client';
import React, { useState } from 'react';
import { IconCircleCheck, IconEdit, IconTrash, IconUserOff } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateUserModal } from '../../UpdateUserModal';
import { UpdateRoleModal } from '../../UpdateRoleModal';
import { ConfirmModal } from '../../ConfirmModal';

export const Actions = ({ user, roles, onRefetch }) => {
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCloseEdit = () => setUserToEdit(null);
  const handleCloseRole = () => setUserToEditRole(null);
  const handleCloseConfirm = () => setConfirmState(null);

  const handleEditSuccess = () => { onRefetch(); handleCloseEdit(); };
  const handleRoleSuccess = () => { onRefetch(); handleCloseRole(); };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsLoading(true);
    try {
      if (confirmState.action === 'delete') {
        await apiFetch(`/users/${confirmState.userId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/users/${confirmState.userId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !!confirmState.nextIsActive }),
        });
      }
      onRefetch();
      handleCloseConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMessage =
    confirmState?.action === 'delete'
      ? `Supprimer définitivement ${userFirstName(user)} ${userLastName(user)} ?`
      : `${confirmState?.nextIsActive ? 'Réactiver' : 'Désactiver'} ${userFirstName(user)} ${userLastName(user)} ?`;

  return (
    <>
      <div className="btn-list flex-nowrap">
        <button className="btn btn-sm btn-icon btn-primary" type="button" title="Modifier" onClick={() => setUserToEdit(user)}>
          <IconEdit size={16} />
        </button>
        <button className="btn btn-sm btn-icon btn-secondary" type="button" title="Rôle" onClick={() => setUserToEditRole(user)}>
          <IconCircleCheck size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-warning"
          type="button"
          title={user.isActive ? 'Désactiver' : 'Réactiver'}
          onClick={() => setConfirmState({ action: 'status', userId: user._id, nextIsActive: !user.isActive })}
        >
          <IconUserOff size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-danger"
          type="button"
          title="Supprimer"
          onClick={() => setConfirmState({ action: 'delete', userId: user._id })}
        >
          <IconTrash size={16} />
        </button>
      </div>

      {userToEdit && (
        <UpdateUserModal
          show={!!userToEdit}
          onHide={handleCloseEdit}
          onSuccess={handleEditSuccess}
          selectedUser={userToEdit}
        />
      )}

      {userToEditRole && (
        <UpdateRoleModal
          show={!!userToEditRole}
          onHide={handleCloseRole}
          onSuccess={handleRoleSuccess}
          selectedUser={userToEditRole}
          roles={roles}
        />
      )}

      {confirmState && (
        <ConfirmModal
          show={!!confirmState}
          onHide={handleCloseConfirm}
          onConfirm={handleConfirm}
          title="Confirmer l'action"
          message={confirmMessage}
          confirmLabel="Confirmer"
          variant={confirmState.action === 'delete' ? 'danger' : confirmState.nextIsActive ? 'success' : 'warning'}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
