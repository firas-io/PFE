'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { canAddOffDays } from '@/src/utils/permissions';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';
import Pagination from '@/components/Pagination';

const TYPE_BADGE = {
  holiday:     <span className="adm-status adm-status--rejected">Bloquant</span>,
  maintenance: <span className="adm-status adm-status--inactive">Informatif</span>,
  special:     <span className="adm-status adm-status--inactive">Informatif</span>,
  other:       <span className="adm-status adm-status--inactive">Informatif</span>,
};

const TYPE_HELP = {
  holiday:     { text: "Bloque la création d'habitudes sur cette date précise", className: 'form-text text-danger mt-1' },
  maintenance: { text: "Informatif uniquement, n'affecte aucune habitude",      className: 'form-text text-muted mt-1' },
  special:     { text: "Informatif uniquement, n'affecte aucune habitude",      className: 'form-text text-muted mt-1' },
  other:       { text: "Informatif uniquement, n'affecte aucune habitude",      className: 'form-text text-muted mt-1' },
};

const TYPE_OPTIONS = [
  { value: 'holiday',     label: 'Holiday — Jour férié' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'special',     label: 'Special' },
  { value: 'other',       label: 'Other' },
];

const EMPTY_FORM = { date: '', label: '', type: 'holiday' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function OffDays() {
  const [token,       setToken]       = useState(null);
  const [offDays,     setOffDays]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData,   setModalData]   = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editForm,    setEditForm]    = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const isAdmin = canAddOffDays(getUser());

  useEffect(() => { setToken(getToken()); }, []);

  // ── Pre-fill edit form when modalData changes ────────────────────────────
  useEffect(() => {
    if (modalData) {
      setEditForm({
        date:  modalData.date?.split('T')[0] ?? '',
        label: modalData.label ?? '',
        type:  modalData.type  ?? 'holiday',
      });
    }
  }, [modalData]);

  // ── Data load ─────────────────────────────────────────────────────────────
  // Backend returns sorted by date asc
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/off-days');
      setOffDays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des jours off.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await apiFetch('/off-days', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setOffDays(prev => [...prev, created]);
      setForm(EMPTY_FORM);
      setActiveModal(null);
      showToast('Jour off ajouté avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalData(null);
    setForm(EMPTY_FORM);
    setActiveModal('create');
  };

  const closeCreateModal = () => {
    if (!isLoading) {
      setActiveModal(null);
      setForm(EMPTY_FORM);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  // PATCH returns the full updated document (findOneAndUpdate returnDocument:"after")
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true);
    try {
      const updated = await apiFetch(`/off-days/${modalData._id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setOffDays(prev => prev.map(o => o._id === modalData._id ? updated : o));
      setActiveModal(null);
      setModalData(null);
      showToast('Jour off modifié avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la modification.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete — window.confirm, no modal ────────────────────────────────────
  // DELETE returns 204 No Content
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce jour off ?')) return;
    try {
      await apiFetch(`/off-days/${id}`, { method: 'DELETE' });
      setOffDays(prev => prev.filter(o => o._id !== id));
      showToast('Jour off supprimé.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'danger');
    }
  };

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
          <h1 className="adm-title">Jours off</h1>
          <p className="adm-subtitle">
            {isAdmin ? 'Gérez les jours fériés et les jours de fermeture' : 'Consultez les jours fériés et les jours de fermeture'}
          </p>
        </div>
        {isAdmin && (
          <div className="adm-header-actions">
            <button className="btn btn-primary" type="button" onClick={openCreateModal} disabled={loading}>
              <IconPlus size={16} className="me-2" />
              Ajouter un jour off
            </button>
          </div>
        )}
      </div>


      {/* ── Error ── */}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Chargement…</span>
              </div>
            </div>
          )}

          {!loading && (
            <div className="card d-none d-md-block">
              <div className="table-responsive">
                <table className="table card-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Label</th>
                      <th>Type</th>
                      {isAdmin && <th style={{ width: 1 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {offDays.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="text-center text-secondary py-4">Aucun jour off enregistré.</td>
                      </tr>
                    ) : offDays.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(offDay => (
                      <tr key={offDay._id}>
                        <td className="fw-medium">{formatDate(offDay.date)}</td>
                        <td>{offDay.label}</td>
                        <td>{TYPE_BADGE[offDay.type] ?? TYPE_BADGE.other}</td>
                        {isAdmin && (
                          <td>
                            <div className="adm-actions">
                              <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => { setActiveModal('edit'); setModalData(offDay); }}>
                                <IconEdit size={15} />
                              </button>
                              <button className="adm-btn-icon adm-btn-icon--danger" type="button" title="Supprimer" onClick={() => handleDelete(offDay._id)}>
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && (
            <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {offDays.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                  <p>Aucun jour off enregistré.</p>
                </div>
              ) : offDays.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(offDay => (
                <div key={offDay._id} className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{offDay.label}</div>
                        <div className="text-secondary" style={{ fontSize: 12 }}>{formatDate(offDay.date)}</div>
                      </div>
                      {TYPE_BADGE[offDay.type] ?? TYPE_BADGE.other}
                    </div>
                    {isAdmin && (
                      <div className="adm-actions">
                        <button className="adm-btn-icon" type="button" onClick={() => { setActiveModal('edit'); setModalData(offDay); }}>
                          <IconEdit size={15} />
                        </button>
                        <button className="adm-btn-icon adm-btn-icon--danger" type="button" onClick={() => handleDelete(offDay._id)}>
                          <IconTrash size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(offDays.length / PAGE_SIZE)}
            onPageChange={setCurrentPage}
          />
      </div>

      {/* ── Modal création ── */}
      <Modal
        open={activeModal === 'create'}
        title="Ajouter un jour off"
        onClose={closeCreateModal}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={closeCreateModal} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-add-offday" disabled={isLoading}>
              {isLoading
                ? <i className="fa fa-spinner fa-spin me-1" />
                : <><IconPlus size={16} className="me-1" /></>}
              Ajouter
            </button>
          </div>
        }
      >
        <form id="form-add-offday" onSubmit={handleCreate}>
          <div className="mb-3">
            <label className="form-label">
              Date <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Label <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              className="form-control"
              placeholder="ex: Fête du Travail"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              required
            />
          </div>
          <div className="mb-0">
            <label className="form-label">
              Type <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              className="form-select"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              required
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className={(TYPE_HELP[form.type] ?? TYPE_HELP.other).className}>
              {(TYPE_HELP[form.type] ?? TYPE_HELP.other).text}
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={activeModal === 'edit'}
        title="Modifier le jour off"
        onClose={() => { if (!isLoading) { setActiveModal(null); setModalData(null); } }}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => { setActiveModal(null); setModalData(null); }}
              disabled={isLoading}
            >
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="form-edit-offday"
              disabled={isLoading}
            >
              {isLoading
                ? <i className="fa fa-spinner fa-spin me-1" />
                : <i className="fa fa-save me-1" />}
              Enregistrer
            </button>
          </div>
        }
      >
        <form id="form-edit-offday" onSubmit={handleEdit}>
          <div className="mb-3">
            <label className="form-label">
              Date <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={editForm.date}
              onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Label <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              className="form-control"
              value={editForm.label}
              onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Type <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <select
              className="form-select"
              value={editForm.type}
              onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
              required
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className={(TYPE_HELP[editForm.type] ?? TYPE_HELP.other).className}>
              {(TYPE_HELP[editForm.type] ?? TYPE_HELP.other).text}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
