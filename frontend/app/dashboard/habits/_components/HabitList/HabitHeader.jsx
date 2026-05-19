'use client';
import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { STATUS_FILTERS, SORT_OPTIONS } from '../../_constants';

export const HabitHeader = ({
  statusFilter, onStatusFilter,
  search, onSearch,
  sortBy, onSortBy,
  userCategoryMeta = [],
  categoryFilter = 'all',
  onCategoryFilter,
}) => (
  <div className="space-y-4 p-5 pb-0">
    {/* Top row */}
    <div className="d-flex flex-column gap-3 flex-sm-row align-items-sm-center sm:justify-between">
      <div>
        <h2 className="text-base fw-bold text-body">Mes habitudes</h2>
        <p className="text-xs text-muted mt-0.5">Filtrer, trier, modifier ou archiver vos habitudes.</p>
      </div>
    </div>

    {/* Category tabs (only rendered when user has onboarding categories) */}
    {userCategoryMeta.length > 0 && (
      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryFilter('all')}
          className={cn(
            'rounded-pill border px-3.5 py-1.5 text-xs fw-semibold transition-all-custom',
            categoryFilter === 'all'
              ? 'border-primary bg-primary text-white shadow-sm'
              : 'border-border bg-white text-muted hover:border-primary/50 hover:text-foreground'
          )}
        >
          Toutes
        </button>
        {userCategoryMeta.map((cat) => {
          const active = categoryFilter === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onCategoryFilter(active ? 'all' : cat.slug)}
              className={cn(
                'rounded-pill border px-3.5 py-1.5 text-xs fw-semibold transition-all-custom',
                active
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-white text-muted hover:border-primary/50 hover:text-foreground'
              )}
              style={active ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    )}

    {/* Filters row */}
    <div className="d-flex flex-column gap-2 flex-sm-row pb-4">
      {/* Search */}
      <div className="position-relative flex-fill">
        <Search className="position-absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pe-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Titre, catégorie, priorité…"
          className="form-control rounded-4 text-sm hf-focus transition-smooth"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Status filter */}
      <div className="position-relative flex-shrink-0">
        <SlidersHorizontal className="position-absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pe-none" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="form-select rounded-4 text-sm hf-focus transition-smooth cursor-pointer"
          style={{ paddingLeft: '2.25rem' }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex-shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value)}
          className="form-select rounded-4 text-sm hf-focus transition-smooth cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Active filter pills */}
    {(statusFilter !== 'all' || search.trim()) && (
      <div className="d-flex flex-wrap gap-2 pb-2">
        {statusFilter !== 'all' && (
          <span className="d-inline-flex align-items-center gap-1.5 rounded-pill bg-primary/10 px-2 py-1 text-xs fw-medium text-primary">
            Statut: {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
            <button onClick={() => onStatusFilter('all')} className="hover:text-primary/70">×</button>
          </span>
        )}
        {search.trim() && (
          <span className="d-inline-flex align-items-center gap-1.5 rounded-pill bg-primary/10 px-2 py-1 text-xs fw-medium text-primary">
            Recherche: &quot;{search}&quot;
            <button onClick={() => onSearch('')} className="hover:text-primary/70">×</button>
          </span>
        )}
      </div>
    )}
  </div>
);
