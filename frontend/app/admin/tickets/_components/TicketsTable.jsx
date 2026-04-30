'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconPlus, IconRefresh } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { Modal } from '@/components/Modal';
import { showToast } from '@/lib/adminToast';

const TABS = [
  { key: 'all',       label: 'Tous' },
  { key: 'pending',   label: 'Pending' },
  { key: 'in_review', label: 'In review' },
  { key: 'done',      label: 'Done' },
  { key: 'rejected',  label: 'Rejeté' },
];

const EMPTY_FORM = { title: '', description: '', proposed_category_name: '', scope: 'personal' };

function StatusBadge({ status }) {
  switch (status) {
    case 'pending':   return <span className="adm-status adm-status--inactive">Pending</span>;
    case 'in_review': return <span className="adm-status adm-status--review">In review</span>;
    case 'done':      return <span className="adm-status adm-status--done">Done</span>;
    case 'rejected':  return <span className="adm-status adm-status--rejected">Rejeté</span>;
    default:          return <span className="adm-status adm-status--inactive">{status}</span>;
  }
}

function ScopeBadge({ scope }) {
  return scope === 'team'
    ? <span className="adm-status adm-status--team">Équipe</span>
    : <span className="adm-status adm-status--personal">Personnel</span>;
}

function truncate(str, max = 60) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function userName(user) {
  if (!user) return 'Compte supprimé';
  const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return full || user.email || '—';
}

function TicketActions({ ticket, onStatusChange, onOpenApprove }) {
  if (ticket.status === 'pending') {
    return (
      <button className="btn btn-sm btn-outline-secondary" type="button"
        onClick={() => onStatusChange(ticket._id, 'in_review')}>
        Mettre en révision
      </button>
    );
  }
  if (ticket.status === 'in_review') {
    return (
      <div className="adm-actions">
        <button className="adm-btn-icon adm-btn-icon--success" type="button" title="Approuver"
          onClick={() => onOpenApprove(ticket)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button className="adm-btn-icon adm-btn-icon--danger" type="button" title="Rejeter"
          onClick={() => onStatusChange(ticket._id, 'rejected')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    );
  }
  return <span className="text-secondary" style={{ fontSize: 12 }}>Finalisé</span>;
}

export function TicketsTable() {
  const [token,       setToken]       = useState(null);
  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('all');
  const [activeModal, setActiveModal] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formError,   setFormError]   = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);

  const [approveModal,  setApproveModal]  = useState(null); // { id, proposedName }
  const [categoryName,  setCategoryName]  = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const role    = (getUser()?.role ?? '').toString().toLowerCase();
  const isAdmin = role === 'admin';

  useEffect(() => { setToken(getToken()); }, []);

  // ── Data load — endpoint selon le rôle ────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isAdmin ? '/category-tickets' : '/category-tickets/my';
      const data = await apiFetch(endpoint);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des tickets.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  // ── Admin : changement de statut (hors approbation) ──────────────────────
  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await apiFetch(`/category-tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      showToast('Statut mis à jour.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
    }
  }, []);

  // ── Admin : ouvrir la modale d'approbation ────────────────────────────────
  const openApprove = useCallback((ticket) => {
    const prefill = ticket.proposed_category_name || ticket.title || '';
    setCategoryName(prefill);
    setApproveModal({ id: ticket._id });
  }, []);

  // ── Admin : confirmer l'approbation avec le nom de catégorie ─────────────
  const handleApprove = useCallback(async (e) => {
    e.preventDefault();
    if (!approveModal || !categoryName.trim()) return;
    setApproveLoading(true);
    try {
      await apiFetch(`/category-tickets/${approveModal.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done', admin_note: categoryName.trim() }),
      });
      setTickets(prev => prev.map(t =>
        t._id === approveModal.id
          ? { ...t, status: 'done', admin_note: categoryName.trim() }
          : t
      ));
      showToast(`Ticket approuvé — catégorie « ${categoryName.trim()} » créée.`, 'success');
      setApproveModal(null);
      setCategoryName('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'approbation.', 'danger');
    } finally {
      setApproveLoading(false);
    }
  }, [approveModal, categoryName]);

  // ── Manager : créer un ticket ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      const created = await apiFetch('/category-tickets', {
        method: 'POST',
        body: JSON.stringify({
          title:                  form.title.trim(),
          description:            form.description.trim() || undefined,
          proposed_category_name: form.proposed_category_name.trim() || undefined,
          scope:                  form.scope,
        }),
      });
      setTickets(prev => [created, ...prev]);
      showToast('Ticket créé avec succès.', 'success');
      setActiveModal(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setIsLoading(false);
    }
  };


  // ── Filtre par onglet ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeTab === 'all') return tickets;
    return tickets.filter(t => t.status === activeTab);
  }, [tickets, activeTab]);

  // ── Token spinner ──────────────────────────────────────────────────────────
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
          <h1 className="adm-title">Tickets de catégorie</h1>
          <p className="adm-subtitle">
            {isAdmin ? 'Demandes d\'ajout de catégories soumises par les utilisateurs' : 'Vos demandes d\'ajout de catégories'}
          </p>
        </div>
        <div className="adm-header-actions">
          {!isAdmin && (
            <button className="btn btn-primary" type="button"
              onClick={() => { setActiveModal('create'); setForm(EMPTY_FORM); setFormError(null); }}>
              <IconPlus size={16} className="me-2" />Nouveau ticket
            </button>
          )}
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map(tab => (
          <li className="nav-item" key={tab.key}>
            <button type="button" className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
              <span className="badge bg-secondary ms-1" style={{ fontSize: '0.625rem' }}>
                {tab.key === 'all' ? tickets.length : tickets.filter(t => t.status === tab.key).length}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"><span className="visually-hidden">Chargement…</span></div>
        </div>
      )}

      {!loading && (
        <div className="card d-none d-md-block">
          <div className="table-responsive">
            <table className="table card-table">
              <thead>
                <tr>
                  {isAdmin && <th>Utilisateur</th>}
                  <th>Date</th>
                  <th>Titre</th>
                  <th>Description</th>
                  <th>Scope</th>
                  <th>Statut</th>
                  {isAdmin && <th style={{ width: 1 }} />}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="text-center text-secondary py-4">
                      {tickets.length > 0 ? 'Aucun ticket dans cet onglet.' : 'Aucun ticket enregistré.'}
                    </td>
                  </tr>
                ) : filtered.map(ticket => (
                  <tr key={ticket._id}>
                    {isAdmin && (
                      <td>
                        <div className="fw-medium">{userName(ticket.user)}</div>
                        {ticket.user?.email && <div className="text-secondary" style={{ fontSize: 12 }}>{ticket.user.email}</div>}
                      </td>
                    )}
                    <td className="text-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div className="fw-medium">{ticket.title}</div>
                      {ticket.proposed_category_name && <div className="text-secondary" style={{ fontSize: 12 }}>Catégorie : {ticket.proposed_category_name}</div>}
                    </td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>{truncate(ticket.description) || '—'}</td>
                    <td><ScopeBadge scope={ticket.scope} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    {isAdmin && <td><TicketActions ticket={ticket} onStatusChange={handleStatusChange} onOpenApprove={openApprove} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && (
        <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-5-6z"/></svg></div>
              <p>{tickets.length > 0 ? 'Aucun ticket dans cet onglet.' : 'Aucun ticket enregistré.'}</p>
            </div>
          ) : filtered.map(ticket => (
            <div key={ticket._id} className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="fw-medium">{ticket.title}</div>
                  <StatusBadge status={ticket.status} />
                </div>
                {isAdmin && <div className="text-secondary mb-1" style={{ fontSize: 12 }}>{userName(ticket.user)}</div>}
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <ScopeBadge scope={ticket.scope} />
                  <span className="text-secondary" style={{ fontSize: 12 }}>
                    {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {ticket.proposed_category_name && <div className="text-secondary mb-1" style={{ fontSize: 12 }}>Catégorie : {ticket.proposed_category_name}</div>}
                {ticket.description && <div className="text-secondary mb-2" style={{ fontSize: 12 }}>{truncate(ticket.description)}</div>}
                {isAdmin && <TicketActions ticket={ticket} onStatusChange={handleStatusChange} onOpenApprove={openApprove} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal créer ticket (manager uniquement) ── */}
      <Modal
        open={activeModal === 'create'}
        title="Nouveau ticket de catégorie"
        subtitle="Demandez l'ajout d'une nouvelle catégorie d'habitude."
        onClose={() => setActiveModal(null)}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button"
              onClick={() => setActiveModal(null)} disabled={isLoading}>
              <i className="fa fa-times me-1" />Annuler
            </button>
            <button className="btn btn-primary" type="submit"
              form="form-create-ticket" disabled={isLoading}>
              {isLoading
                ? <i className="fa fa-spinner fa-spin me-1" />
                : <i className="fa fa-save me-1" />}
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
              <input className="form-control" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="ex: Méditation" required />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez votre besoin…" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Nom de catégorie proposé</label>
              <input className="form-control" value={form.proposed_category_name}
                onChange={e => setForm(f => ({ ...f, proposed_category_name: e.target.value }))}
                placeholder="ex: Bien-être mental" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Scope</label>
              <select className="form-select" value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}>
                <option value="personal">Personnel</option>
                <option value="team">Équipe</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
      {/* ── Modal approbation — saisir le nom de catégorie ── */}
      <Modal
        open={!!approveModal}
        title="Approuver le ticket"
        subtitle="Confirmez le nom de la catégorie qui sera créée pour l'utilisateur."
        onClose={() => { setApproveModal(null); setCategoryName(''); }}
        footer={
          <div className="d-flex justify-content-between w-100">
            <button className="btn btn-secondary" type="button"
              onClick={() => { setApproveModal(null); setCategoryName(''); }}
              disabled={approveLoading}>
              Annuler
            </button>
            <button className="btn btn-success" type="submit"
              form="form-approve-ticket" disabled={approveLoading || !categoryName.trim()}>
              {approveLoading
                ? <><i className="fa fa-spinner fa-spin me-1" />Approbation…</>
                : <><i className="fa fa-check me-1" />Confirmer et créer la catégorie</>}
            </button>
          </div>
        }
      >
        <form id="form-approve-ticket" onSubmit={handleApprove}>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Nom de la catégorie <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="ex: Méditation, Sport du matin…"
              required
              autoFocus
            />
            <div className="form-text">
              Ce nom sera ajouté aux catégories disponibles de l&apos;utilisateur.
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
