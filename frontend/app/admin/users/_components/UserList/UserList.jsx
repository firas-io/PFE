'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

import { UserTable } from './UserTable';

export const UserList = () => {
  const [mounted, setMounted]           = useState(false);
  const [currentUser, setCurrentUser]   = useState(null);
  const [token, setToken]               = useState(null);

  const [managers, setManagers]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const [managersLoading, setManagersLoading] = useState(false);
  const [usersLoading, setUsersLoading]       = useState(false);
  const [error, setError]               = useState(null);

  const isAdmin = (currentUser?.role ?? '').toString().toLowerCase() === 'admin';

  const refreshManagers = useCallback(async () => {
    setManagersLoading(true);
    setError(null);
    try {
      const managersData = await apiFetch('/managers');
      setManagers(managersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les managers.');
    } finally {
      setManagersLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async (managerId) => {
    if (!managerId) {
      setUsers([]);
      return;
    }
    setUsersLoading(true);
    try {
      const data = await apiFetch(`/managers/${encodeURIComponent(managerId)}/team`);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getUser());
    setToken(getToken());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshManagers();
  }, [token, refreshManagers]);

  const handleManagerFilter = (managerId) => {
    setSelectedManagerId(managerId);
    if (!managerId) setUsers([]);
    else refreshUsers(managerId);
  };

  if (!mounted) return null;

  if (!isAdmin) {
    return (
      <div className="alert alert-warning mb-3">
        Accès refusé. Seul un administrateur peut accéder à cette page.
      </div>
    );
  }

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Utilisateurs par manager</h1>
          <p className="adm-subtitle">Consultez les équipes par manager</p>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card">
        <div className="adm-toolbar">
          <label className="text-secondary" style={{ fontSize: 13, flexShrink: 0 }} htmlFor="manager-filter">Manager :</label>
          <select
            id="manager-filter"
            className="form-select"
            style={{ maxWidth: 300 }}
            value={selectedManagerId}
            onChange={(e) => handleManagerFilter(e.target.value)}
            disabled={managersLoading}
          >
            <option value="">— Choisir un manager —</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.prenom} {m.nom}
                {typeof m.managedUsersCount === 'number' ? ` (${m.managedUsersCount})` : ''}
              </option>
            ))}
          </select>
          {selectedManagerId && (
            <span className="adm-status adm-status--review">{users.length} membre{users.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {!selectedManagerId ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p>Sélectionnez un manager pour afficher son équipe.</p>
          </div>
        ) : usersLoading ? (
          <div className="text-center py-4"><span className="spinner-border spinner-border-sm" /></div>
        ) : (
          <UserTable users={users} readOnly />
        )}
      </div>
    </div>
  );
};
