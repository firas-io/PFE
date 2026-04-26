'use client';
import React from 'react';

import { Modal } from '@/components/Modal';

export const ConfirmModal = ({ show, onHide, onConfirm, title, message, confirmLabel, variant = 'danger', isLoading }) => {
  return (
    <Modal
      open={show}
      title={title}
      subtitle="Cette action peut être irréversible."
      onClose={onHide}
      footer={
        <div className="d-flex justify-content-between w-100">
          <button className="btn btn-secondary" type="button" onClick={onHide} disabled={isLoading}>
            <i className="fa fa-times me-1"></i>
            Annuler
          </button>
          <button className={`btn btn-${variant}`} type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <i className="fa fa-spinner fa-spin me-1"></i> : <i className="fa fa-check me-1"></i>}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-secondary mb-0">{message}</p>
    </Modal>
  );
};
