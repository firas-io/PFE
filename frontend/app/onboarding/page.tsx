'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, apiFetch } from '@/lib/api';
import { getToken, getUser, setUser } from '@/lib/auth';

const ICON_PATHS: Record<string, React.ReactElement> = {
  Heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
  BookOpen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Dumbbell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/>
    </svg>
  ),
  Wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Palette: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  Circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
};

interface Category {
  slug: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }

    const user = getUser<{ isFirstLogin?: boolean; categories?: string[] }>();
    if (user?.isFirstLogin === false && (user?.categories?.length ?? 0) > 0) {
      router.replace('/dashboard/home');
      return;
    }

    fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Category[]) => { setCategories(data); setLoading(false); })
      .catch(() => { setError('Impossible de charger les catégories'); setLoading(false); });
  }, [router]);

  const toggle = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) { setError('Sélectionnez au moins une catégorie.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/onboarding/categories', {
        method: 'POST',
        body: JSON.stringify({ categories: Array.from(selected) }),
      });
      const current = getUser<Record<string, unknown>>() ?? {};
      setUser({ ...current, isFirstLogin: false, categories: Array.from(selected) });
      router.push('/dashboard/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F0FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ animation: 'spin 1s linear infinite', width: 36, height: 36 }} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#4338CA" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const progressPct = (1 / TOTAL_STEPS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0FA', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top progress header ─────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: '#4338CA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M8 16.5C8 12.5 11 9 16 9C21 9 24 12.5 24 16.5C24 20.5 21 23 16 23" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M16 23C13.5 23 12 21 12 18.5C12 16 13.5 14 16 14C18.5 14 20 16 20 18.5" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
              <circle cx="16" cy="18.5" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 15 }}>HabitFlow</span>
          <span style={{ fontSize: 11, color: '#64748B' }}>/</span>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Onboarding</span>
        </div>

        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
          Step 1 of {TOTAL_STEPS}
        </span>
      </header>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#E5E7EB' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: '#4338CA', transition: 'width 0.5s ease', borderRadius: '0 4px 4px 0' }}/>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 100px', maxWidth: 560, margin: '0 auto', width: '100%' }}>

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.5px' }}>
            Define your focus.
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>
            Select the areas of life you want to transform. We&apos;ll tailor your flow accordingly.
          </p>
        </div>

        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {categories.map((cat) => {
            const isSelected = selected.has(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggle(cat.slug)}
                aria-pressed={isSelected}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  gap: 10, padding: '18px 16px', borderRadius: 16, textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: isSelected ? `2px solid ${cat.color}` : '2px solid #E5E7EB',
                  background: isSelected ? `${cat.color}12` : '#FFFFFF',
                  boxShadow: isSelected ? `0 2px 12px ${cat.color}22` : 'none',
                  fontFamily: 'inherit',
                  position: 'relative',
                }}
              >
                {/* Selected radio */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 18, height: 18, borderRadius: '50%',
                  border: isSelected ? `5px solid ${cat.color}` : '1.5px solid #CBD5E1',
                  background: '#fff',
                  transition: 'all 0.15s',
                }}/>

                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: isSelected ? `${cat.color}22` : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSelected ? cat.color : '#64748B',
                }}>
                  {ICON_PATHS[cat.icon] ?? ICON_PATHS.Circle}
                </div>

                {/* Text */}
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', margin: 0 }}>{cat.label}</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', lineHeight: 1.4 }}>{cat.description}</p>
                  {/* Bar */}
                  <div style={{ height: 3, background: '#E5E7EB', borderRadius: 4, marginTop: 10, width: 48, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: isSelected ? '100%' : '0%',
                      background: cat.color, borderRadius: 4, transition: 'width 0.3s',
                    }}/>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quote image block */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg, #1E1B4B, #312E81)',
          padding: '24px 20px', marginBottom: 8,
          position: 'relative',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Tip of the day
          </p>
          <p style={{ fontSize: 15, color: '#FFFFFF', fontStyle: 'italic', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
            &ldquo;Discipline is the bridge between goals and accomplishment.&rdquo;
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, fontWeight: 500, color: '#DC2626', marginTop: 12,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
            </svg>
            {error}
          </div>
        )}
      </main>

      {/* ── Sticky bottom CTA ────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#FFFFFF', borderTop: '1px solid #E5E7EB',
        padding: '16px 24px env(safe-area-inset-bottom, 16px)',
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 50,
      }}>
        {selected.size > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#64748B', margin: 0 }}>
            <span style={{ fontWeight: 700, color: '#4338CA' }}>{selected.size}</span>{' '}
            catégorie{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, maxWidth: 560, margin: '0 auto', width: '100%' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/home')}
            style={{
              padding: '13px 20px', borderRadius: 12, border: 'none',
              background: 'transparent', color: '#64748B', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Ignorer
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 12, border: 'none',
              background: '#4338CA', color: '#FFFFFF', fontSize: 14, fontWeight: 700,
              cursor: selected.size === 0 || submitting ? 'not-allowed' : 'pointer',
              opacity: selected.size === 0 || submitting ? 0.55 : 1,
              transition: 'opacity 0.15s', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(67,56,202,0.3)',
            }}
          >
            {submitting ? (
              <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : null}
            {submitting ? 'Enregistrement…' : 'Continue →'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
