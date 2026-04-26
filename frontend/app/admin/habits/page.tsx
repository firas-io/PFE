import { Suspense } from 'react';

import { HabitList } from './_components/HabitList';

export const metadata = {
  title: 'Gestion des Habitudes | HabitFlow',
};

const HabitsAdminPage = async () => {
  return (
    <div className="container-fluid">
      <Suspense>
        <HabitList />
      </Suspense>
    </div>
  );
};

export default HabitsAdminPage;
