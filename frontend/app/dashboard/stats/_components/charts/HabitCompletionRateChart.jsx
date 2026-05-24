'use client';
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CARD, TOOLTIP_STYLE } from './_chartTheme';

export function HabitCompletionRateChart({ habits = [] }) {
  const chartData = habits.map(h => ({
    name:  h.nom?.length > 12 ? `${h.nom.slice(0, 12)}…` : h.nom,
    full:  h.nom,
    rate:  h.rate,
    completed_days: h.completed_days,
    total_days: h.total_days,
  }));

  return (
    <div style={CARD}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px' }}>
        Taux de complétion par habitude
      </h3>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>
        Jours complétés / jours éligibles — les plus faibles en premier
      </p>
      {!chartData.length ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune habitude active</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="habitRedGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.85}/>
                <stop offset="100%" stopColor="#F97316" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={0} angle={-28} textAnchor="end" height={56}/>
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={32} unit="%"/>
            <Tooltip
              formatter={v => [`${v}%`, 'Taux']}
              labelFormatter={(_, p) => {
                const row = p?.[0]?.payload;
                return row ? `${row.full} — ${row.completed_days}/${row.total_days} jours` : '';
              }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="rate" radius={[6, 6, 0, 0]} isAnimationActive>
              {chartData.map((_, i) => (
                <Cell key={i} fill="url(#habitRedGrad)"/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
