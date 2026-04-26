'use client';
import React, { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { HabitForm } from '@/app/dashboard/habits/_components/HabitForm';
import { EMPTY_HABIT_FORM } from '@/app/dashboard/habits/_constants';

export const UpdateHabitModal = ({ show, onHide, onSuccess, selectedHabit }) => {
  const [form, setForm] = useState(EMPTY_HABIT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && selectedHabit) {
      setForm({
        nom: selectedHabit.nom || '',
        description: selectedHabit.description || '',
        categorie: selectedHabit.categorie || 'autre',
        categorie_champs: selectedHabit.categorie_champs || {},
        categorie_autre_nom: selectedHabit.categorie_label || '',
        categorie_autre_description: '',
        frequence: selectedHabit.frequence || 'daily',
        priorite: selectedHabit.priorite || 'medium',
        objectif_detail: selectedHabit.objectif_detail || '',
        note: selectedHabit.note || '',
        date_debut: selectedHabit.date_debut || '',
        dates_specifiques: selectedHabit.dates_specifiques || [],
      });
    }
    if (!show) setError(null);
  }, [show, selectedHabit]);

  const handleSubmit = async () => {
    if (!selectedHabit) return;
    if (!form.nom.trim()) {
      setError("Le nom de l'habitude est requis");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nom: form.nom,
        description: form.description,
        categorie: form.categorie,
        categorie_champs: form.categorie_champs || {},
        categorie_label:
          form.categorie === 'autre' && form.categorie_autre_nom?.trim()
            ? form.categorie_autre_nom.trim()
            : undefined,
        frequence: form.frequence,
        priorite: form.priorite,
        objectif_detail: form.objectif_detail,
        note: form.note,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;
      if (form.dates_specifiques?.length) payload.dates_specifiques = form.dates_specifiques;
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
