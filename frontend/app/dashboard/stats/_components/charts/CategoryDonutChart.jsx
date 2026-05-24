'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CARD, DONUT_COLORS, TOOLTIP_STYLE } from './_chartTheme';

export function CategoryDonutChart({ distribution = [] }) {
  const data = distribution.filter(d => d.count > 0);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={CARD}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px' }}>
        Répartition des habitudes par catégorie
      </h3>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>Nombre et pourcentage par catégorie</p>
      {!data.length ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune habitude</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 220, height: 220, margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  isAnimationActive
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.category} fill={entry.color || DONUT_COLORS[i % DONUT_COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${value} (${props.payload.percentage}%)`,
                    props.payload.label,
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1E1B4B', margin: 0, lineHeight: 1 }}>{total}</p>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>habitudes</p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((d, i) => (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color || DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }}/>
                  {d.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{d.count} · {d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
