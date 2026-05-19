'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconEdit,
  IconPlus,
  IconRefresh,
  IconUserOff,
} from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';
import { ConfirmModal } from '../../users/_components/ConfirmModal';
import Pagination from '@/components/Pagination';

const EMPTY_CREATE = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '' };
const EMPTY_EDIT   = { nom: '', prenom: '', email: '', departement: '' };

function StatusBadge({ isActive }) {
  return isActive
    ? <span className="adm-status adm-status--active">Actif</span>
    : <span className="adm-status adm-status--inactive">Désactivé</span>;
}

export function MyUsers() {
  const [token,        setToken]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [activeModal,  setActiveModal]  = useState(null);
  const [modalData,    setModalData]    = useState(null);
  const [formError,    setFormError]    = useState(null);
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [editForm,     setEditForm]     = useState(EMPTY_EDIT);
  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => { setToken(getToken()); }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/managers/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const name = `${userFirstName(u)} ${userLastName(u)} ${u.email}`.toLowerCase();
      const matchSearch = !q || name.includes(q);
      const matchStatut = filterStatut === 'all'
        || (filterStatut === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchStatut;
    });
  }, [users, search, filterStatut]);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatut]);

  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openModal = (modal, data = null) => {
    setActiveModal(modal);
    setModalData(data);
    setFormError(null);
    if (modal === 'create') {
      setCreateForm(EMPTY_CREATE);
    } else if (modal === 'edit' && data) {
      setEditForm({
        nom:         userLastName(data)   || '',
        prenom:      userFirstName(data)  || '',
        email:       data.email           || '',
        departement: userDepartment(data) || '',
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setFormError(null);
    setIsLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      const created = await apiFetch('/managers/users', {
        method: 'POST',
        body: JSON.stringify({
          nom:          createForm.nom.trim(),
          prenom:       createForm.prenom.trim(),
          email:        createForm.email.trim(),
          mot_de_passe: createForm.mot_de_passe,
          departement:  createForm.departement.trim() || '',
        }),
      });
      setUsers(prev => [...prev, created]);
      showToast('Membre ajouté à votre équipe.', 'success');
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true);
    setFormError(null);
    try {
      const updated = await apiFetch(`/managers/users/${modalData._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nom:         editForm.nom.trim(),
          prenom:      editForm.prenom.trim(),
          email:       editForm.email.trim(),
          departement: editForm.departement.trim() || '',
        }),
      });
      setUsers(prev => prev.map(u => u._id === modalData._id ? updated : u));
      showToast('Membre mis à jour.', 'success');
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalData) return;
    setIsLoading(true);
    setFormError(null);
    try {
      await apiFetch(`/managers/users/${modalData._id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u._id !== modalData._id));
      showToast('Membre supprimé de votre équipe.', 'success');
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirm) return;
    setStatusToggleLoading(true);
    try {
      const updated = await apiFetch(`/managers/users/${statusConfirm._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !statusConfirm.isActive }),
      });
      setUsers(prev => prev.map(u => u._id === statusConfirm._id ? updated : u));
      showToast(`Membre ${!statusConfirm.isActive ? 'activé' : 'désactivé'}.`, 'success');
      setStatusConfirm(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
    } finally {
      setStatusToggleLoading(false);
    }
  };

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
          <h1 className="adm-title">Mon équipe</h1>
          <p className="adm-subtitle">{users.length} membre{users.length !== 1 ? 's' : ''} dans votre équipe</p>
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
            onClick={() => openModal('create')}
          >
            <IconPlus size={15} className="me-1" />Ajouter un membre
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Toolbar ── */}
      <div className="card mb-3">
        <div className="adm-toolbar">
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
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ flex: '0 0 160px', width: 160 }}
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désactivés</option>
          </select>
          {(search || filterStatut !== 'all') && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
              onClick={() => { setSearch(''); setFilterStatut('all'); }}
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
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Département</th>
                    <th>Statut</th>
                    <th style={{ width: 1 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">
                        {users.length === 0 ? 'Aucun membre dans votre équipe.' : 'Aucun résultat pour ces filtres.'}
                      </td>
                    </tr>
                  ) : paginated.map(u => (
                    <tr key={u._id}>
                      <td><div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div></td>
                      <td className="text-secondary" style={{ fontSize: 12 }}>{u.email}</td>
                      <td className="text-secondary" style={{ fontSize: 12 }}>{userDepartment(u) || '—'}</td>
                      <td><StatusBadge isActive={u.isActive} /></td>
                      <td>
                        <div className="adm-actions">
                          <button
                            className="adm-btn-icon"
                            type="button"
                            title="Modifier"
                            onClick={() => openModal('edit', u)}
                          >
                            <IconEdit size={15} />
                          </button>
                          <button
                            className="adm-btn-icon adm-btn-icon--warn"
                            type="button"
                            title={u.isActive ? 'Désactiver' : 'Réactiver'}
                            onClick={() => setStatusConfirm(u)}
                          >
                            <IconUserOff size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <p>{users.length === 0 ? 'Aucun membre dans votre équipe.' : 'Aucun résultat pour ces filtres.'}</p>
              </div>
            ) : paginated.map(u => (
              <div key={u._id} className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>{u.email}</div>
                      {userDepartment(u) && (
                        <div className="text-secondary" style={{ fontSize: 12 }}>{userDepartment(u)}</div>
                      )}
                    </div>
                    <StatusBadge isActive={u.isActive} />
                  </div>
                  <div className="adm-actions mt-1">
                    <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => openModal('edit', u)}>
                      <IconEdit size={15} />
                    </button>
                    <button className="adm-btn-icon adm-btn-icon--warn" type="button" title={u.isActive ? 'Désactiver' : 'Réactiver'} onClick={() => setStatusConfirm(u)}>
                      <IconUserOff size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {statusConfirm && (
        <ConfirmModal
          show
          onHide={() => setStatusConfirm(null)}
          onConfirm={handleConfirmStatusToggle}
          title="Confirmer le changement de statut"
          message={
            `${statusConfirm.isActive ? 'Désactiver' : 'Réactiver'} ${
              userFirstName(statusConfirm)
            } ${userLastName(statusConfirm)} ? Êtes-vous sûr(e) ?`
          }
          subtitle={null}
          confirmLabel="Oui, confirmer"
          variant={statusConfirm.isActive ? 'warning' : 'success'}
          isLoading={statusToggleLoading}
        />
      )}

      {/* ── Modal : Créer un membre ── */}
      <Modal
        open={activeModal === 'create'}
        title="Ajouter un membre"
        subtitle="Le compte sera rattaché à votre équipe."
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>Annuler</button>
            <button className="btn btn-primary" type="submit" form="form-create-member" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : null}Créer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-create-member" onSubmit={handleCreate}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={createForm.nom} onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={createForm.prenom} onChange={e => setCreateForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Mot de passe <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="password" value={createForm.mot_de_passe} onChange={e => setCreateForm(f => ({ ...f, mot_de_passe: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={createForm.departement} onChange={e => setCreateForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Modal : Modifier un membre ── */}
      <Modal
        open={activeModal === 'edit'}
        title="Modifier le membre"
        subtitle={modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : undefined}
        onClose={closeModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>Annuler</button>
            <button className="btn btn-primary" type="submit" form="form-edit-member" disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : null}Enregistrer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-edit-member" onSubmit={handleEdit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Prénom <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input className="form-control" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Département</label>
              <input className="form-control" value={editForm.departement} onChange={e => setEditForm(f => ({ ...f, departement: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Modal : Supprimer un membre ── */}
      <Modal
        open={activeModal === 'delete'}
        title="Supprimer le membre"
        subtitle="Cette action est irréversible."
        onClose={closeModal}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeModal} disabled={isLoading}>Annuler</button>
            <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : null}Supprimer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-2">{formError}</div>}
        <p className="text-secondary mb-0">
          Supprimer définitivement{' '}
          <strong>{modalData ? `${userFirstName(modalData)} ${userLastName(modalData)}` : ''}</strong>{' '}
          de votre équipe ?
        </p>
      </Modal>
    </div>
  );
}
