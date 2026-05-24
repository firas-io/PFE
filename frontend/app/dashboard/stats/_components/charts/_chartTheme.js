export const CARD = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  padding: '20px',
};

export const COLORS = ['#4338CA', '#059669', '#7C3AED', '#D97706', '#0EA5E9'];
export const DONUT_COLORS = ['#4338CA', '#EC4899', '#0EA5E9', '#059669', '#7C3AED'];
export const TOOLTIP_STYLE = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 };

export const CATEGORY_LABELS = {
  sport: 'Sport', sante: 'Santé', santé: 'Santé',
  apprentissage: 'Apprentissage', travail: 'Travail',
  bien_etre: 'Bien-être', 'bien-etre': 'Bien-être', autre: 'Autre',
};

export function categoryLabel(slug) {
  return CATEGORY_LABELS[slug] || slug || 'Autre';
}

export function Spinner({ height = 240 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <svg style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#4338CA" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function mapDailyChart(dailyProgress) {
  return (dailyProgress ?? []).map(d => ({
    day:       String(d.label || '').split(' ')[0],
    label:     d.label,
    rate:      d.rate,
    completed: d.completed,
    total:     d.total,
  }));
}
