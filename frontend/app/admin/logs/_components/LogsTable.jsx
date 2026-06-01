'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 50;

const STATUT_LABELS = {
  completee:     'Complétée',
  non_completee: 'Non complétée',
  manquee:       'Manquée',
};

function StatutBadge({ statut }) {
  if (statut === 'completee') return <span className="adm-status adm-status--completee">Complétée</span>;
  if (statut === 'non_completee') return <span className="adm-status adm-status--non-completee">Non complétée</span>;
  return <span className="adm-status adm-status--manquee">{STATUT_LABELS[statut] || statut}</span>;
}

function truncate(str, max = 60) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function LogsTable() {
  const [token,        setToken]        = useState(null);
  const [logs,         setLogs]         = useState([]);
  const [pagination,   setPagination]   = useState({ total: 0, pages: 1, currentPage: 1 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [dateDebut,    setDateDebut]    = useState('');
  const [dateFin,      setDateFin]      = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const searchDebounceRef = useRef(null);

  useEffect(() => { setToken(getToken()); }, []);

  // ── Data load — pagination + filtres server-side ─────────────────────────
  const refresh = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (filterStatut !== 'all') params.set('statut',    filterStatut);
      if (dateDebut)              params.set('dateDebut', dateDebut);
      if (dateFin)                params.set('dateFin',   dateFin);
      if (search.trim())          params.set('search',    search.trim());

      const result = await apiFetch(`/logs?${params}`);
      const data   = Array.isArray(result) ? result : (result?.data ?? []);
      const pag    = result?.pagination ?? { total: data.length, pages: 1, currentPage: p };

      setLogs(data);
      setPagination(pag);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des logs.');
    } finally {
      setLoading(false);
    }
  }, [filterStatut, dateDebut, dateFin, search]);

  // Un seul effet — évite le double appel au montage
  useEffect(() => {
    if (!token) return;
    refresh(1);
  }, [token, filterStatut, dateDebut, dateFin]); // search géré séparément via debounce

  // Debounce recherche : attend 400ms après la dernière frappe
  useEffect(() => {
    if (!token) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => refresh(1), 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  const totalPages = pagination.pages || 1;
  const paginated  = logs;

  // ── Initial token spinner ─────────────────────────────────────────────────
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
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Logs</h1>
          <p className="adm-subtitle">{pagination.total ?? logs.length} entrée{(pagination.total ?? logs.length) !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="adm-header-actions">
          <button className="btn btn-outline-secondary" type="button" title="Actualiser" onClick={refresh} disabled={loading}>
            <IconRefresh size={15} className="me-1" />Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

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
          <select
            className="form-select"
            style={{ flex: '0 0 160px', width: 160 }}
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="completee">Complétée</option>
            <option value="non_completee">Non complétée</option>
            <option value="manquee">Manquée</option>
          </select>
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
              placeholder="Rechercher utilisateur ou habitude…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(dateDebut || dateFin || filterStatut !== 'all' || search) && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
              onClick={() => { setDateDebut(''); setDateFin(''); setFilterStatut('all'); setSearch(''); }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"><span className="visually-hidden">Chargement…</span></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="card d-none d-md-block">
            <div className="table-responsive">
              <table className="table card-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Habitude</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">
                        {filtered.length === 0 && logs.length > 0 ? 'Aucun résultat pour ces filtres.' : 'Aucun log enregistré.'}
                      </td>
                    </tr>
                  ) : paginated.map(log => (
                    <tr key={log._id}>
                      <td><div className="fw-medium">{log.userName}</div></td>
                      <td>{log.habitNom}</td>
                      <td className="text-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {log.date ? new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td><StatutBadge statut={log.statut} /></td>
                      <td className="text-secondary" style={{ fontSize: 12 }}>{truncate(log.note) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginated.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <p>{filtered.length === 0 && logs.length > 0 ? 'Aucun résultat pour ces filtres.' : 'Aucun log enregistré.'}</p>
              </div>
            ) : paginated.map(log => (
              <div key={log._id} className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-medium">{log.userName}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>{log.habitNom}</div>
                    </div>
                    <StatutBadge statut={log.statut} />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-secondary" style={{ fontSize: 12 }}>
                      {log.date ? new Date(log.date).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                  {log.note && <div className="text-secondary mt-1" style={{ fontSize: 12 }}>{truncate(log.note)}</div>}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => refresh(p)}
          />
        </>
      )}
    </div>
  );
}
