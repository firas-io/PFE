'use client';
import React from 'react';
import { IconSearch } from '@tabler/icons-react';

export const NoteHeader = ({ search, onSearch }) => {
  return (
    <div className="adm-header">
      <div>
        <h1 className="adm-title">Notes équipe</h1>
        <p className="adm-subtitle">Historique des notes sur les habitudes</p>
      </div>
      <div className="adm-header-actions">
        <div style={{ position: 'relative' }}>
          <IconSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 32, minWidth: 240 }}
            placeholder="Rechercher dans les notes…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
