'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

const HabitFlowLogo = () => (
  <div style={{
    width: 56, height: 56, borderRadius: 16,
    background: '#4338CA',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(67,56,202,0.35)',
  }}>
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <path d="M8 16.5C8 12.5 11 9 16 9C21 9 24 12.5 24 16.5C24 20.5 21 23 16 23" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M16 23C13.5 23 12 21 12 18.5C12 16 13.5 14 16 14C18.5 14 20 16 20 18.5" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="16" cy="18.5" r="2.2" fill="white"/>
    </svg>
  </div>
);

const inputStyle = {
  borderRadius: 10,
  border: '1.5px solid #E5E7EB',
  background: '#F9FAFB',
  padding: '11px 14px',
  fontSize: 14,
  color: '#1E1B4B',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.02em',
};

export const SignupForm = () => {
  const router = useRouter();
  const [nom,      setNom]      = useState('');
  const [prenom,   setPrenom]   = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);
  const [ldapEnabled, setLdapEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/auth/config`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.ldapEnabled === true) setLdapEnabled(true);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const isFormValid = useMemo(
    () => nom.trim().length > 0 && prenom.trim().length > 0 && email.trim().length > 0 && password.length >= 6,
    [nom, prenom, email, password],
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), mot_de_passe: password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);

      setSuccess('Compte créé ! Redirection vers la connexion…');
      setTimeout(() => router.push('/login'), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F0FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 4px 32px rgba(67,56,202,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logo */}
        <HabitFlowLogo />

        {/* Brand */}
        <div style={{ textAlign: 'center', marginTop: 14, marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.3px' }}>
            HabitFlow
          </h1>
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
            Effortless Discipline
          </p>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 22, width: '100%' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.3px' }}>
            Créer un compte
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 5 }}>
            Rejoignez HabitFlow et construisez de meilleures habitudes.
          </p>
        </div>

        {ldapEnabled ? (
          <div style={{
            width: '100%', marginBottom: 16,
            background: '#EEF2FF', borderRadius: 12, padding: '16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#4338CA', fontWeight: 600, margin: 0 }}>
              L&apos;inscription en ligne est désactivée.
            </p>
            <p style={{ fontSize: 12, color: '#6366F1', margin: '4px 0 12px' }}>
              Les comptes sont fournis par l&apos;annuaire LDAP.
            </p>
            <Link href="/login" style={{
              display: 'inline-block', background: '#4338CA', color: '#FFFFFF',
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
            }}>
              Aller à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nom + Prénom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Prénom</label>
                <input
                  style={inputStyle}
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  placeholder="Jean"
                  required
                  disabled={loading}
                  onFocus={e => e.target.style.borderColor = '#4338CA'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Nom</label>
                <input
                  style={inputStyle}
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Dupont"
                  required
                  disabled={loading}
                  onFocus={e => e.target.style.borderColor = '#4338CA'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Adresse email</label>
              <input
                type="email"
                style={inputStyle}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
                disabled={loading}
                onFocus={e => e.target.style.borderColor = '#4338CA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  onFocus={e => e.target.style.borderColor = '#4338CA'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2,
                  }}
                >
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p style={{ fontSize: 11, color: '#F97316', margin: 0 }}>Au moins 6 caractères requis</p>
              )}
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, fontWeight: 500, color: '#DC2626',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, fontWeight: 500, color: '#16A34A',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                </svg>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || loading}
              style={{
                marginTop: 4,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 12,
                background: '#4338CA',
                color: '#FFFFFF',
                border: 'none',
                padding: '13px 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer',
                opacity: (!isFormValid || loading) ? 0.6 : 1,
                transition: 'opacity 0.15s, background 0.15s',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(67,56,202,0.3)',
              }}
              onMouseEnter={e => { if (isFormValid && !loading) e.currentTarget.style.background = '#3730A3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4338CA'; }}
            >
              {loading && (
                <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Création en cours…' : 'Créer mon compte'}
            </button>
          </form>
        )}

        {/* Footer */}
        {!ldapEnabled && (
          <p style={{ marginTop: 18, fontSize: 13, color: '#64748B', textAlign: 'center' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#4338CA', fontWeight: 700, textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        )}
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 20, display: 'flex', gap: 16, fontSize: 12, color: '#9CA3AF' }}>
        <span style={{ cursor: 'default' }}>Privacy Policy</span>
        <span>·</span>
        <span style={{ cursor: 'default' }}>Terms of Service</span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .signup-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
