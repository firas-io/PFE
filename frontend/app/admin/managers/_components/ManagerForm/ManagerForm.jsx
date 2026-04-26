'use client';
import React from 'react';

export const ManagerForm = ({ formId, form, onChange, onSubmit, showPassword = false }) => (
  <form id={formId} onSubmit={onSubmit}>
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Nom</label>
        <input
          className="form-control"
          value={form.nom}
          onChange={(e) => onChange('nom', e.target.value)}
          required
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Prénom</label>
        <input
          className="form-control"
          value={form.prenom}
          onChange={(e) => onChange('prenom', e.target.value)}
          required
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Email</label>
        <input
          className="form-control"
          type="email"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          required
        />
      </div>
      {showPassword && (
        <div className="col-md-6">
          <label className="form-label">Mot de passe</label>
          <input
            className="form-control"
            type="password"
            value={form.mot_de_passe || ''}
            onChange={(e) => onChange('mot_de_passe', e.target.value)}
            required
          />
        </div>
      )}
      <div className="col-md-6">
        <label className="form-label">Département</label>
        <input
          className="form-control"
          value={form.departement}
          onChange={(e) => onChange('departement', e.target.value)}
        />
      </div>
    </div>
  </form>
);
