'use client';
import { useState } from 'react';
import { Settings } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: '', label: 'Par défaut (admin)' },
  { value: 'low',    label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high',   label: 'Haute' },
];

export function PersonalizeModal({ habit, onClose, onSave, saving }) {
  const [priorite,   setPriorite]   = useState(habit.priorite_perso   ?? '');
  const [objectif,   setObjectif]   = useState(habit.objectif_perso   ?? '');
  const [note,       setNote]       = useState(habit.note             ?? '');
  const [dateDebut,  setDateDebut]  = useState(
    habit.date_debut_perso ? habit.date_debut_perso.slice(0, 10) : ''
  );

  function handleSubmit(e) {
    e.preventDefault();
    const settings = {};
    if (priorite)  settings.priorite_perso   = priorite;
    if (objectif)  settings.objectif_perso   = objectif;
    if (note)      settings.note             = note;
    if (dateDebut) settings.date_debut_perso = dateDebut;
    onSave(settings);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1400 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(67,56,202,0.18)',
        width: '100%', maxWidth: 440, zIndex: 1401,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0EFF9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#EEF2FF', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Settings size={16} color="#4338CA" />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>
                Personnaliser
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                {habit.nom} · <span style={{ color: '#4338CA' }}>🌐 Global</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, marginBottom: 0 }}>
            Ces paramètres s&apos;appliquent uniquement à vous. L&apos;habitude reste inchangée pour les autres.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Priorité personnelle
              </label>
              <select
                className="form-select form-select-sm"
                value={priorite}
                onChange={e => setPriorite(e.target.value)}
              >
                {PRIORITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Mon objectif
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={`Objectif admin : ${habit.objectif ?? '—'}`}
                value={objectif}
                onChange={e => setObjectif(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Date de début personnelle
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Ma note personnelle
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="Votre note privée sur cette habitude…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm flex-fill"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm flex-fill"
              disabled={saving}
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
