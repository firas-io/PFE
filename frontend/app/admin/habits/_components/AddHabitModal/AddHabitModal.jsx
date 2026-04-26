'use client';
import React, { useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { HabitForm } from '@/app/dashboard/habits/_components/HabitForm';
import { EMPTY_HABIT_FORM } from '@/app/dashboard/habits/_constants';

export const AddHabitModal = ({ show, onHide, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_HABIT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setForm(EMPTY_HABIT_FORM);
    setError(null);
    onHide();
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      setError("Le nom de l'habitude est requis");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let createdTicketId;
      if (form.categorie === 'autre' && form.categorie_autre_nom?.trim()) {
        const ticket = await apiFetch('/category-tickets', {
          method: 'POST',
          body: JSON.stringify({
            title: `Nouvelle catégorie demandée: ${form.categorie_autre_nom.trim()}`,
            description: form.categorie_autre_description?.trim() || undefined,
            proposed_category_name: form.categorie_autre_nom.trim(),
          }),
        });
        createdTicketId = ticket?._id;
      }

      const payload = {
        nom: form.nom,
        description: form.description,
        categorie: form.categorie,
        categorie_champs: form.categorie_champs || {},
        categorie_label:
          form.categorie === 'autre' && form.categorie_autre_nom?.trim()
            ? form.categorie_autre_nom.trim()
            : undefined,
        categorie_ticket_id: createdTicketId,
        frequence: form.frequence,
        priorite: form.priorite,
        objectif_detail: form.objectif_detail,
        visible_pour_tous: true,
        note: form.note,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;
      if (form.dates_specifiques?.length) payload.dates_specifiques = form.dates_specifiques;

      await apiFetch('/habits', { method: 'POST', body: JSON.stringify(payload) });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Créer une nouvelle habitude"
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
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Création...</>
              : "Créer l'habitude"}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <HabitForm
        formId="add-habit-form"
        form={form}
        onChange={setForm}
        disabled={saving}
      />
    </Modal>
  );
};
