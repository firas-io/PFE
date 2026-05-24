'use client';
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CARD, TOOLTIP_STYLE } from './_chartTheme';

export function TopHabitsByCategoryChart({ habits = [] }) {
  const chartData = habits.map(h => ({
    name:  h.nom?.length > 22 ? `${h.nom.slice(0, 22)}…` : h.nom,
    full:  h.nom,
    value: h.value,
    label: h.label || h.category,
  }));

  return (
    <div style={CARD}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px' }}>
        Top habitudes par catégorie
      </h3>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>Habitudes les plus suivies (complétions)</p>
      {!chartData.length ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune activité</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="topHabitBlueGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4338CA" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.85}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
            <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }}/>
            <Tooltip
              formatter={v => [v, 'Complétions']}
              labelFormatter={(_, p) => {
                const row = p?.[0]?.payload;
                return row ? `${row.full} (${row.label})` : '';
              }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
              {chartData.map((_, i) => (
                <Cell key={i} fill="url(#topHabitBlueGrad)"/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
