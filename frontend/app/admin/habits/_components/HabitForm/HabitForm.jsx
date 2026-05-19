'use client';
import React, { useMemo } from 'react';

import {
  HABIT_FREQUENCIES,
  HABIT_PRIORITIES,
  WEEK_DAYS,
  TIME_SLOTS,
} from '../../_constants';
import { useCategories } from '@/hooks/useCategories';

export const HabitForm = ({ formId, form, onChange, disabled }) => {
  const { categories, loading } = useCategories();
  const set = (field, value) => onChange({ ...form, [field]: value });

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.slug !== 'autre' || c.is_custom),
    [categories]
  );

  return (
    <form id={formId}>
      <div className="row g-3">

        <div className="col-12">
          <div className="rounded border bg-light p-3">
            <div className="small text-uppercase text-secondary mb-2 fw-semibold">Informations principales</div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  Titre <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  className="form-control"
                  value={form.nom || ''}
                  onChange={(e) => set('nom', e.target.value)}
                  required
                  disabled={disabled}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Catégorie <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.categorie || ''}
                  onChange={(e) => set('categorie', e.target.value)}
                  disabled={disabled || loading}
                  required
                >
                  <option value="" disabled>
                    {loading ? 'Chargement…' : 'Choisir une catégorie'}
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={2}
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
            disabled={disabled}
          />
        </div>

        {form.categorie === 'autre' && (
          <div className="col-12">
            <div className="rounded border border-warning-subtle bg-warning-subtle p-3">
              <div className="small text-uppercase text-warning-emphasis mb-2 fw-semibold">
                Demande d&apos;une nouvelle catégorie
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Nom de la nouvelle catégorie <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="Ex: Spiritualité, Bricolage, Lecture pro..."
                    value={form.categorie_autre_nom || ''}
                    onChange={(e) => set('categorie_autre_nom', e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Pourquoi cette catégorie ?</label>
                  <input
                    className="form-control"
                    placeholder="Contexte pour l'admin"
                    value={form.categorie_autre_description || ''}
                    onChange={(e) => set('categorie_autre_description', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-12">
          <div className="rounded border bg-light p-3">
            <div className="small text-uppercase text-secondary mb-2 fw-semibold">Planification</div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">
                  Fréquence <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.frequence || 'daily'}
                  onChange={(e) => set('frequence', e.target.value)}
                  disabled={disabled}
                >
                  {HABIT_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Priorité <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.priorite || 'medium'}
                  onChange={(e) => set('priorite', e.target.value)}
                  disabled={disabled}
                >
                  {HABIT_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Heure précise (optionnel)</label>
                <input
                  className="form-control"
                  type="time"
                  value={form.heure_precise || ''}
                  onChange={(e) => set('heure_precise', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Date de début</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.date_debut || ''}
                  onChange={(e) => set('date_debut', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        {form.frequence === 'specific_days' && (
          <div className="col-12">
            <label className="form-label d-block">
              Jours spécifiques <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <div className="d-flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => {
                const active = (form.jours_specifiques || []).includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      const cur = form.jours_specifiques || [];
                      set('jours_specifiques', active ? cur.filter((x) => x !== d) : [...cur, d]);
                    }}
                    disabled={disabled}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {form.frequence === 'times_per_week' && (
          <div className="col-md-4">
            <label className="form-label">
              Nombre de fois par semaine <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              className="form-control"
              type="number"
              min="1"
              max="7"
              value={form.fois_par_semaine || 1}
              onChange={(e) => set('fois_par_semaine', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
        )}

        <div className="col-12">
          <label className="form-label d-block">Horaires cibles (optionnel)</label>
          <div className="d-flex flex-wrap gap-2">
            {TIME_SLOTS.map((s) => {
              const active = (form.horaires_cibles || []).includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${active ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => {
                    const cur = form.horaires_cibles || [];
                    set('horaires_cibles', active ? cur.filter((x) => x !== s) : [...cur, s]);
                  }}
                  disabled={disabled}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Objectif (optionnel)</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Ex: Faire 10 000 pas par jour, Lire 20 pages"
            value={form.objectif_quantifiable || ''}
            onChange={(e) => set('objectif_quantifiable', e.target.value)}
            disabled={disabled}
          />
        </div>

      </div>
    </form>
  );
};
