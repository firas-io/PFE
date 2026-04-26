'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { IconCamera, IconCheck, IconTrash, IconUpload } from '@tabler/icons-react';

export const PhotoModal = ({ show, onClose, onSubmit, submitting }) => {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setNotes('');
    onClose();
  };

  const handleFileChange = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!photoFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onSubmit(e.target?.result, notes || undefined);
      setPhotoFile(null);
      setPhotoPreview(null);
      setNotes('');
    };
    reader.readAsDataURL(photoFile);
  };

  return (
    <Modal
      open={show}
      title={<><IconCamera size={20} className="me-2" />Photo de vérification</>}
      onClose={handleClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!photoFile || submitting}
          >
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Vérification...</>
              : <><IconCheck size={16} className="me-2" />Valider et marquer complété</>}
          </button>
        </>
      }
    >
      <p className="text-secondary">Prenez une photo pour vérifier que vous avez complété cette habitude.</p>

      {photoPreview ? (
        <div className="mb-3">
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: '8px', border: '2px solid #ddd' }}>
            <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm mt-2"
            onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
            disabled={submitting}
          >
            <IconTrash size={16} className="me-2" />Retirer la photo
          </button>
        </div>
      ) : (
        <label style={{ display: 'block', padding: '40px 20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
          <IconUpload size={40} style={{ color: '#999', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Cliquez pour sélectionner une photo</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>ou glissez-déposez une image</p>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={submitting}
            onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }}
          />
        </label>
      )}

      <div className="mb-3 mt-3">
        <label htmlFor="photo-notes" className="form-label">Ajouter une note (optionnel)</label>
        <textarea
          id="photo-notes"
          className="form-control"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Décrivez comment vous avez complété cette habitude..."
          disabled={submitting}
        />
      </div>
    </Modal>
  );
};
