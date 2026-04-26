'use client';
import React from 'react';

import {
  HABIT_CATEGORIES,
  HABIT_FREQUENCIES,
  HABIT_PRIORITIES,
  WEEK_DAYS,
  TIME_SLOTS,
} from '../../_constants';
import { HabitVisibilitySection } from '../HabitVisibilitySection';

export const HabitForm = ({ formId, form, setForm, onSubmit, loading }) => {
  return (
    <form id={formId} onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-12">
          <div className="rounded border bg-light p-3">
            <div className="small text-uppercase text-secondary mb-2 fw-semibold">Informations principales</div>
            <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Titre</label>
          <input
            className="form-control"
            value={form.nom}
            onChange={(e) => setForm('nom', e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Catégorie</label>
          <select
            className="form-select"
            value={form.categorie}
            onChange={(e) => setForm('categorie', e.target.value)}
          >
            {HABIT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
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
            value={form.description}
            onChange={(e) => setForm('description', e.target.value)}
          />
        </div>

        {form.categorie === 'autre' && (
          <div className="col-12">
            <div className="rounded border border-warning-subtle bg-warning-subtle p-3">
              <div className="small text-uppercase text-warning-emphasis mb-2 fw-semibold">
                Demande d'une nouvelle catégorie
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom de la nouvelle catégorie</label>
                  <input
                    className="form-control"
                    placeholder="Ex: Spiritualité, Bricolage, Lecture pro..."
                    value={form.categorie_autre_nom || ''}
                    onChange={(e) => setForm('categorie_autre_nom', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Pourquoi cette catégorie ?</label>
                  <input
                    className="form-control"
                    placeholder="Contexte pour l'admin"
                    value={form.categorie_autre_description || ''}
                    onChange={(e) => setForm('categorie_autre_description', e.target.value)}
                  />
                </div>
              </div>
              <div className="small text-secondary mt-2">
                Si vous renseignez un nom, un ticket sera créé automatiquement. Après validation admin,
                le nom sera utilisé avec le template par défaut de la catégorie <strong>Autre</strong>.
              </div>
            </div>
          </div>
        )}

        <HabitVisibilitySection
          idPrefix={formId}
          visiblePourTous={form.visible_pour_tous}
          setVisiblePourTous={(v) => setForm('visible_pour_tous', v)}
        />

        <div className="col-12">
          <div className="rounded border bg-light p-3">
            <div className="small text-uppercase text-secondary mb-2 fw-semibold">Planification</div>
            <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Fréquence</label>
          <select
            className="form-select"
            value={form.frequence}
            onChange={(e) => setForm('frequence', e.target.value)}
          >
            {HABIT_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Priorité</label>
          <select
            className="form-select"
            value={form.priorite}
            onChange={(e) => setForm('priorite', e.target.value)}
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
            value={form.heure_precise}
            onChange={(e) => setForm('heure_precise', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Date de début</label>
          <input
            className="form-control"
            type="date"
            value={form.date_debut}
            onChange={(e) => setForm('date_debut', e.target.value)}
          />
        </div>
            </div>
          </div>
        </div>

        {form.frequence === 'specific_days' && (
          <div className="col-12">
            <label className="form-label d-block">Jours spécifiques</label>
            <div className="d-flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`btn btn-sm ${form.jours_specifiques.includes(d) ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => {
                    const next = form.jours_specifiques.includes(d)
                      ? form.jours_specifiques.filter((x) => x !== d)
                      : [...form.jours_specifiques, d];
                    setForm('jours_specifiques', next);
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.frequence === 'times_per_week' && (
          <div className="col-md-4">
            <label className="form-label">Nombre de fois par semaine</label>
            <input
              className="form-control"
              type="number"
              min="1"
              max="7"
              value={form.fois_par_semaine}
              onChange={(e) => setForm('fois_par_semaine', e.target.value)}
            />
          </div>
        )}

        <div className="col-12">
          <label className="form-label d-block">Horaires cibles (optionnel)</label>
          <div className="d-flex flex-wrap gap-2">
            {TIME_SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn-sm ${form.horaires_cibles.includes(s) ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => {
                  const next = form.horaires_cibles.includes(s)
                    ? form.horaires_cibles.filter((x) => x !== s)
                    : [...form.horaires_cibles, s];
                  setForm('horaires_cibles', next);
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Objectif quantifiable (optionnel)</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Ex: Faire 10000 pas par jour, Lire 20 pages"
            value={form.objectif_quantifiable}
            onChange={(e) => setForm('objectif_quantifiable', e.target.value)}
          />
        </div>
      </div>
    </form>
  );
};
