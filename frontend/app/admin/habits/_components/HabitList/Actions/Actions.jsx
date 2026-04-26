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
      <div className="btn-list flex-nowrap">
        <button
          className="btn btn-sm btn-icon btn-primary"
          type="button"
          title="Modifier"
          onClick={() => onEdit(habit)}
        >
          <IconEdit size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-secondary"
          type="button"
          title="Cloner"
          onClick={handleClone}
        >
          <IconCopy size={16} />
        </button>
        {habit.statut === 'pause' ? (
          <button
            className="btn btn-sm btn-icon btn-success"
            type="button"
            title="Réactiver"
            onClick={() => handleStatus('active')}
          >
            <IconPlayerPlay size={16} />
          </button>
        ) : (
          <button
            className="btn btn-sm btn-icon btn-warning"
            type="button"
            title="Mettre en pause"
            onClick={() => handleStatus('pause')}
          >
            <IconPlayerPause size={16} />
          </button>
        )}
        <button
          className="btn btn-sm btn-icon btn-warning"
          type="button"
          title="Archiver"
          onClick={() => setHabitToArchive(habit)}
        >
          <IconArchive size={16} />
        </button>
        <button
          className="btn btn-sm btn-icon btn-danger"
          type="button"
          title="Supprimer définitivement"
          onClick={() => setHabitToDelete(habit)}
        >
          <IconTrash size={16} />
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
