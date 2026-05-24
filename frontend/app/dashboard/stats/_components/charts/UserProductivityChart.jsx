'use client';
import {
  Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CARD, TOOLTIP_STYLE } from './_chartTheme';

export function UserProductivityChart({ users = [] }) {
  const chartData = users.map(u => ({
    name:  u.name?.length > 18 ? `${u.name.slice(0, 18)}…` : u.name,
    full:  u.name,
    score: u.score,
    completion_rate: u.completion_rate,
    best_streak: u.best_streak,
    regularity: u.regularity,
  }));

  return (
    <div style={CARD}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px' }}>
        Productivité des utilisateurs
      </h3>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>
        Score composite : complétion, régularité et série
      </p>
      {!chartData.length ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucun utilisateur</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 38)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
            <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
            <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }}/>
            <Tooltip
              formatter={v => [`${v}/100`, 'Score']}
              labelFormatter={(_, p) => {
                const row = p?.[0]?.payload;
                return row
                  ? `${row.full} — complétion ${row.completion_rate}%, série ${row.best_streak}j, régularité ${row.regularity}%`
                  : '';
              }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="score" fill="#F97316" radius={[0, 6, 6, 0]} isAnimationActive/>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
