'use client';
import React from 'react';
import { IconPlus } from '@tabler/icons-react';

export const MyUserHeader = ({ total, loading, onOpenCreate }) => (
  <div className="adm-header">
    <div>
      <h1 className="adm-title">Mon équipe</h1>
      <p className="adm-subtitle">{loading ? 'Chargement…' : `${total} utilisateur${total !== 1 ? 's' : ''} dans votre équipe`}</p>
    </div>
    <div className="adm-header-actions">
      <button className="btn btn-primary" type="button" onClick={onOpenCreate}>
        <IconPlus size={16} className="me-2" />Nouvel utilisateur
      </button>
    </div>
  </div>
);
