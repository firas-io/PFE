'use client';
import { CompletionEvolutionChart } from './CompletionEvolutionChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { TopHabitsByCategoryChart } from './TopHabitsByCategoryChart';
import { HabitCompletionRateChart } from './HabitCompletionRateChart';
import { UserProductivityChart } from './UserProductivityChart';
import { mapDailyChart } from './_chartTheme';

export function StatsChartsGrid({ stats, showTeamCharts = false, gradientId = 'statsGrad' }) {
  if (!stats) return null;

  const dailyChart = mapDailyChart(stats.daily_progress);
  const average    = stats.completion_average ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CompletionEvolutionChart
        data={dailyChart}
        average={average}
        gradientId={gradientId}
      />

      <div className="stats-charts-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <CategoryDonutChart distribution={stats.categories_distribution}/>
        <TopHabitsByCategoryChart habits={stats.top_habits_by_category}/>
      </div>

      {showTeamCharts && (
        <div className="stats-charts-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <HabitCompletionRateChart habits={stats.habit_completion_rates}/>
          <UserProductivityChart users={stats.user_productivity}/>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .stats-charts-row-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
