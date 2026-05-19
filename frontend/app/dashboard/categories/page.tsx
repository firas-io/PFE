'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getUser, setUser } from '@/lib/auth';
import { invalidateCategoriesCache } from '@/hooks/useCategories';

interface Category {
  slug: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  padding: '20px',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <svg style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#4338CA" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CategoryCard({
  cat,
  actionLabel,
  actionColor,
  disabled,
  onAction,
}: {
  cat: Category;
  actionLabel: string;
  actionColor: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: 14,
        border: `1.5px solid ${cat.color}28`,
        background: `${cat.color}08`,
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${cat.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cat.color, fontSize: 16,
        }}>
          <span style={{ fontSize: 15 }}>{cat.label[0]}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', margin: 0 }}>{cat.label}</p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
            {cat.description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: 'none',
          background: actionColor, color: '#fff', fontSize: 12, fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
          fontFamily: 'inherit', transition: 'opacity 0.15s',
        }}
      >
        {actionLabel}
      </button>
    </motion.div>
  );
}

export default function MyCategoriesPage() {
  const [selected,   setSelected]   = useState<Category[]>([]);
  const [available,  setAvailable]  = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [busy,       setBusy]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allCategories, myData, availableData] = await Promise.all([
        apiFetch<Category[]>('/categories'),
        apiFetch<{ categories: string[] }>('/users/me/categories'),
        apiFetch<Category[]>('/categories/available-for-user'),
      ]);
      const slugSet = new Set((myData.categories ?? []).map((s) => String(s).toLowerCase()));
      setSelected(allCategories.filter((c) => slugSet.has(String(c.slug).toLowerCase())));
      setAvailable(availableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncLocalStorage = (slugs: string[]) => {
    const current = getUser<Record<string, unknown>>();
    if (current) setUser({ ...current, categories: slugs });
  };

  const handleAdd = async (cat: Category) => {
    setBusy(cat.slug);
    setError(null);
    try {
      const data = await apiFetch<{ categories: string[] }>('/users/me/categories', {
        method: 'POST',
        body: JSON.stringify({ categories: [cat.slug] }),
      });
      setSelected(prev => [...prev, cat]);
      setAvailable(prev => prev.filter(c => c.slug !== cat.slug));
      syncLocalStorage(data.categories);
      invalidateCategoriesCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (cat: Category) => {
    if (selected.length <= 1) {
      setError('Vous devez conserver au moins une catégorie.');
      return;
    }
    setBusy(cat.slug);
    setError(null);
    try {
      const data = await apiFetch<{ categories: string[] }>(`/users/me/categories/${cat.slug}`, { method: 'DELETE' });
      setAvailable(prev => [cat, ...prev]);
      setSelected(prev => prev.filter(c => c.slug !== cat.slug));
      syncLocalStorage(data.categories);
      invalidateCategoriesCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
            Mes Catégories
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Gérez les domaines de vie sur lesquels vous voulez vous concentrer.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
            background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151',
            cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, flexShrink: 0,
          }}
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

          {/* Selected categories */}
          <div style={CARD}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Catégories actives</h2>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {selected.length} catégorie{selected.length !== 1 ? 's' : ''} sélectionnée{selected.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence mode="popLayout">
                {selected.map(cat => (
                  <CategoryCard
                    key={cat.slug}
                    cat={cat}
                    actionLabel="Retirer"
                    actionColor="#EF4444"
                    disabled={busy === cat.slug || selected.length <= 1}
                    onAction={() => handleRemove(cat)}
                  />
                ))}
              </AnimatePresence>
              {selected.length === 0 && (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>
                  Aucune catégorie sélectionnée.
                </p>
              )}
            </div>
          </div>

          {/* Available categories */}
          <div style={CARD}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Catégories disponibles</h2>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Ajoutez de nouveaux domaines à votre parcours.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence mode="popLayout">
                {available.map(cat => (
                  <CategoryCard
                    key={cat.slug}
                    cat={cat}
                    actionLabel="Ajouter"
                    actionColor="#4338CA"
                    disabled={busy === cat.slug}
                    onAction={() => handleAdd(cat)}
                  />
                ))}
              </AnimatePresence>
              {available.length === 0 && (
                <div style={{
                  padding: '16px', borderRadius: 12, background: '#F0FDF4',
                  border: '1px solid #BBF7D0', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: '#059669', fontWeight: 600, margin: 0 }}>
                    Vous avez sélectionné toutes les catégories !
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Info banner */}
      {!loading && (
        <div style={{
          borderRadius: 14, padding: '16px 20px',
          background: 'linear-gradient(135deg, #4338CA, #7C3AED)',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Vos catégories filtrent vos habitudes</p>
            <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
              Seules les habitudes appartenant à vos catégories actives apparaissent dans votre tableau de bord.
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
