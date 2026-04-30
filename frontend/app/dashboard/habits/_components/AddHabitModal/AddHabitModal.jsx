'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { HabitForm } from '../HabitForm';
import { EMPTY_HABIT_FORM } from '../../_constants';
import { apiFetch } from '@/lib/api';

const STEPS = ['Informations', 'Catégorie', 'Détails'];

export const AddHabitModal = ({ show, onClose, onSuccess, allowedCategories }) => {
  const defaultCategory = allowedCategories?.length > 0 ? allowedCategories[0] : EMPTY_HABIT_FORM.categorie;
  const [form, setForm] = useState({ ...EMPTY_HABIT_FORM, categorie: defaultCategory });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState(null);

  const handleClose = () => {
    setForm({ ...EMPTY_HABIT_FORM, categorie: defaultCategory });
    setError(null);
    setStepError(null);
    setCurrentStep(0);
    onClose();
  };

  const nextStep = () => {
    setStepError(null);
    if (currentStep === 0) {
      if (!form.nom || form.nom.trim() === '') {
        setStepError("Le nom de l'habitude est requis");
        return;
      }
    }
    if (currentStep === 1) {
      if (!form.categorie) {
        setStepError('Veuillez sélectionner une catégorie');
        return;
      }
    }
    setCurrentStep(s => Math.min(s + 1, 2));
  };

  const prevStep = () => {
    setStepError(null);
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      setError("Le nom de l'habitude est requis");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Reuse existing ticket if user selected an already-approved custom category
      let createdTicketId = form.categorie_ticket_id || undefined;
      if (form.categorie === 'autre' && form.categorie_autre_nom?.trim() && !form.categorie_ticket_id) {
        // New custom category request — create a pending ticket
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
        categorie_label: form.categorie === 'autre'
          ? (form.categorie_label || form.categorie_autre_nom?.trim() || undefined)
          : undefined,
        categorie_ticket_id: createdTicketId,
        frequence: form.frequence,
        priorite: form.priorite,
        objectif_detail: form.objectif_detail,
        visible_pour_tous: form.visible_pour_tous,
        note: form.note,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;
      if (form.dates_specifiques?.length) payload.dates_specifiques = form.dates_specifiques;

      await apiFetch('/habits', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: 11, color: '#888' }}>
            Étape {currentStep + 1} sur 3
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={saving}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '0.5px solid #ccc', background: 'transparent', cursor: 'pointer' }}
              >
                Précédent
              </button>
            )}
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={saving}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, background: '#534AB7', color: '#EEEDFE', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Suivant →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !form.nom.trim()}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, background: '#534AB7', color: '#EEEDFE', border: 'none', cursor: saving || !form.nom.trim() ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving || !form.nom.trim() ? 0.6 : 1 }}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Création...</>
                  : "Créer l'habitude"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Stepper indicator */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '0.5px solid var(--color-border, #e5e5e5)', margin: '-1rem -1rem 1rem -1rem' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currentStep > i ? '#EAF3DE' : currentStep === i ? '#534AB7' : 'transparent',
                color: currentStep > i ? '#27500A' : currentStep === i ? '#EEEDFE' : '#888',
                border: `0.5px solid ${currentStep > i ? '#639922' : currentStep === i ? '#534AB7' : '#ccc'}`,
              }}>
                {currentStep > i ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: currentStep === i ? '#534AB7' : '#888', fontWeight: currentStep === i ? 500 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 0.5, background: '#e5e5e5', marginBottom: 16 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {(error || stepError) && (
        <div className="alert alert-danger mb-3">{stepError || error}</div>
      )}

      <HabitForm
        formId="add-habit"
        form={form}
        onChange={setForm}
        disabled={saving}
        allowedCategories={allowedCategories}
        currentStep={currentStep}
      />
    </Modal>
  );
};
