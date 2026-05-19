'use client';
import React, { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { HabitForm } from '../HabitForm/HabitForm';

const EMPTY_FORM = {
  nom: '',
  description: '',
  categorie: 'autre',
  categorie_autre_nom: '',
  categorie_autre_description: '',
  frequence: 'daily',
  priorite: 'medium',
  heure_precise: '',
  date_debut: '',
  jours_specifiques: [],
  fois_par_semaine: 1,
  horaires_cibles: [],
  objectif_quantifiable: '',
  visible_pour_tous: false,
};

function toDateInput(value) {
  if (!value) return '';
  try { return new Date(value).toISOString().slice(0, 10); } catch { return ''; }
}

export const UpdateHabitModal = ({ show, onHide, onSuccess, selectedHabit }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && selectedHabit) {
      setForm({
        nom:                      selectedHabit.nom || '',
        description:              selectedHabit.description || '',
        categorie:                selectedHabit.categorie || 'autre',
        categorie_autre_nom:      selectedHabit.categorie_label || '',
        categorie_autre_description: '',
        frequence:                selectedHabit.frequence || 'daily',
        priorite:                 selectedHabit.priorite || 'medium',
        heure_precise:            selectedHabit.heure_precise || '',
        date_debut:               toDateInput(selectedHabit.date_debut),
        jours_specifiques:        selectedHabit.jours_specifiques || [],
        fois_par_semaine:         selectedHabit.fois_par_semaine || 1,
        horaires_cibles:          selectedHabit.horaires_cibles || [],
        objectif_quantifiable:    selectedHabit.objectif_detail || '',
        visible_pour_tous:        selectedHabit.visible_pour_tous ?? false,
      });
    }
    if (!show) setError(null);
  }, [show, selectedHabit]);

  const handleSubmit = async () => {
    if (!selectedHabit) return;
    if (!form.nom.trim()) { setError("Le nom de l'habitude est requis"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nom:             form.nom,
        description:     form.description,
        categorie:       form.categorie,
        categorie_label: form.categorie === 'autre' && form.categorie_autre_nom?.trim()
          ? form.categorie_autre_nom.trim()
          : undefined,
        frequence:        form.frequence,
        priorite:         form.priorite,
        heure_precise:    form.heure_precise || undefined,
        jours_specifiques: form.frequence === 'specific_days' && form.jours_specifiques?.length
          ? form.jours_specifiques : undefined,
        fois_par_semaine: form.frequence === 'times_per_week'
          ? form.fois_par_semaine : undefined,
        horaires_cibles:  form.horaires_cibles?.length ? form.horaires_cibles : undefined,
        objectif_detail:  form.objectif_quantifiable || undefined,
        visible_pour_tous: form.visible_pour_tous,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;

      await apiFetch(`/habits/${selectedHabit._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Modifier une habitude"
      onClose={onHide}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={saving}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.nom.trim()}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Enregistrement...</>
              : 'Enregistrer'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <HabitForm
        formId="update-habit-form"
        form={form}
        onChange={setForm}
        disabled={saving}
      />
    </Modal>
  );
};
