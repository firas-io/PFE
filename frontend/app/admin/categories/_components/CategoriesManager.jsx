'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { IconEdit, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Modal }    from '@/components/Modal';
import { showToast } from '@/lib/adminToast';

const LAYOUT_OPTIONS = [
  { value: 'default',      label: 'Défaut' },
  { value: 'sport',        label: 'Sport' },
  { value: 'study',        label: 'Étude' },
  { value: 'wellness',     label: 'Bien-être' },
  { value: 'productivity', label: 'Productivité' },
  { value: 'health',       label: 'Santé' },
  { value: 'finance',      label: 'Finance' },
  { value: 'social',       label: 'Social' },
  { value: 'creativity',   label: 'Créativité' },
];

const EMPTY_FORM = {
  label:       '',
  icon:        'Circle',
  color:       '#6b7280',
  layout:      'default',
  description: '',
  is_active:   true,
};

function ColorSwatch({ color, icon }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 6,
        background: color || '#6b7280', flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
        {(icon || '?')[0].toUpperCase()}
      </span>
    </span>
  );
}

export function CategoriesManager() {
  const [token,       setToken]       = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData,   setModalData]   = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editForm,    setEditForm]    = useState(EMPTY_FORM);

  useEffect(() => { setToken(getToken()); }, []);

  useEffect(() => {
    if (modalData) {
      setEditForm({
        label:       modalData.label       ?? '',
        icon:        modalData.icon        ?? 'Circle',
        color:       modalData.color       ?? '#6b7280',
        layout:      modalData.layout      ?? 'default',
        description: modalData.description ?? '',
        is_active:   modalData.is_active   ?? true,
      });
    }
  }, [modalData]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des catégories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  // ── Créer ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await apiFetch('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setCategories(prev => [...prev, created]);
      setForm(EMPTY_FORM);
      showToast('Catégorie créée avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Modifier ──────────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!modalData) return;
    setIsLoading(true);
    try {
      const updated = await apiFetch(`/admin/categories/${modalData._id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setCategories(prev => prev.map(c => c._id === modalData._id ? updated : c));
      setActiveModal(null);
      setModalData(null);
      showToast('Catégorie modifiée avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la modification.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await apiFetch(`/admin/categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c._id !== id));
      showToast('Catégorie supprimée.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'danger');
    }
  };

  // ── Toggle actif/inactif ──────────────────────────────────────────────────
  const handleToggle = async (cat) => {
    try {
      const updated = await apiFetch(`/admin/categories/${cat._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      setCategories(prev => prev.map(c => c._id === cat._id ? updated : c));
      showToast(`Catégorie ${updated.is_active ? 'activée' : 'désactivée'}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur.', 'danger');
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
          <h1 className="adm-title">Catégories</h1>
          <p className="adm-subtitle">{categories.length} catégorie{categories.length !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Layout 2 colonnes ── */}
      <div className="row g-3">

        {/* ── Formulaire ajout (col droite sur desktop) ── */}
        <div className="col-12 col-md-4 order-1 order-md-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <IconPlus size={16} className="me-1" />
                Ajouter une catégorie
              </h3>
            </div>
            <div className="card-body">
              <form id="form-add-category" onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label">Label <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    placeholder="ex: Méditation"
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Icône <span className="text-secondary small">(nom Lucide)</span></label>
                  <input
                    className="form-control"
                    placeholder="ex: Dumbbell, Heart, BookOpen"
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  />
                  <div className="form-text">
                    Voir les icônes sur{' '}
                    <span className="text-primary">lucide.dev</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Couleur</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      style={{ width: 48, height: 36, padding: 2 }}
                    />
                    <input
                      className="form-control form-control-sm"
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      placeholder="#6b7280"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Layout</label>
                  <select
                    className="form-select"
                    value={form.layout}
                    onChange={e => setForm(f => ({ ...f, layout: e.target.value }))}
                  >
                    {LAYOUT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez brièvement cette catégorie…"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                  {isLoading
                    ? <span className="spinner-border spinner-border-sm me-1" role="status" />
                    : <IconPlus size={16} className="me-1" />}
                  Ajouter
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Table (col gauche sur desktop) ── */}
        <div className="col-12 col-md-8 order-2 order-md-1">

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
                      <th>Catégorie</th>
                      <th>Layout</th>
                      <th>Champs</th>
                      <th>Statut</th>
                      <th style={{ width: 1 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-secondary py-4">Aucune catégorie enregistrée.</td>
                      </tr>
                    ) : categories.map(cat => (
                      <tr key={cat._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ColorSwatch color={cat.color} icon={cat.icon} />
                            <div>
                              <div className="fw-medium">{cat.label}</div>
                              <div className="text-secondary" style={{ fontSize: 12 }}>{cat.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary" style={{ fontSize: 13 }}>{cat.layout || '—'}</td>
                        <td className="text-secondary" style={{ fontSize: 13 }}>
                          {cat.fields?.length ?? 0} champ{(cat.fields?.length ?? 0) !== 1 ? 's' : ''}
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {cat.is_default && <span className="adm-status adm-status--review">Défaut</span>}
                            <button
                              type="button"
                              className={`adm-status border-0 ${cat.is_active ? 'adm-status--active' : 'adm-status--inactive'}`}
                              style={{ cursor: 'pointer' }}
                              title={cat.is_active ? 'Désactiver' : 'Activer'}
                              onClick={() => handleToggle(cat)}
                            >
                              {cat.is_active ? 'Actif' : 'Inactif'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="adm-actions">
                            <button className="adm-btn-icon" type="button" title="Modifier" onClick={() => { setModalData(cat); setActiveModal('edit'); }}>
                              <IconEdit size={15} />
                            </button>
                            {!cat.is_default && (
                              <button className="adm-btn-icon adm-btn-icon--danger" type="button" title="Supprimer" onClick={() => handleDelete(cat._id)}>
                                <IconTrash size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && (
            <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
                  <p>Aucune catégorie enregistrée.</p>
                </div>
              ) : categories.map(cat => (
                <div key={cat._id} className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <ColorSwatch color={cat.color} icon={cat.icon} />
                        <div>
                          <div className="fw-medium">{cat.label}</div>
                          <div className="text-secondary" style={{ fontSize: 12 }}>{cat.slug}</div>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        {cat.is_default && <span className="adm-status adm-status--review">Défaut</span>}
                        <button
                          type="button"
                          className={`adm-status border-0 ${cat.is_active ? 'adm-status--active' : 'adm-status--inactive'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggle(cat)}
                        >
                          {cat.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </div>
                    </div>
                    <div className="text-secondary mb-2" style={{ fontSize: 12 }}>
                      {cat.layout} · {cat.fields?.length ?? 0} champ{(cat.fields?.length ?? 0) !== 1 ? 's' : ''}
                    </div>
                    <div className="adm-actions">
                      <button className="adm-btn-icon" type="button" onClick={() => { setModalData(cat); setActiveModal('edit'); }}>
                        <IconEdit size={15} />
                      </button>
                      {!cat.is_default && (
                        <button className="adm-btn-icon adm-btn-icon--danger" type="button" onClick={() => handleDelete(cat._id)}>
                          <IconTrash size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal modification ── */}
      <Modal
        open={activeModal === 'edit'}
        title="Modifier la catégorie"
        onClose={() => { setActiveModal(null); setModalData(null); }}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => { setActiveModal(null); setModalData(null); }}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button className="btn btn-primary" type="submit" form="form-edit-category" disabled={isLoading}>
              {isLoading
                ? <span className="spinner-border spinner-border-sm me-1" role="status" />
                : null}
              Enregistrer
            </button>
          </div>
        }
      >
        <form id="form-edit-category" onSubmit={handleEdit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Label <span className="text-danger">*</span></label>
              <input
                className="form-control"
                value={editForm.label}
                onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Icône <span className="text-secondary small">(nom Lucide)</span></label>
              <input
                className="form-control"
                value={editForm.icon}
                onChange={e => setEditForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="ex: Dumbbell"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Couleur</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={editForm.color}
                  onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 48, height: 36, padding: 2 }}
                />
                <input
                  className="form-control form-control-sm"
                  value={editForm.color}
                  onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Layout</label>
              <select
                className="form-select"
                value={editForm.layout}
                onChange={e => setEditForm(f => ({ ...f, layout: e.target.value }))}
              >
                {LAYOUT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={editForm.is_active ? 'active' : 'inactive'}
                onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
