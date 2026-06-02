'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { searchUsers } from '@/lib/search';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getToken, getUser } from '@/lib/auth';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { ConfirmModal } from '../../users/_components/ConfirmModal';

const EMPTY_MANAGER = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '' };
const EMPTY_USER    = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '', roleNom: '' };
const PAGE_SIZE = 5;

function StatusBadge({ isActive }) {
  return isActive
    ? <span className="adm-status adm-status--active">Actif</span>
    : <span className="adm-status adm-status--inactive">Désactivé</span>;
}

function RoleBadge({ nom }) {
  if (!nom) return <span className="text-secondary">—</span>;
  if (nom === 'manager')
    return <span className="adm-status adm-status--review">{nom}</span>;
  if (nom === 'admin')
    return <span className="adm-status" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>{nom}</span>;
  return <span className="text-secondary small">{nom}</span>;
}

export function ManagersUsers() {
  const [token, setToken] = useState(null);

  // Data
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [apiSearchUsers, setApiSearchUsers] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [roles,    setRoles]    = useState([]);

  // Page state
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(0);

  // Filters
  const [searchQuery,   setSearchQuery]   = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 350);
  const [filterStatut,  setFilterStatut]  = useState('all');
  const [filterDept,    setFilterDept]    = useState('all');
  const [filterRole,    setFilterRole]    = useState('all');
  const [filterManager, setFilterManager] = useState('all');

  // Modal
  const [activeModal, setActiveModal] = useState(null);
  const [modalData,   setModalData]   = useState(null);
  const [formError,   setFormError]   = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);

  // Form state
  const [managerForm, setManagerForm] = useState(EMPTY_MANAGER);
  const [userForm,    setUserForm]    = useState(EMPTY_USER);
  const [newRole,     setNewRole]     = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);

  const currentUser = getUser();
  const roleStr = (currentUser?.role?.nom ?? currentUser?.role ?? '').toString().toLowerCase();
  const isAdmin = roleStr === 'admin';

  useEffect(() => { setToken(getToken()); }, []);

  // ── Data load ──────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [managersData, allUsersData, rolesData] = await Promise.all([
        apiFetch('/managers?limit=500'),
        apiFetch('/users?limit=500'),
        apiFetch('/roles'),
      ]);
      const toArr = (res) => res?.data ?? (Array.isArray(res) ? res : []);
      setManagers(toArr(managersData));
      setAllUsers(toArr(allUsersData));
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  useEffect(() => {
    if (!token || !debouncedSearch) {
      setApiSearchUsers(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchUsers({ q: debouncedSearch, limit: 500 })
      .then((res) => {
        if (!cancelled) setApiSearchUsers(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setApiSearchUsers([]);
          setError(err instanceof Error ? err.message : 'Erreur de recherche.');
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, debouncedSearch]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const managerMap = useMemo(() => (
    Object.fromEntries(managers.map(m => [String(m._id), m]))
  ), [managers]);

  const depts = useMemo(() => {
    const set = new Set(allUsers.map(u => userDepartment(u)).filter(Boolean));
    return [...set].sort();
  }, [allUsers]);

  const roleNames = useMemo(() => {
    const set = new Set(allUsers.map(u => u.role?.nom).filter(Boolean));
    return [...set].sort();
  }, [allUsers]);

  const userSource = apiSearchUsers !== null ? apiSearchUsers : allUsers;

  const filtered = useMemo(() => {
    return userSource.filter(item => {
      if (filterStatut  !== 'all' && String(item.isActive) !== filterStatut)    return false;
      if (filterDept    !== 'all' && userDepartment(item) !== filterDept)        return false;
      if (filterRole    !== 'all' && item.role?.nom !== filterRole)              return false;
      if (filterManager !== 'all' && String(item.manager_id ?? '') !== filterManager) return false;
      return true;
    });
  }, [userSource, filterStatut, filterDept, filterRole, filterManager]);

  useEffect(() => { setPage(0); }, [debouncedSearch, filterStatut, filterDept, filterRole, filterManager]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const managerCount = allUsers.filter(u => u.role?.nom === 'manager').length;
  const userCount    = allUsers.filter(u => u.role?.nom !== 'manager' && u.role?.nom !== 'admin').length;

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (modal, data = null) => {
    setActiveModal(modal);
    setModalData(data);
    setFormError(null);
    setConfirmText('');
    if (modal === 'createManager') {
      setManagerForm(EMPTY_MANAGER);
    } else if (modal === 'editManager' && data) {
      setManagerForm({
        nom:          data.nom          || data.lastName  || '',
        prenom:       data.prenom       || data.firstName || '',
        email:        data.email        || '',
        departement:  data.departement  || data.department || '',
        mot_de_passe: '',
      });
    } else if (modal === 'createUser') {
      setUserForm(EMPTY_USER);
    } else if (modal === 'editUser' && data) {
      setUserForm({
        nom:         data.nom         || data.lastName  || '',
        prenom:      data.prenom      || data.firstName || '',
        email:       data.email       || '',
        departement: data.departement || data.department || '',
      });
    } else if (modal === 'changeRole' && data) {
      setNewRole(data.role?.nom || '');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setFormError(null);
    setIsLoading(false);
  };

  // ── API handlers ───────────────────────────────────────────────────────────
  const handleCreateManager = async (e) => {
    e.preventDefault();
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch('/managers', { method: 'POST', body: JSON.stringify({
        nom: managerForm.nom.trim(), prenom: managerForm.prenom.trim(),
        email: managerForm.email.trim(), mot_de_passe: managerForm.mot_de_passe,
        departement: managerForm.departement.trim() || '',
      })});
      showToast('Manager créé avec succès.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally { setIsLoading(false); }
  };

  const handleEditManager = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch(`/managers/${modalData._id}`, { method: 'PATCH', body: JSON.stringify({
        nom: managerForm.nom.trim(), prenom: managerForm.prenom.trim(),
        email: managerForm.email.trim(), departement: managerForm.departement.trim() || '',
      })});
      showToast('Manager mis à jour.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally { setIsLoading(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.roleNom) { setFormError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch('/users/admin', { method: 'POST', body: JSON.stringify({
        nom: userForm.nom.trim(), prenom: userForm.prenom.trim(),
        email: userForm.email.trim(), mot_de_passe: userForm.mot_de_passe,
        roleNom: userForm.roleNom, departement: userForm.departement.trim() || '',
      })});
      showToast('Utilisateur créé avec succès.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally { setIsLoading(false); }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}`, { method: 'PATCH', body: JSON.stringify({
        nom: userForm.nom.trim(), prenom: userForm.prenom.trim(),
        email: userForm.email.trim(), departement: userForm.departement.trim() || '',
      })});
      showToast('Utilisateur mis à jour.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally { setIsLoading(false); }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!modalData || !newRole) { setFormError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}/role`, { method: 'PATCH', body: JSON.stringify({ roleNom: newRole }) });
      showToast('Rôle mis à jour.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle.');
    } finally { setIsLoading(false); }
  };

  const handleDeleteManager = async () => {
    if (!modalData) return;
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch(`/managers/${modalData._id}`, { method: 'DELETE' });
      showToast('Manager supprimé.', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally { setIsLoading(false); }
  };

  const handleRgpdDelete = async () => {
    if (!modalData || confirmText !== 'CONFIRMER') return;
    setIsLoading(true); setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}`, { method: 'DELETE' });
      showToast('Compte supprimé (RGPD).', 'success');
      closeModal(); refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally { setIsLoading(false); }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirm) return;
    const { kind, person } = statusConfirm;
    setStatusToggleLoading(true);
    try {
      if (kind === 'user') {
        await apiFetch(`/users/${person._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !person.isActive }),
        });
        showToast(`Utilisateur ${!person.isActive ? 'activé' : 'désactivé'}.`, 'success');
      } else {
        await apiFetch(`/managers/${person._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !person.isActive }),
        });
        showToast(`Manager ${!person.isActive ? 'activé' : 'désactivé'}.`, 'success');
      }
      setStatusConfirm(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
    } finally {
      setStatusToggleLoading(false);
    }
  };

  // ── Action renderers ───────────────────────────────────────────────────────
  const renderManagerActions = (m) => (
    <div className="adm-actions">
      <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => openModal('editManager', m)}>
        <IconEdit size={15} />
      </button>
      <button className="adm-btn-icon adm-btn-icon--warn" type="button" title={m.isActive ? 'Désactiver' : 'Réactiver'} onClick={() => setStatusConfirm({ kind: 'manager', person: m })}>
        <IconUserOff size={15} />
      </button>
    </div>
   
  );

  const renderUserActions = (u) => (
    <div className="adm-actions">
      <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => openModal('editUser', u)}>
        <IconEdit size={15} />
      </button>
      <button className="adm-btn-icon adm-btn-icon--warn" type="button" title={u.isActive ? 'Désactiver' : 'Réactiver'} onClick={() => setStatusConfirm({ kind: 'user', person: u })}>
        <IconUserOff size={15} />
      </button>
    </div>
  );

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status"><span className="visually-hidden">Chargement…</span></div>
      </div>
    );
  }

  return (
    <div className="adm-page">

      {/* ── Page header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Managers &amp; Utilisateurs</h1>
          <p className="adm-subtitle">
            {managerCount} manager(s) · {userCount} utilisateur(s) · {allUsers.length} total
          </p>
        </div>
        <div className="adm-header-actions">
          <button className="btn btn-outline-secondary" type="button" onClick={refresh} disabled={loading}>
            <IconRefresh size={15} className="me-1" />Actualiser
          </button>
          <button className="btn btn-primary" type="button" onClick={() => openModal('createManager')}>
            <IconPlus size={15} className="me-1" />Nouveau manager
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="card mb-3">
        <div className="adm-toolbar">
          <div style={{ flex: '1 1 220px', position: 'relative', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text" className="form-control" style={{ paddingLeft: 32 }}
              placeholder="Rechercher (nom, email, département)…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ flex: '0 0 200px', width: 200 }} value={filterManager} onChange={e => setFilterManager(e.target.value)}>
            <option value="all">Tous les managers</option>
            {managers.map(m => (
              <option key={m._id} value={String(m._id)}>
                {userFirstName(m)} {userLastName(m)}
              </option>
            ))}
          </select>
          <select className="form-select" style={{ flex: '0 0 150px', width: 150 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="all">Tous les rôles</option>
            {roleNames.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="form-select" style={{ flex: '0 0 140px', width: 140 }} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
          </select>
          <select className="form-select" style={{ flex: '0 0 140px', width: 140 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="all">Tous les depts</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(searchQuery || filterStatut !== 'all' || filterDept !== 'all' || filterRole !== 'all' || filterManager !== 'all') && (
            <button className="btn btn-outline-secondary" type="button" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
              onClick={() => { setSearchQuery(''); setFilterStatut('all'); setFilterDept('all'); setFilterRole('all'); setFilterManager('all'); }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"><span className="visually-hidden">Chargement…</span></div>
        </div>
      )}

      {!loading && allUsers.length === 0 && (
        <div className="adm-empty">
          <div className="adm-empty-icon"><IconUsers size={22} /></div>
          <p>Aucun utilisateur enregistré.</p>
        </div>
      )}

      {/* ── Unified table ── */}
      {!loading && allUsers.length > 0 && (
        <div className="card">

          {/* Desktop */}
          <div className="d-none d-md-block">
            <table className="table card-table mb-0">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Département</th>
                  <th>Rôle</th>
                  <th>Manager</th>
                  <th>Statut</th>
                  <th style={{ width: 1 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-secondary py-4">Aucun résultat.</td></tr>
                ) : paginated.map(item => {
                  const isManager = item.role?.nom === 'manager';
                  const mgr = item.manager_id ? managerMap[String(item.manager_id)] : null;
                  const mgrName = mgr ? `${userFirstName(mgr)} ${userLastName(mgr)}` : '—';
                  return (
                    <tr key={item._id}>
                      <td><div className="fw-medium">{userFirstName(item)} {userLastName(item)}</div></td>
                      <td className="text-secondary">{item.email}</td>
                      <td>{userDepartment(item) || '—'}</td>
                      <td><RoleBadge nom={item.role?.nom} /></td>
                      <td className="text-secondary small">{mgrName}</td>
                      <td><StatusBadge isActive={item.isActive} /></td>
                      <td>{isManager ? renderManagerActions(item) : renderUserActions(item)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="d-md-none p-3">
            {filtered.length === 0 ? (
              <p className="text-center text-secondary">Aucun résultat.</p>
            ) : paginated.map(item => {
              const isManager = item.role?.nom === 'manager';
              const mgr = item.manager_id ? managerMap[String(item.manager_id)] : null;
              const mgrName = mgr ? `${userFirstName(mgr)} ${userLastName(mgr)}` : null;
              return (
                <div key={item._id} className="card mb-2">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <div className="fw-medium">{userFirstName(item)} {userLastName(item)}</div>
                        <div className="text-secondary small">{item.email}</div>
                        {mgrName && <div className="text-secondary small">Manager : {mgrName}</div>}
                      </div>
                      <StatusBadge isActive={item.isActive} />
                    </div>
                    <div className="d-flex gap-2 mb-1">
                      <RoleBadge nom={item.role?.nom} />
                      {userDepartment(item) && <span className="text-secondary small">{userDepartment(item)}</span>}
                    </div>
                    <div className="mt-1">{isManager ? renderManagerActions(item) : renderUserActions(item)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="adm-pagination mt-2 px-3 pb-3">
              <span className="adm-pagination-info">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} sur {filtered.length}
              </span>
              <div className="adm-pagination-btns">
                <button className="adm-pagination-btn" type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <IconChevronLeft size={14} />
                </button>
                {Array.from({ length: pageCount }, (_, idx) => (
                  <button
                    key={`page-${idx}`}
                    className="adm-pagination-btn"
                    type="button"
                    onClick={() => setPage(idx)}
                    style={page === idx ? { background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA', fontWeight: 700 } : undefined}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button className="adm-pagination-btn" type="button" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>
                  <IconChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Modals
      ══════════════════════════════════════════════════════════════ */}

      {statusConfirm && (
        <ConfirmModal
          show
          onHide={() => setStatusConfirm(null)}
          onConfirm={handleConfirmStatusToggle}
          title="Confirmer le changement de statut"
          message={
            `${statusConfirm.person.isActive ? 'Désactiver' : 'Réactiver'} ${
              userFirstName(statusConfirm.person)
            } ${userLastName(statusConfirm.person)} ? Êtes-vous sûr(e) ?`
          }
          subtitle={null}
          confirmLabel="Oui, confirmer"
          variant={statusConfirm.person.isActive ? 'warning' : 'success'}
          isLoading={statusToggleLoading}
        />
      )}

      {/* 1. Créer un manager */}
      <Modal
        open={activeModal === 'createManager'}
        title="Créer un manager"
        subtitle="Le compte aura le rôle manager."
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-create-manager" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
              Créer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-create-manager" onSubmit={handleCreateManager}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={managerForm.nom}
                onChange={e => setManagerForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={managerForm.prenom}
                onChange={e => setManagerForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={managerForm.email}
                onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Mot de passe <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="password" value={managerForm.mot_de_passe}
                onChange={e => setManagerForm(f => ({ ...f, mot_de_passe: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={managerForm.departement}
                onChange={e => setManagerForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* 2. Modifier un manager */}
      <Modal
        open={activeModal === 'editManager'}
        title="Modifier le manager"
        subtitle={modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : undefined}
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-edit-manager" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
              Enregistrer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-edit-manager" onSubmit={handleEditManager}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={managerForm.nom}
                onChange={e => setManagerForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={managerForm.prenom}
                onChange={e => setManagerForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={managerForm.email}
                onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={managerForm.departement}
                onChange={e => setManagerForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* 3. Créer un utilisateur */}
      <Modal
        open={activeModal === 'createUser'}
        title="Créer un utilisateur"
        subtitle="Nouveau compte — rôle au choix."
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-create-user" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
              Créer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-create-user" onSubmit={handleCreateUser}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={userForm.nom}
                onChange={e => setUserForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={userForm.prenom}
                onChange={e => setUserForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Mot de passe <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="password" value={userForm.mot_de_passe}
                onChange={e => setUserForm(f => ({ ...f, mot_de_passe: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={userForm.departement}
                onChange={e => setUserForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Rôle <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <select className="form-select" value={userForm.roleNom}
                onChange={e => setUserForm(f => ({ ...f, roleNom: e.target.value }))} required>
                <option value="" disabled>Choisir…</option>
                {roles.map(r => <option key={r._id} value={r.nom}>{r.nom}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* 4. Modifier un utilisateur */}
      <Modal
        open={activeModal === 'editUser'}
        title="Modifier l'utilisateur"
        subtitle={modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : undefined}
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-edit-user" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
              Enregistrer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-edit-user" onSubmit={handleEditUser}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={userForm.nom}
                onChange={e => setUserForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={userForm.prenom}
                onChange={e => setUserForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={userForm.departement}
                onChange={e => setUserForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* 5. Changer le rôle */}
      <Modal
        open={activeModal === 'changeRole'}
        title="Changer le rôle"
        subtitle={modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : undefined}
        onClose={closeModal}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-change-role" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
              Mettre à jour
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-change-role" onSubmit={handleChangeRole}>
          <div className="mb-3">
            <label className="form-label">
              Rôle <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value)} required>
              <option value="" disabled>Choisir…</option>
              {roles.map(r => <option key={r._id} value={r.nom}>{r.nom}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* 6. Supprimer un manager */}
      <Modal
        open={activeModal === 'deleteManager'}
        title="Supprimer le manager"
        subtitle="Cette action est irréversible."
        onClose={closeModal}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-danger" type="button" onClick={handleDeleteManager} disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-check me-1" />}
              Supprimer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-2">{formError}</div>}
        <p className="text-secondary mb-0">
          Supprimer définitivement{' '}
          <strong>{modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : ''}</strong>{' '}
          ? Ses utilisateurs seront dissociés.
        </p>
      </Modal>

      {/* 7. Suppression RGPD */}
      <Modal
        open={activeModal === 'rgpd'}
        title="Suppression RGPD"
        subtitle="Cette action anonymise et supprime définitivement le compte."
        onClose={closeModal}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-danger" type="button" onClick={handleRgpdDelete} disabled={isLoading || confirmText !== 'CONFIRMER'}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-trash me-1" />}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-2">{formError}</div>}
        <p className="text-secondary mb-3">
          Supprimer définitivement{' '}
          <strong>{modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : ''}</strong>{' '}
          ? Toutes les données seront anonymisées. Cette action est irréversible.
        </p>
        <div className="mb-3">
          <label className="form-label">Tapez <strong>CONFIRMER</strong> pour valider</label>
          <input className="form-control" value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="CONFIRMER" autoComplete="off" />
        </div>
      </Modal>

    </div>
  );
}
