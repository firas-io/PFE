import type { Metadata } from 'next';
import { HabitList } from './_components/HabitList';

export const metadata: Metadata = {
  title: 'Mes Habitudes | HabitFlow',
};

export default function DashboardHabitsPage() {
  return <HabitList />;
}
