'use client';
import React from 'react';
import { Modal } from '@/components/Modal';
import { IconCamera } from '@tabler/icons-react';

export const CatchupModal = ({
  show,
  catchupDate,
  incompleteHabits,
  selectedHabit,
  onSelectHabit,
  photoPreview,
  onPhotoChange,
  onRemovePhoto,
  catchupNotes,
  onNotesChange,
  onClose,
  onSubmit,
  loading,
}) => (
  <Modal
    open={show}
    title={<><IconCamera size={20} className="me-2" style={{ display: 'inline' }} />Rattraper avec photo</>}
    onClose={onClose}
    footer={
      <>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Annuler
        </button>
        {selectedHabit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={loading || !photoPreview}
          >
            {loading ? 'Sauvegarde...' : 'Valider le rattrapage'}
          </button>
        )}
      </>
    }
  >
    <div className="mb-3">
      <label className="form-label">
        <strong>Date: {catchupDate ? new Date(catchupDate + 'T00:00:00').toLocaleDateString('fr-FR') : ''}</strong>
      </label>
    </div>

    {incompleteHabits.length > 0 ? (
      !selectedHabit ? (
        <div className="mb-3">
          <label className="form-label">Habitudes non complétées ({incompleteHabits.length})</label>
          <div className="list-group list-group-sm">
            {incompleteHabits.map((habit) => (
              <button
                key={habit.habit_id}
                type="button"
                className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                onClick={() => onSelectHabit(habit.habit_id)}
              >
                <div className="flex-grow-1 text-start">
                  <div className="fw-bold">{habit.nom}</div>
                  <small className="text-secondary">{habit.categorie} · {habit.frequence}</small>
                </div>
                <IconCamera size={16} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mb-3"
            onClick={() => onSelectHabit(null)}
            disabled={loading}
          >
            ← Changer l'habitude
          </button>
          <p className="mb-3">
            <strong>{incompleteHabits.find((h) => h.habit_id === selectedHabit)?.nom}</strong>
          </p>
          <p className="text-secondary mb-3">Prenez une photo pour vérifier que vous avez complété cette habitude.</p>

          {photoPreview ? (
            <div className="mb-3">
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: '8px', border: '2px solid #ddd' }}>
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={onRemovePhoto} disabled={loading}>
                Retirer la photo
              </button>
            </div>
          ) : (
            <label style={{ display: 'block', padding: '40px 20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
              <IconCamera size={40} style={{ color: '#999', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
              <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Cliquez pour sélectionner une photo</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>ou glissez-déposez une image</p>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={loading}
                onChange={(e) => { if (e.target.files?.[0]) onPhotoChange(e.target.files[0]); }}
              />
            </label>
          )}

          <div className="mb-3">
            <label htmlFor="catchup-notes" className="form-label">Ajouter une note (optionnel)</label>
            <textarea
              id="catchup-notes"
              className="form-control"
              rows={2}
              value={catchupNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Décrivez comment vous avez complété cette habitude..."
              disabled={loading}
            />
          </div>
        </>
      )
    ) : (
      <div className="alert alert-info">Aucune habitude non complétée pour cette date.</div>
    )}
  </Modal>
);
