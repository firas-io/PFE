'use client';
import React, { useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { UserForm } from '../UserForm';

const EMPTY_FORM = { nom: '', prenom: '', email: '', mot_de_passe: '', departement: '', roleNom: '' };

export const AddUserModal = ({ show, onHide, onSuccess, roles }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleNom) { setError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch('/users/admin', {
        method: 'POST',
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          mot_de_passe: form.mot_de_passe,
          roleNom: form.roleNom,
          departement: form.departement.trim() || '',
        }),
      });
      setForm(EMPTY_FORM);
      onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Créer un utilisateur"
      subtitle="L'admin choisit le rôle."
      onClose={onHide}
      size="lg"
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button className="btn btn-primary" type="submit" form="add-user-form" disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-save me-1"></i>}
            Créer
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <UserForm
        formId="add-user-form"
        form={form}
        onChange={onChange}
        onSubmit={handleSubmit}
        roles={roles}
        showPassword
      />
    </Modal>
  );
};
