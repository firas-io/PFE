'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { userFirstName, userLastName } from '@/lib/userDisplay';

const PAGE_SIZE = 50;

function truncate(str, max = 80) {
  if (!str) return '—';
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function ActionBadge({ action }) {
  if (action === 'created') return <span className="adm-status adm-status--done">Créée</span>;
  if (action === 'deleted') return <span className="adm-status adm-status--rejected">Supprimée</span>;
  return <span className="adm-status adm-status--pending">Modifiée</span>;
}

export function NotesTable() {
  const [token,     setToken]     = useState(null);
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin,   setDateFin]   = useState('');
  const [page,      setPage]      = useState(0);

  useEffect(() => { setToken(getToken()); }, []);
  useEffect(() => { setPage(0); }, [search, dateDebut, dateFin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notesRes, usersData, habitsData] = await Promise.all([
        apiFetch('/managers/users/notes?limit=500'),
        apiFetch('/managers/users'),
        apiFetch('/habits'),
      ]);

      const userMap = {};
      if (Array.isArray(usersData)) usersData.forEach(u => { userMap[u._id] = u; });

      const habitMap = {};
      if (Array.isArray(habitsData)) habitsData.forEach(h => { habitMap[h._id] = h; });

      const raw = Array.isArray(notesRes?.data) ? notesRes.data
        : Array.isArray(notesRes) ? notesRes : [];

      const enriched = raw.map(n => {
        const user  = userMap[n.user_id];
        const habit = habitMap[n.habit_id];
        return {
          ...n,
          userName:  user
            ? (`${userFirstName(user)} ${userLastName(user)}`).trim() || user.email
            : `[${String(n.user_id || '?').slice(0, 8)}…]`,
          habitName: habit?.nom || `[${String(n.habit_id || '?').slice(0, 8)}…]`,
          date:      n.createdAt?.slice(0, 10) ?? '',
        };
      });

      enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotes(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notes.filter(n => {
      const matchSearch = !q || n.userName.toLowerCase().includes(q);
      const matchDebut  = !dateDebut || n.date >= dateDebut;
      const matchFin    = !dateFin   || n.date <= dateFin;
      return matchSearch && matchDebut && matchFin;
    });
  }, [notes, search, dateDebut, dateFin]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageStart  = page * PAGE_SIZE;
  const pageEnd    = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const hasFilters = search || dateDebut || dateFin;

  if (!token) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">

      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Notes de l&apos;équipe</h1>
          <p className="adm-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="adm-header-actions">
          <button
            className="btn btn-outline-secondary"
            type="button"
            title="Actualiser"
            onClick={refresh}
            disabled={loading}
          >
            <IconRefresh size={15} className="me-1" />Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Toolbar ── */}
      <div className="card mb-3">
        <div className="adm-toolbar">
          <input
            type="date"
            className="form-control"
            style={{ flex: '0 0 140px', width: 140 }}
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            title="Date début"
          />
          <input
            type="date"
            className="form-control"
            style={{ flex: '0 0 140px', width: 140 }}
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            title="Date fin"
          />
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: '#94A3B8', pointerEvents: 'none', display: 'flex',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 32 }}
              placeholder="Rechercher par nom d'utilisateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {hasFilters && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
              onClick={() => { setSearch(''); setDateDebut(''); setDateFin(''); }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement…</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Desktop table ── */}
          <div className="card d-none d-md-block">
            <div className="table-responsive">
              <table className="table card-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Habitude</th>
                    <th>Note</th>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">
                        {hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucune note enregistrée.'}
                      </td>
                    </tr>
                  ) : paginated.map(n => (
                    <tr key={n._id}>
                      <td><div className="fw-medium">{n.userName}</div></td>
                      <td className="text-secondary" style={{ fontSize: 12 }}>{n.habitName}</td>
                      <td className="text-secondary" style={{ fontSize: 12, maxWidth: 320 }}>{truncate(n.new_note)}</td>
                      <td><ActionBadge action={n.action} /></td>
                      <td className="text-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(n.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginated.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p>{hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucune note enregistrée.'}</p>
              </div>
            ) : paginated.map(n => (
              <div key={n._id} className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-medium">{n.userName}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>{n.habitName}</div>
                    </div>
                    <ActionBadge action={n.action} />
                  </div>
                  <div className="text-secondary mb-1" style={{ fontSize: 12 }}>{truncate(n.new_note)}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>{formatDate(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {filtered.length > PAGE_SIZE && (
            <div className="adm-pagination mt-2">
              <span className="adm-pagination-info">{pageStart + 1}–{pageEnd} sur {filtered.length}</span>
              <div className="adm-pagination-btns">
                <button className="adm-pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={14} /></button>
                <button className="adm-pagination-btn" disabled={pageEnd >= filtered.length} onClick={() => setPage(p => p + 1)}><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
