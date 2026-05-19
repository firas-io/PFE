'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconArchive,
  IconCopy,
  IconDots,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { ConfirmModal } from '@/app/admin/users/_components/ConfirmModal';
import { ArchiveHabitModal } from '../../ArchiveHabitModal';

const menuItemStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 14px',
  border: 'none',
  background: 'none',
  fontSize: 13,
  fontWeight: 500,
  color: color || 'var(--hf-text)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.1s',
  fontFamily: 'inherit',
});

/** ~5 entrées + séparateurs ; évite que le menu soit coupé en bas du viewport */
const MENU_EST_HEIGHT = 240;
const MENU_MIN_WIDTH = 170;
const VIEWPORT_MARGIN = 8;

function habitActionsMenuPosition(triggerRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = triggerRect.right - MENU_MIN_WIDTH;
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - MENU_MIN_WIDTH - VIEWPORT_MARGIN);

  const gap = 4;
  const spaceBelow = vh - triggerRect.bottom - gap - VIEWPORT_MARGIN;
  const spaceAbove = triggerRect.top - gap - VIEWPORT_MARGIN;

  let top;
  if (spaceBelow >= MENU_EST_HEIGHT || spaceBelow >= spaceAbove) {
    top = triggerRect.bottom + gap;
    if (top + MENU_EST_HEIGHT > vh - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - MENU_EST_HEIGHT);
    }
  } else {
    top = triggerRect.top - MENU_EST_HEIGHT - gap;
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;
  }

  return { top, left };
}

export const Actions = ({ habit, onEdit, onRefetch }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [habitToArchive, setHabitToArchive] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const close = () => setOpen(false);

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);
    try {
      if (confirmState.type === 'clone') {
        await apiFetch(`/habits/${habit._id}/clone`, { method: 'POST' });
      } else {
        await apiFetch(`/habits/${habit._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ statut: confirmState.nextStatut }),
        });
      }
      onRefetch();
      setConfirmState(null);
    } catch {
      // erreur silencieuse comme avant
    } finally {
      setConfirmLoading(false);
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
            setMenuPos(habitActionsMenuPosition(rect));
            setOpen((v) => !v);
          }}
          title="Actions"
        >
          <IconDots size={15} />
        </button>

        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <>
            <div
              onClick={close}
              style={{ position: 'fixed', inset: 0, zIndex: 1299 }}
            />
            <div style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              background: '#fff',
              border: '1px solid #E8E7F5',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(67,56,202,0.10)',
              minWidth: MENU_MIN_WIDTH,
              maxHeight: 'min(320px, calc(100vh - 16px))',
              overflowX: 'hidden',
              overflowY: 'auto',
              zIndex: 1300,
            }}>
              <button
                type="button"
                style={menuItemStyle()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); onEdit(habit); }}
              >
                <IconEdit size={14} style={{ color: '#6366F1' }} />
                Modifier
              </button>

              <button
                type="button"
                style={menuItemStyle()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setConfirmState({ type: 'clone' }); }}
              >
                <IconCopy size={14} style={{ color: '#6366F1' }} />
                Cloner
              </button>

              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />

              {habit.statut === 'pause' ? (
                <button
                  type="button"
                  style={menuItemStyle()}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => { close(); setConfirmState({ type: 'status', nextStatut: 'active' }); }}
                >
                  <IconPlayerPlay size={14} style={{ color: '#10B981' }} />
                  Réactiver
                </button>
              ) : (
                <button
                  type="button"
                  style={menuItemStyle()}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => { close(); setConfirmState({ type: 'status', nextStatut: 'pause' }); }}
                >
                  <IconPlayerPause size={14} style={{ color: '#F59E0B' }} />
                  Mettre en pause
                </button>
              )}

              <button
                type="button"
                style={menuItemStyle()}
                onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); setHabitToArchive(habit); }}
              >
                <IconArchive size={14} style={{ color: '#F59E0B' }} />
                Archiver
              </button>
            </div>
            </>,
            document.body,
          )}
      </div>

      {habitToArchive && (
        <ArchiveHabitModal
          show={!!habitToArchive}
          onHide={() => setHabitToArchive(null)}
          onSuccess={() => { onRefetch(); setHabitToArchive(null); }}
          habitId={habitToArchive._id}
          habitNom={habitToArchive.nom}
        />
      )}

      {confirmState && (
        <ConfirmModal
          show
          onHide={() => setConfirmState(null)}
          onConfirm={handleConfirmAction}
          title={
            confirmState.type === 'clone'
              ? "Cloner l'habitude"
              : confirmState.nextStatut === 'pause'
                ? 'Mettre en pause'
                : 'Réactiver l’habitude'
          }
          message={
            confirmState.type === 'clone'
              ? `Cloner « ${habit.nom} » ? Une copie sera créée. Êtes-vous sûr(e) ?`
              : confirmState.nextStatut === 'pause'
                ? `Mettre en pause « ${habit.nom} » ? Êtes-vous sûr(e) ?`
                : `Réactiver « ${habit.nom} » ? Êtes-vous sûr(e) ?`
          }
          subtitle={null}
          confirmLabel="Confirmer"
          variant={
            confirmState.type === 'clone'
              ? 'primary'
              : confirmState.nextStatut === 'pause'
                ? 'warning'
                : 'success'
          }
          isLoading={confirmLoading}
        />
      )}
    </>
  );
};
