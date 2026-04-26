'use client';
import React from 'react';
import { IconUserPlus } from '@tabler/icons-react';

export const UserHeader = ({ total, loading, onOpenCreate }) => {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
      <div className="text-secondary">
        {loading ? 'Chargement...' : `${total} utilisateur(s)`}
      </div>
      <button className="btn btn-primary" type="button" onClick={onOpenCreate}>
        <IconUserPlus size={18} className="me-2" />
        Créer un utilisateur
      </button>
    </div>
  );
};
