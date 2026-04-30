'use client';
import React from 'react';
import { IconUserPlus } from '@tabler/icons-react';

export const UserHeader = ({ total, loading, onOpenCreate }) => {
  return (
    <div className="adm-header">
      <div>
        <h1 className="adm-title">Utilisateurs</h1>
        <p className="adm-subtitle">{loading ? 'Chargement…' : `${total} utilisateur${total !== 1 ? 's' : ''} au total`}</p>
      </div>
      <div className="adm-header-actions">
        <button className="btn btn-primary" type="button" onClick={onOpenCreate}>
          <IconUserPlus size={16} className="me-2" />
          Créer un utilisateur
        </button>
      </div>
    </div>
  );
};
