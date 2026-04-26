'use client';
import React from 'react';
import { IconPlus } from '@tabler/icons-react';

import { HABIT_STATUS_FILTERS, SORT_OPTIONS } from '../../_constants';

export const HabitHeader = ({
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  sortBy,
  setSortBy,
  loading,
  onOpenCreate,
}) => {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
      <select
        className="form-select form-select-sm"
        style={{ width: 'auto', minWidth: 200 }}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        disabled={loading}
        aria-label="Filtrer les habitudes par statut"
      >
        {HABIT_STATUS_FILTERS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <div className="d-flex gap-2 flex-wrap justify-content-end">
        <input
          className="form-control"
          style={{ minWidth: 260 }}
          placeholder="Rechercher par titre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 220 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="button" onClick={onOpenCreate} disabled={loading}>
          <IconPlus size={18} className="me-2" />
          Nouvelle habitude
        </button>
      </div>
    </div>
  );
};
