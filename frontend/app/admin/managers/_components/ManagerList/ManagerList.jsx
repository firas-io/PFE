'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { canManageManagersCrud } from '@/src/utils/permissions';
import { AddManagerModal } from '../AddManagerModal';
import { ManagerHeader } from './ManagerHeader';
import { ManagerTable } from './ManagerTable';
import Pagination from '@/components/Pagination';

export const ManagerList = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ pages: 1, currentPage: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage = canManageManagersCrud(currentUser);

  const refresh = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/managers?page=${page}`);
      if (result && result.data) {
        setManagers(result.data);
        setPagination(result.pagination);
      } else {
        setManagers(Array.isArray(result) ? result : []);
      }
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
    if (!canManageManagersCrud(currentUser)) router.replace('/admin');
  }, [mounted, currentUser, router]);

  useEffect(() => { if (token) refresh(1); }, [token, refresh]);

  function handlePageChange(page) {
    setCurrentPage(page);
    refresh(page);
  }

  if (!mounted) return null;

  if (!canManage) {
    return (
      <div className="alert alert-warning mb-3" role="alert">
        Accès refusé. Permission MANAGERS_MANAGE requise.
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

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.pages}
        onPageChange={handlePageChange}
      />

      <AddManagerModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
};
