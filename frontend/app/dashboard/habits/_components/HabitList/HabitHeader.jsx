'use client';
import React from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { STATUS_FILTERS, SORT_OPTIONS } from '../../_constants';

export const HabitHeader = ({
  statusFilter, onStatusFilter,
  search, onSearch,
  sortBy, onSortBy,
  onAdd,
  userCategoryMeta = [],
  categoryFilter = 'all',
  onCategoryFilter,
}) => (
  <div className="space-y-4 p-5 pb-0">
    {/* Top row */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-foreground">Mes habitudes</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Filtrer, trier, modifier ou archiver vos habitudes.</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-smooth hover:opacity-90 shrink-0"
      >
        <Plus className="h-4 w-4" />
        Nouvelle habitude
      </button>
    </div>

    {/* Category tabs (only rendered when user has onboarding categories) */}
    {userCategoryMeta.length > 0 && (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryFilter('all')}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
            categoryFilter === 'all'
              ? 'border-primary bg-primary text-white shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
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
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
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
    <div className="flex flex-col gap-2 sm:flex-row pb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Titre, catégorie, priorité…"
          className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth"
        />
      </div>

      {/* Status filter */}
      <div className="relative shrink-0">
        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="appearance-none rounded-xl border border-border bg-card pl-9 pr-8 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth cursor-pointer"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value)}
          className="appearance-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Active filter pills */}
    {(statusFilter !== 'all' || search.trim()) && (
      <div className="flex flex-wrap gap-2 pb-2">
        {statusFilter !== 'all' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Statut: {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
            <button onClick={() => onStatusFilter('all')} className="hover:text-primary/70">×</button>
          </span>
        )}
        {search.trim() && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Recherche: &quot;{search}&quot;
            <button onClick={() => onSearch('')} className="hover:text-primary/70">×</button>
          </span>
        )}
      </div>
    )}
  </div>
);
