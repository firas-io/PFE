import { Suspense } from 'react';
import { OffDays } from './_components/OffDays';

export const metadata = {
  title: 'Jours off | HabitFlow Admin',
};

export default function OffDaysPage() {
  return (
    <div className="container-fluid">
      <Suspense>
        <OffDays />
      </Suspense>
    </div>
  );
}
