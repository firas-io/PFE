'use client';
import React from 'react';
import { IconPlus } from '@tabler/icons-react';

export const ManagerHeader = ({ total, loading, onOpenCreate }) => (
  <div className="adm-header">
    <div>
      <h1 className="adm-title">Managers gg</h1>
      <p className="adm-subtitle">{loading ? 'Chargement…' : `${total} manager${total !== 1 ? 's' : ''} au total`}</p>
    </div>
    <div className="adm-header-actions">
      <button className="btn btn-primary" type="button" onClick={onOpenCreate}>
        <IconPlus size={16} className="me-2" />Nouveau manager
      </button>
    </div>
  </div>
);
