'use client';
import React, { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { userFirstName, userLastName } from '@/lib/userDisplay';
import { Modal } from '@/components/Modal';

export const UpdateRoleModal = ({ show, onHide, onSuccess, selectedUser, roles }) => {
  const [roleNom, setRoleNom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && selectedUser) setRoleNom(selectedUser.role?.nom || '');
    if (!show) setError(null);
  }, [show, selectedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !roleNom) { setError('Veuillez sélectionner un rôle.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/users/${selectedUser._id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleNom }),
      });
      onSuccess();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement de rôle.");
    } finally {
      setIsLoading(false);
    }
  };

  const userName = selectedUser ? `${userFirstName(selectedUser)} ${userLastName(selectedUser)}` : '';

  return (
    <Modal
      open={show}
      title="Changer le rôle"
      subtitle={selectedUser ? `Utilisateur : ${userName}` : undefined}
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button className="btn btn-primary" type="submit" form="update-role-form" disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-save me-1"></i>}
            Mettre à jour
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <form id="update-role-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Rôle</label>
          <select
            className="form-select"
            value={roleNom}
            onChange={(e) => setRoleNom(e.target.value)}
            required
          >
            <option value="" disabled>Choisir...</option>
            {roles.map((r) => (
              <option key={r._id} value={r.nom}>{r.nom}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
};
