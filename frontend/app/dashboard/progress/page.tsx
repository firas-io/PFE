import type { Metadata } from 'next';
import { ProgressView } from './_components/ProgressView';

export const metadata: Metadata = {
  title: 'Mon Avancement | HabitFlow',
};

export default function DashboardProgressPage() {
  return <ProgressView />;
}
