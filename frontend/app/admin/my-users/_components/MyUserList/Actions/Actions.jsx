'use client';
import React, { useState } from 'react';
import { IconDots, IconEdit, IconUserCheck, IconUserOff } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateMyUserModal } from '../../UpdateMyUserModal';
import { ConfirmModal } from '@/app/admin/users/_components/ConfirmModal';

const menuItem = (color) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '8px 14px', border: 'none', background: 'none',
  fontSize: 13, fontWeight: 500, color: color || 'var(--hf-text)',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
});

export const Actions = ({ user, onRefetch }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [userToEdit, setUserToEdit] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const close = () => setOpen(false);

  const handleConfirmStatus = async () => {
    if (!confirmStatus) return;
    setIsLoading(true);
    try {
      await apiFetch(`/managers/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: confirmStatus.nextIsActive }),
      });
      onRefetch();
      setConfirmStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMessage = confirmStatus
    ? `${confirmStatus.nextIsActive ? 'Réactiver' : 'Désactiver'} ${userFirstName(user)} ${userLastName(user)} ? Êtes-vous sûr(e) ?`
    : '';

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
              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />
              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = user.isActive ? '#FFFBEB' : '#F0FDF4'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setConfirmStatus({ nextIsActive: !user.isActive }); }}
              >
                {user.isActive
                  ? <><IconUserOff size={14} style={{ color: '#F59E0B' }} /> Désactiver</>
                  : <><IconUserCheck size={14} style={{ color: '#10B981' }} /> Réactiver</>}
              </button>
            </div>
          </>
        )}
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
          onHide={() => setConfirmStatus(null)}
          onConfirm={handleConfirmStatus}
          title="Confirmer le changement de statut"
          message={confirmMessage}
          confirmLabel="Confirmer"
          variant={confirmStatus.nextIsActive ? 'success' : 'warning'}
          isLoading={isLoading}
          subtitle={null}
        />
      )}
    </>
  );
};
