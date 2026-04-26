'use client';
import React, { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { ManagerForm } from '../ManagerForm';

export const UpdateManagerModal = ({ show, onHide, onSuccess, selectedManager }) => {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', departement: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (show && selectedManager) {
      setForm({
        nom:         selectedManager.nom         || '',
        prenom:      selectedManager.prenom      || '',
        email:       selectedManager.email       || '',
        departement: selectedManager.departement || '',
      });
    }
    if (!show) setError(null);
  }, [show, selectedManager]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedManager) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/managers/${selectedManager._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nom:         form.nom.trim(),
          prenom:      form.prenom.trim(),
          email:       form.email.trim(),
          departement: form.departement.trim() || '',
        }),
      });
      onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      title="Modifier le manager"
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1" />
            Annuler
          </button>
          <button className="btn btn-primary" type="submit" form="update-manager-form" disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1" /> : <i className="fa fa-save me-1" />}
            Enregistrer
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <ManagerForm
        formId="update-manager-form"
        form={form}
        onChange={onChange}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
