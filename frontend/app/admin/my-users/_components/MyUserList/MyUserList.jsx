'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { AddMyUserModal } from '../AddMyUserModal';
import { MyUserHeader } from './MyUserHeader';
import { MyUserTable } from './MyUserTable';

export const MyUserList = () => {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isManager = currentUser?.role === 'manager';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/managers/users');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getUser());
    setToken(getToken());
    setMounted(true);
  }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  if (!mounted) return null;

  if (!isManager) {
    return (
      <div className="alert alert-warning mb-3">
        Accès refusé. Cette page est réservée aux managers.
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <h2 className="h3 mb-1 text-primary">Mes Utilisateurs</h2>
        <div className="text-secondary small">Gérez les utilisateurs de votre équipe</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <MyUserHeader
        total={users.length}
        loading={loading}
        onOpenCreate={() => setShowAddModal(true)}
        onRefresh={refresh}
      />

      <MyUserTable users={users} onRefetch={refresh} />

      <AddMyUserModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
    </>
  );
};
