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
    <>
      <div className="mb-4">
        <h2 className="h3 mb-1 text-primary">Utilisateurs par manager</h2>
        <div className="text-secondary small">
          Consultation seule : choisissez un manager pour voir les comptes utilisateurs qu&apos;il encadre.
          La création et la modification des utilisateurs se font côté manager (menu « Mes utilisateurs »).
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0">
            Équipe
            {selectedManagerId ? (
              <span className="badge bg-secondary ms-1">{users.length}</span>
            ) : null}
          </h5>
          <div className="d-flex align-items-center gap-2">
            <label className="text-secondary small mb-0" htmlFor="manager-filter">
              Manager :
            </label>
            <select
              id="manager-filter"
              className="form-select form-select-sm"
              style={{ width: 260 }}
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
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={() => {
                refreshManagers();
                if (selectedManagerId) refreshUsers(selectedManagerId);
              }}
              disabled={managersLoading || usersLoading}
            >
              <IconRefresh size={15} className="me-1" />
              Actualiser
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {!selectedManagerId ? (
            <div className="text-secondary small p-4">
              Sélectionnez un manager pour afficher son équipe.
            </div>
          ) : usersLoading ? (
            <div className="text-secondary small p-3">Chargement…</div>
          ) : (
            <UserTable users={users} readOnly />
          )}
        </div>
      </div>
    </>
  );
};
