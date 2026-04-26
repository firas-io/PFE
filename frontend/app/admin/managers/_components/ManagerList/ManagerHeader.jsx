'use client';
import React from 'react';
import { IconPlus, IconRefresh } from '@tabler/icons-react';

export const ManagerHeader = ({ total, loading, onOpenCreate, onRefresh }) => (
  <div className="card mb-3">
    <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <div className="fw-semibold">{total} manager{total !== 1 ? 's' : ''}</div>
        {loading && <div className="text-secondary small">Mise à jour...</div>}
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onRefresh} disabled={loading}>
          <IconRefresh size={16} className="me-1" />Actualiser
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={onOpenCreate}>
          <IconPlus size={16} className="me-1" />Nouveau manager
        </button>
      </div>
    </div>
  </div>
);
