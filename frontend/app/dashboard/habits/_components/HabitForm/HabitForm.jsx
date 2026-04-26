'use client';
import React, { useMemo } from 'react';
import { HABIT_FREQUENCIES, HABIT_PRIORITIES } from '../../_constants';
import { useCategories } from '@/hooks/useCategories';
import { CategorySelector } from '@/components/habits/CategorySelector';
import { DynamicFields } from '@/components/habits/DynamicFields';

export const HabitForm = ({ formId, form, onChange, disabled, allowedCategories }) => {
  const { categories, loading, error, getBySlug } = useCategories();

  // Restrict to user's onboarding categories when provided.
  // Always keep the current habit's category visible (e.g. when editing an older habit).
  const visibleCategories = useMemo(() => {
    if (!allowedCategories || allowedCategories.length === 0) return categories;
    const allowed = new Set(allowedCategories);
    if (form.categorie) allowed.add(form.categorie);
    return categories.filter((c) => allowed.has(c.slug));
  }, [categories, allowedCategories, form.categorie]);

  const set = (patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'categorie') && patch.categorie !== form.categorie) {
      onChange({ ...form, ...patch, categorie_champs: {} });
      return;
    }
    onChange({ ...form, ...patch });
  };

  const selected = getBySlug(form.categorie);

  return (
    <form id={formId}>
      <div className="mb-3">
        <label htmlFor={`${formId}-nom`} className="form-label">Nom de l'habitude *</label>
        <input
          id={`${formId}-nom`}
          type="text"
          className="form-control"
          value={form.nom}
          onChange={(e) => set({ nom: e.target.value })}
          placeholder="Ex: Faire du sport"
          required
          disabled={disabled}
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`${formId}-description`} className="form-label">Description</label>
        <textarea
          id={`${formId}-description`}
          className="form-control"
          rows={3}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Description optionnelle de votre habitude"
          disabled={disabled}
        />
      </div>

      <div className="mb-3">
        <span id={`${formId}-cat-label`} className="form-label d-block">Catégorie</span>
        <CategorySelector
          categories={visibleCategories}
          value={form.categorie}
          onChange={(slug) => set({ categorie: slug })}
          disabled={disabled}
          loading={loading}
          error={error}
          aria-labelledby={`${formId}-cat-label`}
        />
      </div>

      {form.categorie === 'autre' && (
        <div className="mb-3 rounded border border-warning-subtle bg-warning-subtle p-3">
          <label htmlFor={`${formId}-cat-other`} className="form-label">
            Proposer une nouvelle catégorie
          </label>
          <input
            id={`${formId}-cat-other`}
            type="text"
            className="form-control mb-2"
            value={form.categorie_autre_nom || ''}
            onChange={(e) => set({ categorie_autre_nom: e.target.value })}
            placeholder="Ex: Spiritualité, Bricolage, Lecture pro..."
            disabled={disabled}
          />
          <textarea
            className="form-control"
            rows={2}
            value={form.categorie_autre_description || ''}
            onChange={(e) => set({ categorie_autre_description: e.target.value })}
            placeholder="Expliquez brièvement votre besoin (optionnel)"
            disabled={disabled}
          />
          <small className="text-secondary d-block mt-2">
            Un ticket sera créé automatiquement. Si l&apos;admin valide, votre catégorie sera affichée
            avec le template par défaut de la catégorie <strong>Autre</strong>.
          </small>
        </div>
      )}

      {(selected || form.categorie) && (
        <div className="mb-3">
          <span className="form-label d-block">Détails (catégorie)</span>
          <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
            <DynamicFields
              categorySlug={form.categorie}
              fields={selected?.fields}
              values={form.categorie_champs || {}}
              onChange={(next) => set({ categorie_champs: next })}
              disabled={disabled}
              formIdPrefix={formId}
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <label htmlFor={`${formId}-frequence`} className="form-label">Fréquence</label>
        <select
          id={`${formId}-frequence`}
          className="form-select"
          value={form.frequence}
          onChange={(e) => set({ frequence: e.target.value })}
          disabled={disabled}
        >
          {HABIT_FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor={`${formId}-priorite`} className="form-label">Priorité</label>
        <select
          id={`${formId}-priorite`}
          className="form-select"
          value={form.priorite}
          onChange={(e) => set({ priorite: e.target.value })}
          disabled={disabled}
        >
          {HABIT_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor={`${formId}-objectif`} className="form-label">Objectif détaillé</label>
        <input
          id={`${formId}-objectif`}
          type="text"
          className="form-control"
          value={form.objectif_detail}
          onChange={(e) => set({ objectif_detail: e.target.value })}
          placeholder="Ex: 30 minutes par jour"
          disabled={disabled}
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`${formId}-note`} className="form-label">Note</label>
        <textarea
          id={`${formId}-note`}
          className="form-control"
          rows={3}
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="Ajouter une note personnelle sur cette habitude..."
          disabled={disabled}
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`${formId}-date_debut`} className="form-label">Date de début</label>
        <input
          id={`${formId}-date_debut`}
          type="date"
          className="form-control"
          value={form.date_debut || ''}
          onChange={(e) => set({ date_debut: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Dates spécifiques (optionnel)</label>
        <small className="text-secondary d-block mb-2">Sélectionnez les dates où cette habitude doit être effectuée</small>
        <input
          type="date"
          className="form-control mb-2"
          disabled={disabled}
          onChange={(e) => {
            const d = e.target.value;
            if (!d) return;
            const next = Array.from(new Set([...(form.dates_specifiques || []), d]));
            set({ dates_specifiques: next });
          }}
        />
        {form.dates_specifiques && form.dates_specifiques.length > 0 && (
          <div className="d-flex flex-wrap gap-2">
            {form.dates_specifiques.map((date, idx) => (
              <span key={`${date}-${idx}`} className="badge bg-primary p-2">
                {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR')}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: '0.65rem' }}
                  disabled={disabled}
                  onClick={() => {
                    const filtered = form.dates_specifiques.filter((_, i) => i !== idx);
                    set({ dates_specifiques: filtered });
                  }}
                  aria-label="Retirer"
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};
