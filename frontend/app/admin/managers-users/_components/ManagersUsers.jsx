'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';

const EMPTY_MANAGER = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '' };
const EMPTY_USER    = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '', roleNom: '' };
const PAGE_SIZE = 5;

function StatusBadge({ isActive }) {
  return isActive
    ? <span className="adm-status adm-status--active">Actif</span>
    : <span className="adm-status adm-status--inactive">Désactivé</span>;
}

function Spinner() {
  return (
    <div className="text-center py-3">
      <div className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Chargement…</span>
      </div>
    </div>
  );
}

export function ManagersUsers() {
  const [token, setToken] = useState(null);

  // Data
  const [managers, setManagers] = useState([]);
  const [orphans,  setOrphans]  = useState([]);
  const [roles,    setRoles]    = useState([]);

  // Selected manager
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [teamCache,   setTeamCache]   = useState({});
  const [teamLoading, setTeamLoading] = useState({});

  // Page state
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Filters
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterDept,   setFilterDept]   = useState('all');
  const [orphanPage,   setOrphanPage]   = useState(0);

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

  // isAdmin — handles both role-as-string and role-as-object shapes
  const currentUser = getUser();
  const roleStr = (currentUser?.role?.nom ?? currentUser?.role ?? '').toString().toLowerCase();
  const isAdmin = roleStr === 'admin';

  useEffect(() => { setToken(getToken()); }, []);

  // ── Initial data load ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [managersData, allUsersData, rolesData] = await Promise.all([
        apiFetch('/managers'),
        apiFetch('/users'),
        apiFetch('/roles'),
      ]);
      setManagers(Array.isArray(managersData) ? managersData : []);
      setOrphans(Array.isArray(allUsersData) ? allUsersData.filter(u => !u.manager_id) : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setTeamCache({});
      setTeamLoading({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const refreshTeam = useCallback(async (managerId) => {
    setTeamLoading(prev => ({ ...prev, [managerId]: true }));
    try {
      const data = await apiFetch(`/users?managerId=${managerId}`);
      setTeamCache(prev => ({ ...prev, [managerId]: Array.isArray(data) ? data : [] }));
    } catch {
      /* keep stale cache */
    } finally {
      setTeamLoading(prev => ({ ...prev, [managerId]: false }));
    }
  }, []);

  // ── Filters ────────────────────────────────────────────────────────────────
  const depts = useMemo(() => {
    const set = new Set(managers.map(m => userDepartment(m)).filter(Boolean));
    return [...set].sort();
  }, [managers]);

  const filteredManagers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return managers.filter(m => {
      if (filterStatut !== 'all' && String(m.isActive) !== filterStatut) return false;
      if (filterDept   !== 'all' && userDepartment(m) !== filterDept)    return false;
      if (q) {
        const hay = `${userFirstName(m)} ${userLastName(m)} ${m.email} ${userDepartment(m)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [managers, searchQuery, filterStatut, filterDept]);

  useEffect(() => { setOrphanPage(0); }, [orphans.length]);

  useEffect(() => {
    if (filteredManagers.length === 0) {
      setSelectedManagerId('');
      return;
    }
    const exists = filteredManagers.some(m => m._id === selectedManagerId);
    if (!exists) setSelectedManagerId(filteredManagers[0]._id);
  }, [filteredManagers, selectedManagerId]);

  useEffect(() => {
    if (!selectedManagerId || teamCache[selectedManagerId] !== undefined) return;
    refreshTeam(selectedManagerId);
  }, [selectedManagerId, teamCache, refreshTeam]);

  const selectedManager = filteredManagers.find(m => m._id === selectedManagerId) || null;

  const orphansPageCount = Math.ceil(orphans.length / PAGE_SIZE);
  const orphansStart = orphanPage * PAGE_SIZE;
  const paginatedOrphans = orphans.slice(orphansStart, orphansStart + PAGE_SIZE);

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
        nom:          data.nom          || '',
        prenom:       data.prenom       || '',
        email:        data.email        || '',
        departement:  data.departement  || '',
        mot_de_passe: '',
      });
    } else if (modal === 'createUser') {
      setUserForm(EMPTY_USER);
    } else if (modal === 'editUser' && data) {
      setUserForm({
        nom:         data.nom         || '',
        prenom:      data.prenom      || '',
        email:       data.email       || '',
        departement: data.departement || '',
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
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch('/managers', {
        method: 'POST',
        body: JSON.stringify({
          nom:          managerForm.nom.trim(),
          prenom:       managerForm.prenom.trim(),
          email:        managerForm.email.trim(),
          mot_de_passe: managerForm.mot_de_passe,
          departement:  managerForm.departement.trim() || '',
        }),
      });
      showToast('Manager créé avec succès.', 'success');
      closeModal();
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditManager = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/managers/${modalData._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nom:         managerForm.nom.trim(),
          prenom:      managerForm.prenom.trim(),
          email:       managerForm.email.trim(),
          departement: managerForm.departement.trim() || '',
        }),
      });
      showToast('Manager mis à jour.', 'success');
      closeModal();
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.roleNom) { setFormError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch('/users/admin', {
        method: 'POST',
        body: JSON.stringify({
          nom:          userForm.nom.trim(),
          prenom:       userForm.prenom.trim(),
          email:        userForm.email.trim(),
          mot_de_passe: userForm.mot_de_passe,
          roleNom:      userForm.roleNom,
          departement:  userForm.departement.trim() || '',
        }),
      });
      showToast('Utilisateur créé avec succès.', 'success');
      closeModal();
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nom:         userForm.nom.trim(),
          prenom:      userForm.prenom.trim(),
          email:       userForm.email.trim(),
          departement: userForm.departement.trim() || '',
        }),
      });
      showToast('Utilisateur mis à jour.', 'success');
      closeModal();
      if (modalData._context === 'team' && modalData._managerId) {
        refreshTeam(modalData._managerId);
      } else {
        refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!modalData || !newRole) { setFormError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleNom: newRole }),
      });
      showToast('Rôle mis à jour.', 'success');
      closeModal();
      if (modalData._context === 'team' && modalData._managerId) {
        refreshTeam(modalData._managerId);
      } else {
        refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!modalData) return;
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/managers/${modalData._id}`, { method: 'DELETE' });
      showToast('Manager supprimé.', 'success');
      closeModal();
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRgpdDelete = async () => {
    if (!modalData || confirmText !== 'CONFIRMER') return;
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/users/${modalData._id}`, { method: 'DELETE' });
      showToast('Compte supprimé (RGPD).', 'success');
      closeModal();
      if (modalData._context === 'team' && modalData._managerId) {
        refreshTeam(modalData._managerId);
      } else {
        refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = useCallback(async (user, context, managerId) => {
    try {
      await apiFetch(`/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      showToast(`Utilisateur ${!user.isActive ? 'activé' : 'désactivé'}.`, 'success');
      if (context === 'team' && managerId) {
        refreshTeam(managerId);
      } else {
        refresh();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
    }
  }, [refresh, refreshTeam]);

  // ── User action buttons (team + orphan) ────────────────────────────────────
  const renderUserActions = (u, context, managerId = null) => {
    const enriched = { ...u, _context: context, _managerId: managerId };
    return (
      <div className="adm-actions">
        <button
          className="adm-btn-icon"
          type="button"
          title="Modifier"
          onClick={() => openModal('editUser', enriched)}
        >
          <IconEdit size={15} />
        </button>
        <button
          className="adm-btn-icon"
          type="button"
          title="Changer le rôle"
          onClick={() => openModal('changeRole', enriched)}
        >
          <IconCircleCheck size={15} />
        </button>
        <button
          className="adm-btn-icon adm-btn-icon--warn"
          type="button"
          title={u.isActive ? 'Désactiver' : 'Réactiver'}
          onClick={() => handleToggleUserStatus(u, context, managerId)}
        >
          <IconUserOff size={15} />
        </button>
        <button
          className="adm-btn-icon adm-btn-icon--danger"
          type="button"
          title="Supprimer (RGPD)"
          onClick={() => openModal('rgpd', enriched)}
        >
          <IconTrash size={15} />
        </button>
      </div>
    );
  };

  // ── Team table (inside accordion) ──────────────────────────────────────────
  const renderTeamTable = (team, managerId) => (
    <>
      {/* Desktop */}
      <div className="d-none d-md-block">
        {team.length === 0 ? (
          <div className="text-secondary small py-2">Aucun utilisateur dans cette équipe.</div>
        ) : (
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {team.map(u => (
                <tr key={u._id}>
                  <td><div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div></td>
                  <td>{u.email}</td>
                  <td>{u.role?.nom || '-'}</td>
                  <td><StatusBadge isActive={u.isActive} /></td>
                  <td>{renderUserActions(u, 'team', managerId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile */}
      <div className="d-md-none">
        {team.length === 0 ? (
          <div className="text-secondary small py-2">Aucun utilisateur dans cette équipe.</div>
        ) : team.map(u => (
          <div key={u._id} className="card mb-2">
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div>
                  <div className="text-secondary small">{u.email}</div>
                </div>
                <StatusBadge isActive={u.isActive} />
              </div>
              {u.role?.nom && (
                <span className="adm-status adm-status--review mb-2">{u.role.nom}</span>
              )}
              <div className="mt-1">{renderUserActions(u, 'team', managerId)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ── Orphan users table ─────────────────────────────────────────────────────
  const renderOrphansTable = () => (
    <>
      {/* Desktop */}
      <div className="d-none d-md-block">
        <table className="table card-table mb-0">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Département</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th style={{ width: 1 }} />
            </tr>
          </thead>
          <tbody>
            {paginatedOrphans.map(u => (
              <tr key={u._id}>
                <td><div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div></td>
                <td>{u.email}</td>
                <td>{userDepartment(u) || '-'}</td>
                <td>{u.role?.nom || '-'}</td>
                <td><StatusBadge isActive={u.isActive} /></td>
                <td>{renderUserActions(u, 'orphan')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="d-md-none">
        {paginatedOrphans.map(u => (
          <div key={u._id} className="card mb-2">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-bold">{userFirstName(u)} {userLastName(u)}</div>
                  <div className="text-secondary small">{u.email}</div>
                </div>
                <StatusBadge isActive={u.isActive} />
              </div>
              <div className="d-flex flex-wrap gap-2 text-secondary small mb-2">
                {userDepartment(u) && <span>{userDepartment(u)}</span>}
                {u.role?.nom && (
                  <span className="adm-status adm-status--review">{u.role.nom}</span>
                )}
              </div>
              <div className="mt-2">{renderUserActions(u, 'orphan')}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ── Initial spinner ────────────────────────────────────────────────────────
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
      {/* ── Page header ── */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Managers &amp; Utilisateurs</h1>
          <p className="adm-subtitle">
            {managers.length} manager(s) · {orphans.length} utilisateur(s) sans manager
          </p>
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
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => openModal('createManager')}
          >
            <IconPlus size={15} className="me-1" />
            Nouveau manager
          </button>
          {!isAdmin && (
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={() => openModal('createUser')}
            >
              <IconPlus size={15} className="me-1" />
              Nouvel utilisateur
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="card mb-3">
        <div className="adm-toolbar">
          <div style={{ flex: '1 1 220px', position: 'relative', minWidth: 0 }}>
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
              placeholder="Rechercher un manager (nom, email, département)…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ flex: '0 0 160px', width: 160 }}
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
          </select>
          <select
            className="form-select"
            style={{ flex: '0 0 160px', width: 160 }}
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="all">Tous les depts</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(searchQuery || filterStatut !== 'all' || filterDept !== 'all') && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
              onClick={() => { setSearchQuery(''); setFilterStatut('all'); setFilterDept('all'); }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Page loading ── */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement…</span>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && managers.length === 0 && (
        <div className="adm-empty">
          <div className="adm-empty-icon">
            <IconUsers size={22} />
          </div>
          <p>Aucun manager enregistré.</p>
        </div>
      )}

      {/* ── Manager select + team ── */}
      {!loading && filteredManagers.length > 0 && (
        <div className="card mb-2">
          <div className="card-header d-flex flex-wrap align-items-center gap-2">
            <span className="fw-medium">Manager</span>
            <select
              className="form-select"
              style={{ maxWidth: 360 }}
              value={selectedManagerId}
              onChange={e => setSelectedManagerId(e.target.value)}
            >
              {filteredManagers.map(m => (
                <option key={m._id} value={m._id}>
                  {userFirstName(m)} {userLastName(m)} — {m.email}
                </option>
              ))}
            </select>
          </div>
          {selectedManager && (
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-medium">
                    {userFirstName(selectedManager)} {userLastName(selectedManager)}
                  </span>
                  <span className="text-secondary small">{selectedManager.email}</span>
                  <StatusBadge isActive={selectedManager.isActive} />
                </div>
                <div className="adm-actions">
                  <button
                    className="adm-btn-icon"
                    type="button"
                    title="Modifier le manager"
                    onClick={() => openModal('editManager', selectedManager)}
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    className="adm-btn-icon adm-btn-icon--danger"
                    type="button"
                    title="Supprimer le manager"
                    onClick={() => openModal('deleteManager', selectedManager)}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2 text-secondary small">
                  <IconUsers size={15} />
                  <span>Équipe</span>
                  {teamCache[selectedManager._id] && (
                    <span className="adm-status adm-status--review">{teamCache[selectedManager._id].length}</span>
                  )}
                </div>
                {!isAdmin && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    type="button"
                    onClick={() => openModal('createUser', { managerId: selectedManager._id })}
                  >
                    <IconPlus size={14} className="me-1" />
                    Ajouter un utilisateur
                  </button>
                )}
              </div>

              {teamLoading[selectedManager._id] && <Spinner />}
              {!teamLoading[selectedManager._id] && teamCache[selectedManager._id] !== undefined && renderTeamTable(teamCache[selectedManager._id], selectedManager._id)}
            </div>
          )}
        </div>
      )}

      {/* ── Orphan users ── */}
      {!loading && orphans.length > 0 && (
        <div className="card mt-3">
          <div className="card-header d-flex align-items-center gap-2">
            <IconUsers size={18} />
            <span className="fw-medium">Utilisateurs sans manager</span>
            <span className="adm-status adm-status--review">{orphans.length}</span>
          </div>
          <div className="card-body">
            {renderOrphansTable()}
            {orphans.length > PAGE_SIZE && (
              <div className="adm-pagination mt-2">
                <span className="adm-pagination-info">
                  {orphansStart + 1}–{Math.min(orphansStart + PAGE_SIZE, orphans.length)} sur {orphans.length}
                </span>
                <div className="adm-pagination-btns">
                  <button className="adm-pagination-btn" type="button" disabled={orphanPage === 0} onClick={() => setOrphanPage(p => p - 1)}>
                    <IconChevronLeft size={14} />
                  </button>
                  {Array.from({ length: orphansPageCount }, (_, idx) => (
                    <button
                      key={`orphan-page-${idx}`}
                      className="adm-pagination-btn"
                      type="button"
                      onClick={() => setOrphanPage(idx)}
                      style={orphanPage === idx ? { background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA', fontWeight: 700 } : undefined}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button className="adm-pagination-btn" type="button" disabled={orphanPage >= orphansPageCount - 1} onClick={() => setOrphanPage(p => p + 1)}>
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          7 Modals
      ══════════════════════════════════════════════════════════════ */}

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
              <label className="form-label">Nom</label>
              <input className="form-control" value={managerForm.nom}
                onChange={e => setManagerForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prénom</label>
              <input className="form-control" value={managerForm.prenom}
                onChange={e => setManagerForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={managerForm.email}
                onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mot de passe</label>
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
              <label className="form-label">Nom</label>
              <input className="form-control" value={managerForm.nom}
                onChange={e => setManagerForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prénom</label>
              <input className="form-control" value={managerForm.prenom}
                onChange={e => setManagerForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
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

      {/* 3. Créer un utilisateur (manager-only — accessible uniquement si !isAdmin) */}
      <Modal
        open={activeModal === 'createUser'}
        title="Créer un utilisateur"
        subtitle="Nouveau compte utilisateur — rôle au choix."
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
              <label className="form-label">Nom</label>
              <input className="form-control" value={userForm.nom}
                onChange={e => setUserForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prénom</label>
              <input className="form-control" value={userForm.prenom}
                onChange={e => setUserForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mot de passe</label>
              <input className="form-control" type="password" value={userForm.mot_de_passe}
                onChange={e => setUserForm(f => ({ ...f, mot_de_passe: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={userForm.departement}
                onChange={e => setUserForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rôle</label>
              <select
                className="form-select"
                value={userForm.roleNom}
                onChange={e => setUserForm(f => ({ ...f, roleNom: e.target.value }))}
                required
              >
                <option value="" disabled>Choisir…</option>
                {roles.map(r => (
                  <option key={r._id} value={r.nom}>{r.nom}</option>
                ))}
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
              <label className="form-label">Nom</label>
              <input className="form-control" value={userForm.nom}
                onChange={e => setUserForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prénom</label>
              <input className="form-control" value={userForm.prenom}
                onChange={e => setUserForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
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
            <label className="form-label">Rôle</label>
            <select
              className="form-select"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              required
            >
              <option value="" disabled>Choisir…</option>
              {roles.map(r => (
                <option key={r._id} value={r.nom}>{r.nom}</option>
              ))}
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
          <strong>
            {modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : ''}
          </strong>{' '}
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
            <button
              className="btn btn-danger"
              type="button"
              onClick={handleRgpdDelete}
              disabled={isLoading || confirmText !== 'CONFIRMER'}
            >
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-trash me-1" />}
              Supprimer définitivement
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-2">{formError}</div>}
        <p className="text-secondary mb-3">
          Supprimer définitivement{' '}
          <strong>
            {modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : ''}
          </strong>{' '}
          ? Toutes les données seront anonymisées. Cette action est irréversible.
        </p>
        <div className="mb-3">
          <label className="form-label">
            Tapez <strong>CONFIRMER</strong> pour valider
          </label>
          <input
            className="form-control"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="CONFIRMER"
            autoComplete="off"
          />
        </div>
      </Modal>
    </div>
  );
}
