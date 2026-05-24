'use client';
import {
  Area, AreaChart, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CARD, TOOLTIP_STYLE } from './_chartTheme';

export function CompletionEvolutionChart({ data, average = 0, gradientId = 'completionGrad' }) {
  const chartData = data ?? [];
  const hasData   = chartData.length > 0;

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
            Évolution des habitudes complétées
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
            Taux de complétion dans le temps
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4338CA' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4338CA' }}/>
            Complétion %
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444' }}>
            <span style={{ width: 16, height: 0, borderTop: '2px dashed #EF4444' }}/>
            Moyenne {average}%
          </span>
        </div>
      </div>
      {!hasData ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune donnée sur cette période</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4338CA" stopOpacity={0.25}/>
                <stop offset="100%" stopColor="#4338CA" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}/>
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={36}/>
            <Tooltip
              formatter={v => [`${v}%`, 'Complétion']}
              labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
              contentStyle={TOOLTIP_STYLE}
            />
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="#EF4444"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{ value: `Moy. ${average}%`, position: 'insideTopRight', fill: '#EF4444', fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#4338CA"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: '#4338CA', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#4338CA', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
