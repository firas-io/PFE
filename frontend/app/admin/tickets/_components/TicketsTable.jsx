'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { canManageCategoryTickets } from '@/src/utils/permissions';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';
import { TicketsBoard } from '@/components/tickets/TicketsBoard';

const EMPTY_FORM = { title: '', description: '', proposed_category_name: '', scope: 'personal' };

export function TicketsTable() {
  const [token, setToken] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [approveModal, setApproveModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const isAdmin = canManageCategoryTickets(getUser());

  useEffect(() => { setToken(getToken()); }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const result = await apiFetch('/category-tickets?limit=200');
        setTickets(result?.data ?? (Array.isArray(result) ? result : []));
      } else {
        const data = await apiFetch('/category-tickets/my');
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des tickets.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await apiFetch(`/category-tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t)));
      showToast('Statut mis à jour.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
    }
  }, []);

  const openApprove = useCallback((ticket) => {
    const prefill = ticket.requested_name || ticket.proposed_category_name || ticket.title || '';
    setAdminNote(prefill);
    setApproveModal({ id: ticket._id });
  }, []);

  const handleApprove = useCallback(async (e) => {
    e.preventDefault();
    if (!approveModal) return;
    setApproveLoading(true);
    try {
      await apiFetch(`/category-tickets/${approveModal.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done', admin_note: adminNote.trim() }),
      });
      setTickets((prev) =>
        prev.map((t) =>
          t._id === approveModal.id ? { ...t, status: 'done', admin_note: adminNote.trim() } : t
        )
      );
      showToast('Ticket approuvé.', 'success');
      setApproveModal(null);
      setAdminNote('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors de l'approbation.", 'danger');
    } finally {
      setApproveLoading(false);
    }
  }, [approveModal, adminNote]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.description?.trim()) {
      setFormError('La description est requise.');
      return;
    }
    setIsLoading(true);
    setFormError(null);
    try {
      const created = await apiFetch('/category-tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'categorie',
          requested_name: form.proposed_category_name.trim() || form.title.trim(),
          description: form.description.trim(),
          scope: form.scope,
        }),
      });
      setTickets((prev) => [created, ...prev]);
      showToast('Ticket créé avec succès.', 'success');
      setActiveModal(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsLoading(false);
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
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Tickets</h1>
          <p className="adm-subtitle">
            {isAdmin ? 'Tableau Kanban — toutes les demandes' : 'Vos demandes par statut'}
          </p>
        </div>
        <div className="adm-header-actions">
          {!isAdmin && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => { setActiveModal('create'); setForm(EMPTY_FORM); setFormError(null); }}
            >
              <IconPlus size={16} className="me-2" />Nouveau ticket
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <TicketsBoard
        tickets={tickets}
        loading={loading}
        isAdmin={isAdmin}
        onStatusChange={isAdmin ? handleStatusChange : undefined}
        onApprove={isAdmin ? openApprove : undefined}
      />

      <Modal
        open={activeModal === 'create'}
        title="Nouveau ticket de catégorie"
        subtitle="Demandez l'ajout d'une nouvelle catégorie d'habitude."
        onClose={() => setActiveModal(null)}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button" onClick={() => setActiveModal(null)} disabled={isLoading}>
              Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-create-ticket" disabled={isLoading}>
              Envoyer
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger mb-3">{formError}</div>}
        <form id="form-create-ticket" onSubmit={handleCreate}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Titre <span className="text-danger">*</span></label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description <span className="text-danger">*</span></label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Nom de catégorie proposé</label>
              <input
                className="form-control"
                value={form.proposed_category_name}
                onChange={(e) => setForm((f) => ({ ...f, proposed_category_name: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Scope</label>
              <select
                className="form-select"
                value={form.scope}
                onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              >
                <option value="personal">Personnel</option>
                <option value="team">Équipe</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!approveModal}
        title="Approuver le ticket"
        subtitle="Ajoutez une note d'administration avant de valider."
        onClose={() => { setApproveModal(null); setAdminNote(''); }}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => { setApproveModal(null); setAdminNote(''); }}
              disabled={approveLoading}
            >
              Annuler
            </button>
            <button className="btn btn-success" type="submit" form="form-approve-ticket" disabled={approveLoading}>
              {approveLoading ? 'Approbation…' : 'Confirmer'}
            </button>
          </div>
        }
      >
        <form id="form-approve-ticket" onSubmit={handleApprove}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Note admin</label>
            <input
              className="form-control"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              autoFocus
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
