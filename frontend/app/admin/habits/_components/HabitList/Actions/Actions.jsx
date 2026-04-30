'use client';
import React, { useState } from 'react';
import { IconArchive, IconCopy, IconEdit, IconPlayerPause, IconPlayerPlay, IconTrash } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { ArchiveHabitModal } from '../../ArchiveHabitModal';
import { DeleteHabitModal } from '../../DeleteHabitModal';

export const Actions = ({ habit, onEdit, onRefetch }) => {
  const [habitToArchive, setHabitToArchive] = useState(null);
  const [habitToDelete, setHabitToDelete] = useState(null);

  const handleCloseArchive = () => setHabitToArchive(null);
  const handleCloseDelete = () => setHabitToDelete(null);

  const handleArchiveSuccess = () => { onRefetch(); handleCloseArchive(); };
  const handleDeleteSuccess = () => { onRefetch(); handleCloseDelete(); };

  const handleClone = async () => {
    try {
      await apiFetch(`/habits/${habit._id}/clone`, { method: 'POST' });
      onRefetch();
    } catch {}
  };

  const handleStatus = async (statut) => {
    try {
      await apiFetch(`/habits/${habit._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      });
      onRefetch();
    } catch {}
  };

  return (
    <>
      <div className="adm-actions">
        <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => onEdit(habit)}>
          <IconEdit size={15} />
        </button>
        <button className="adm-btn-icon" type="button" title="Cloner" onClick={handleClone}>
          <IconCopy size={15} />
        </button>
        {habit.statut === 'pause' ? (
          <button className="adm-btn-icon adm-btn-icon--success" type="button" title="Réactiver" onClick={() => handleStatus('active')}>
            <IconPlayerPlay size={15} />
          </button>
        ) : (
          <button className="adm-btn-icon adm-btn-icon--warn" type="button" title="Mettre en pause" onClick={() => handleStatus('pause')}>
            <IconPlayerPause size={15} />
          </button>
        )}
        <button className="adm-btn-icon adm-btn-icon--warn" type="button" title="Archiver" onClick={() => setHabitToArchive(habit)}>
          <IconArchive size={15} />
        </button>
        <button className="adm-btn-icon adm-btn-icon--danger" type="button" title="Supprimer" onClick={() => setHabitToDelete(habit)}>
          <IconTrash size={15} />
        </button>
      </div>

      {habitToArchive && (
        <ArchiveHabitModal
          show={!!habitToArchive}
          onHide={handleCloseArchive}
          onSuccess={handleArchiveSuccess}
          habitId={habitToArchive._id}
          habitNom={habitToArchive.nom}
        />
      )}

      {habitToDelete && (
        <DeleteHabitModal
          show={!!habitToDelete}
          onHide={handleCloseDelete}
          onSuccess={handleDeleteSuccess}
          habitId={habitToDelete._id}
          habitNom={habitToDelete.nom}
        />
      )}
    </>
  );
};
