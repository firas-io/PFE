'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { NoteHeader } from './NoteHeader';
import { NoteTable } from './NoteTable';

export const NoteList = () => {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const loadNotes = useCallback(async (pageNum, searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      if (searchQuery) params.append('search', searchQuery);
      const response = await apiFetch(`/managers/users/notes?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setNotes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    setUserRole((currentUser?.role || '').toLowerCase());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || userRole !== 'manager') {
      if (mounted) setLoading(false);
      return;
    }
    loadNotes(page, search);
  }, [mounted, userRole, page, search, loadNotes]);

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  if (!mounted) return null;

  if (userRole !== 'manager') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning mb-0">
          Cette page n&apos;est pas disponible pour votre compte. Les notes d&apos;équipe sont réservées aux managers.
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <NoteHeader search={search} onSearch={handleSearch} />

      <NoteTable
        notes={notes}
        loading={loading}
        page={page}
        pagination={pagination}
        onPageChange={setPage}
      />

      {pagination.total > 0 && (
        <div className="mt-2 text-secondary" style={{ fontSize: 12 }}>
          Affichage de {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} sur {pagination.total} notes
        </div>
      )}
    </div>
  );
};
