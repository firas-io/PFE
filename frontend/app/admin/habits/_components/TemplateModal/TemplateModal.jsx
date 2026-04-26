'use client';
import React from 'react';

import { Modal } from '@/components/Modal';
import { HabitVisibilitySection } from '../HabitVisibilitySection';

export const TemplateModal = ({
  show,
  onHide,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  visiblePourTous,
  setVisiblePourTous,
  onSubmit,
  isLoading,
}) => {
  return (
    <Modal
      open={show}
      title="Créer depuis un template"
      subtitle="Bibliothèque d'habitudes populaires pré-configurées."
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !selectedTemplateId}
          >
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-plus me-1"></i>}
            Créer
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <label className="form-label">Template</label>
        <select
          className="form-select"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t._id} value={t._id}>
              {t.nom_template}
            </option>
          ))}
        </select>
      </div>
      <div className="row g-3 mx-0">
        <HabitVisibilitySection
          idPrefix="template"
          visiblePourTous={visiblePourTous}
          setVisiblePourTous={setVisiblePourTous}
        />
      </div>
    </Modal>
  );
};
