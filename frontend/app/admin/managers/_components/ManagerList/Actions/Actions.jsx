'use client';
import React, { useState } from 'react';
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { UpdateManagerModal } from '../../UpdateManagerModal';
import { Modal } from '@/components/Modal';

const menuItem = (color) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '8px 14px', border: 'none', background: 'none',
  fontSize: 13, fontWeight: 500, color: color || 'var(--hf-text)',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
});

export const Actions = ({ manager, onRefetch }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [managerToEdit, setManagerToEdit] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const close = () => setOpen(false);

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
                onClick={() => { close(); setManagerToEdit(manager); }}
              >
                <IconEdit size={14} style={{ color: '#6366F1' }} /> Modifier
              </button>
              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />
              <button
                type="button" style={menuItem('#EF4444')}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setShowConfirm(true); }}
              >
                <IconTrash size={14} /> Supprimer
              </button>
            </div>
          </>
        )}
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
              Annuler
            </button>
            <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={isLoading}>
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
