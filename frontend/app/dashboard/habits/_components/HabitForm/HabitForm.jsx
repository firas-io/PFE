'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { HABIT_FREQUENCIES, HABIT_PRIORITIES } from '../../_constants';
import { useCategories } from '@/hooks/useCategories';
import { DynamicFields } from '@/components/habits/DynamicFields';
import { resolveLucideIcon } from '@/components/habits/resolveLucideIcon';

export const HabitForm = ({ formId, form, onChange, disabled, allowedCategories, currentStep = null }) => {
  const stepMode = currentStep !== null;
  const { categories, loading, error, getBySlug } = useCategories();
  const [cols, setCols] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 3
  );

  useEffect(() => {
    const handler = () => setCols(window.innerWidth < 640 ? 2 : 3);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // All active categories from API (incl. admin-created). Hide template "autre" only.
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.slug !== 'autre' || c.is_custom),
    [categories]
  );

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

      {/* ── Étape 1 — Informations ─────────────────────────────────────────── */}
      {(!stepMode || currentStep === 0) && (
        <>
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
            <label htmlFor={`${formId}-description`} className="form-label">Description *</label>
            <textarea
              id={`${formId}-description`}
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Décrivez le pourquoi et le comment de votre habitude"
              required
              disabled={disabled}
            />
          </div>
        </>
      )}

      {/* ── Étape 2 — Catégorie ────────────────────────────────────────────── */}
      {(!stepMode || currentStep === 1) && (
        <>
          {/* Grille des catégories */}
          {loading && categories.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginBottom: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 72, borderRadius: 8, background: '#f0f0f0' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginBottom: 12 }}>
              {visibleCategories.map(cat => {
                const Icon = resolveLucideIcon(cat.icon);
                // Custom category: selected when categorie="autre" AND ticket_id matches
                // Normal category: selected when categorie matches the slug directly
                const isSelected = cat.is_custom
                  ? form.categorie === 'autre' && form.categorie_ticket_id === cat.slug
                  : form.categorie === cat.slug && !form.categorie_ticket_id;
                return (
                  <div
                    key={cat.slug}
                    onClick={() => {
                      if (!disabled) {
                        if (cat.is_custom) {
                          // Existing approved category — reuse ticket, don't create a new one
                          set({ categorie: 'autre', categorie_ticket_id: cat.slug, categorie_label: cat.label, categorie_autre_nom: cat.label });
                        } else {
                          set({ categorie: cat.slug, categorie_ticket_id: undefined, categorie_label: undefined });
                        }
                      }
                    }}
                    style={{
                      border: isSelected ? '1.5px solid #534AB7' : '0.5px solid var(--color-border, #e5e5e5)',
                      borderRadius: 8,
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: disabled ? 'default' : 'pointer',
                      background: isSelected ? '#EEEDFE' : 'transparent',
                      transition: 'border-color .15s, background .15s',
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6, background: cat.color,
                      }}>
                        <Icon style={{ width: 14, height: 14, color: '#fff' }} aria-hidden />
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: isSelected ? '#3C3489' : 'inherit' }}>
                      {cat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DynamicFields pour la catégorie sélectionnée */}
          {(selected || form.categorie) && (
            <div className="mb-3">
              <span className="form-label d-block">Détails (catégorie)</span>
              <div className="rounded-3 border border-border/50 bg-muted/10 p-3">
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

        </>
      )}

      {/* ── Étape 3 — Détails ─────────────────────────────────────────────── */}
      {(!stepMode || currentStep === 2) && (
        <>
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
            <label className="form-label">Dates spécifiques</label>
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
        </>
      )}

    </form>
  );
};
