'use client';
import React from 'react';

export const HabitVisibilitySection = ({ idPrefix, visiblePourTous, setVisiblePourTous }) => {
  return (
    <div className="col-12">
      <div className="border border-primary border-opacity-25 rounded-3 p-3 bg-primary bg-opacity-10">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="badge bg-primary">Visibilité</span>
          <span className="fw-semibold">Qui voit cette habitude ?</span>
        </div>
        <div className="vstack gap-3">
          <div className="form-check p-3 rounded-2 border bg-body">
            <input
              className="form-check-input"
              type="radio"
              name={`${idPrefix}-audience`}
              id={`${idPrefix}-audience-me`}
              checked={!visiblePourTous}
              onChange={() => setVisiblePourTous(false)}
            />
            <label className="form-check-label w-100" htmlFor={`${idPrefix}-audience-me`}>
              <span className="fw-medium d-block">Administrateur uniquement</span>
              <span className="text-secondary small d-block mt-1">
                Visible uniquement pour votre compte administrateur.
              </span>
            </label>
          </div>
          <div className="form-check p-3 rounded-2 border bg-body">
            <input
              className="form-check-input"
              type="radio"
              name={`${idPrefix}-audience`}
              id={`${idPrefix}-audience-all`}
              checked={visiblePourTous}
              onChange={() => setVisiblePourTous(true)}
            />
            <label className="form-check-label w-100" htmlFor={`${idPrefix}-audience-all`}>
              <span className="fw-medium d-block">Tous les utilisateurs</span>
              <span className="text-secondary small d-block mt-1">
                Chaque utilisateur voit cette habitude dans sa propre liste.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
