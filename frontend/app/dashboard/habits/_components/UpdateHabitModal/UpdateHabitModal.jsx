'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { HabitForm } from '../HabitForm';
import { EMPTY_HABIT_FORM } from '../../_constants';
import { apiFetch } from '@/lib/api';

export const UpdateHabitModal = ({ show, habit, onClose, onSuccess, allowedCategories }) => {
  const [form, setForm] = useState(EMPTY_HABIT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && habit) {
      setForm({
        nom: habit.nom ?? '',
        description: habit.description ?? '',
        categorie: habit.categorie ?? 'autre',
        categorie_autre_nom: habit.categorie_label ?? '',
        categorie_autre_description: '',
        categorie_champs: habit.categorie_champs && typeof habit.categorie_champs === 'object' ? { ...habit.categorie_champs } : {},
        frequence: habit.frequence ?? 'daily',
        priorite: habit.priorite ?? 'medium',
        objectif_detail: habit.objectif_detail ?? '',
        visible_pour_tous: habit.visible_pour_tous === true,
        note: habit.note ?? '',
        date_debut: habit.date_debut ?? '',
        dates_specifiques: [],
      });
      setError(null);
    }
  }, [show, habit]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
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
        visible_pour_tous: form.visible_pour_tous,
        note: form.note,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;
      if (form.dates_specifiques?.length) payload.dates_specifiques = form.dates_specifiques;

      await apiFetch(`/habits/${habit._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Modifier l'habitude"
      onClose={handleClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={saving}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.nom.trim()}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Sauvegarde...</>
              : 'Enregistrer'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <HabitForm formId="update-habit" form={form} onChange={setForm} disabled={saving} allowedCategories={allowedCategories} />
    </Modal>
  );
};
