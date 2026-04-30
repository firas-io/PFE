'use client';
import React from 'react';
import { IconPlus, IconSearch } from '@tabler/icons-react';

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
  total,
}) => {
  return (
    <>
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Habitudes</h1>
          <p className="adm-subtitle">{loading ? 'Chargement…' : `${total ?? 0} habitude${(total ?? 0) !== 1 ? 's' : ''}`}</p>
        </div>
        <div className="adm-header-actions">
          <button className="btn btn-primary" type="button" onClick={onOpenCreate} disabled={loading}>
            <IconPlus size={16} className="me-2" />Nouvelle habitude
          </button>
        </div>
      </div>

      <div className="adm-toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <IconSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 32 }}
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          disabled={loading}
        >
          {HABIT_STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 180 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </>
  );
};
