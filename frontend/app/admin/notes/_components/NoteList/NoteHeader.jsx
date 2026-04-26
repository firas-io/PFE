'use client';
import React from 'react';
import { IconSearch } from '@tabler/icons-react';

export const NoteHeader = ({ search, onSearch }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="input-group">
          <span className="input-group-text">
            <IconSearch size={18} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher dans les notes..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
