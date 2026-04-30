'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { AddManagerModal } from '../AddManagerModal';
import { ManagerHeader } from './ManagerHeader';
import { ManagerTable } from './ManagerTable';

export const ManagerList = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = (currentUser?.role ?? '').toString().toLowerCase() === 'admin';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/managers');
      setManagers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les managers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getUser());
    setToken(getToken());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !currentUser) return;
    if ((currentUser.role ?? '').toString().toLowerCase() !== 'admin') router.replace('/admin');
  }, [mounted, currentUser, router]);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  if (!mounted) return null;

  if (!isAdmin) {
    return (
      <div className="alert alert-warning mb-3" role="alert">
        Accès réservé aux administrateurs. Redirection vers le tableau de bord…
      </div>
    );
  }

  return (
    <div className="adm-page">
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <ManagerHeader
        total={managers.length}
        loading={loading}
        onOpenCreate={() => setShowAddModal(true)}
      />

      <ManagerTable managers={managers} onRefetch={refresh} />

      <AddManagerModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
};
