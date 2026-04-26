'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({ open, title, subtitle, children, onClose, footer, size }) => {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof window === 'undefined' || !open) return null;

  const sizeClass = size === 'lg' ? 'modal-dialog modal-lg' : 'modal-dialog';

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div className={sizeClass} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title h5">{title}</div>
                {subtitle && <div className="text-secondary small">{subtitle}</div>}
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
};
