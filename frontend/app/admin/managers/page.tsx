import { Suspense } from 'react';
import { ManagerList } from './_components/ManagerList';

export const metadata = {
  title: 'Gestion des Managers | HabitFlow Admin',
};

const ManagersAdminPage = async () => (
  <div className="container-fluid">
    <Suspense>
      <ManagerList />
    </Suspense>
  </div>
);

export default ManagersAdminPage;
