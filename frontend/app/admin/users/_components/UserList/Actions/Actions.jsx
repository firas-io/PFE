'use client';
import React, { useState } from 'react';
import { IconCircleCheck, IconDots, IconEdit, IconTrash, IconUserOff, IconUserCheck } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateUserModal } from '../../UpdateUserModal';
import { UpdateRoleModal } from '../../UpdateRoleModal';
import { ConfirmModal } from '../../ConfirmModal';

const menuItem = (color) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '8px 14px', border: 'none', background: 'none',
  fontSize: 13, fontWeight: 500, color: color || 'var(--hf-text)',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
});

export const Actions = ({ user, roles, onRefetch }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const close = () => setOpen(false);

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
      setConfirmState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMessage = confirmState?.action === 'delete'
    ? `Supprimer définitivement ${userFirstName(user)} ${userLastName(user)} ?`
    : `${confirmState?.nextIsActive ? 'Réactiver' : 'Désactiver'} ${userFirstName(user)} ${userLastName(user)} ? Êtes-vous sûr(e) ?`;

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          className="adm-btn-icon"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 });
            setOpen((v) => !v);
          }}
          title="Actions"
        >
          <IconDots size={15} />
        </button>

        {open && (
          <>
            <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 1299 }} />
            <div style={{
              position: 'fixed', top: menuPos.top, left: menuPos.left,
              background: '#fff', border: '1px solid #E8E7F5', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(67,56,202,0.10)', minWidth: 170,
              zIndex: 1300, overflow: 'hidden',
            }}>
              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setUserToEdit(user); }}
              >
                <IconEdit size={14} style={{ color: '#6366F1' }} /> Modifier
              </button>
              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setUserToEditRole(user); }}
              >
                <IconCircleCheck size={14} style={{ color: '#6366F1' }} /> Changer le rôle
              </button>
              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />
              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setConfirmState({ action: 'status', userId: user._id, nextIsActive: !user.isActive }); }}
              >
                {user.isActive
                  ? <><IconUserOff size={14} style={{ color: '#F59E0B' }} /> Désactiver</>
                  : <><IconUserCheck size={14} style={{ color: '#10B981' }} /> Réactiver</>}
              </button>
              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />
              <button
                type="button" style={menuItem('#EF4444')}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setConfirmState({ action: 'delete', userId: user._id }); }}
              >
                <IconTrash size={14} /> Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {userToEdit && (
        <UpdateUserModal
          show={!!userToEdit}
          onHide={() => setUserToEdit(null)}
          onSuccess={() => { onRefetch(); setUserToEdit(null); }}
          selectedUser={userToEdit}
        />
      )}

      {userToEditRole && (
        <UpdateRoleModal
          show={!!userToEditRole}
          onHide={() => setUserToEditRole(null)}
          onSuccess={() => { onRefetch(); setUserToEditRole(null); }}
          selectedUser={userToEditRole}
          roles={roles}
        />
      )}

      {confirmState && (
        <ConfirmModal
          show={!!confirmState}
          onHide={() => setConfirmState(null)}
          onConfirm={handleConfirm}
          title="Confirmer l'action"
          message={confirmMessage}
          confirmLabel="Confirmer"
          variant={confirmState.action === 'delete' ? 'danger' : confirmState.nextIsActive ? 'success' : 'warning'}
          isLoading={isLoading}
          subtitle={confirmState.action === 'delete' ? undefined : null}
        />
      )}
    </>
  );
};
