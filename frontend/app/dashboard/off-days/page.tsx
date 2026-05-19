'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Pagination from '@/components/Pagination';

interface OffDay {
  _id: string;
  date: string;
  label: string;
  type: 'holiday' | 'maintenance' | 'special' | 'other';
}

const TYPE_BADGE: Record<OffDay['type'], { label: string; bg: string; color: string; border: string }> = {
  holiday:     { label: 'Bloquant',    bg: 'rgba(239,68,68,0.10)',  color: '#DC2626', border: 'rgba(239,68,68,0.25)' },
  maintenance: { label: 'Informatif',  bg: 'rgba(100,116,139,0.10)', color: '#64748B', border: 'rgba(100,116,139,0.2)' },
  special:     { label: 'Informatif',  bg: 'rgba(100,116,139,0.10)', color: '#64748B', border: 'rgba(100,116,139,0.2)' },
  other:       { label: 'Informatif',  bg: 'rgba(100,116,139,0.10)', color: '#64748B', border: 'rgba(100,116,139,0.2)' },
};

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const TH_STYLE: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#1E1B4B',
  background: '#F8FAFC',
  borderBottom: '1px solid #E5E7EB',
  textAlign: 'left',
};

const TD_STYLE: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: 14,
  color: '#1E293B',
  borderBottom: '1px solid #F1F5F9',
};

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function TypeBadge({ type }: { type: OffDay['type'] }) {
  const badge = TYPE_BADGE[type] ?? TYPE_BADGE.other;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: 999,
        background: badge.bg,
        color: badge.color,
        border: `1px solid ${badge.border}`,
      }}
    >
      {badge.label}
    </span>
  );
}

export default function OffDaysPage() {
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OffDay[]>('/off-days');
      setOffDays(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les jours off.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(offDays.length / PAGE_SIZE));
  const pageItems = offDays.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>
          Jours off
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 0 }}>
          Consultez les jours fériés et les jours de fermeture
        </p>
      </div>

      {error && (
        <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: 13,
            }}
          >
            {error}
        </div>
      )}

      <div style={CARD}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B', fontSize: 14 }}>
            Chargement…
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Date</th>
                    <th style={TH_STYLE}>Label</th>
                    <th style={TH_STYLE}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ ...TD_STYLE, textAlign: 'center', color: '#9CA3AF', padding: '40px 20px' }}>
                        Aucun jour off enregistré.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((offDay, i) => (
                      <tr key={offDay._id}>
                        <td style={{ ...TD_STYLE, fontWeight: 500, ...(i === pageItems.length - 1 ? { borderBottom: 'none' } : {}) }}>
                          {formatDate(offDay.date)}
                        </td>
                        <td style={{ ...TD_STYLE, ...(i === pageItems.length - 1 ? { borderBottom: 'none' } : {}) }}>
                          {offDay.label}
                        </td>
                        <td style={{ ...TD_STYLE, ...(i === pageItems.length - 1 ? { borderBottom: 'none' } : {}) }}>
                          <TypeBadge type={offDay.type} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {offDays.length > PAGE_SIZE && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
