import { Suspense } from 'react';
import { ManagersUsers } from './_components/ManagersUsers';

export const metadata = {
  title: 'Managers & Utilisateurs | HabitFlow Admin',
};

export default function ManagersUsersPage() {
  return (
    <div className="container-fluid">
      <Suspense>
        <ManagersUsers />
      </Suspense>
    </div>
  );
}
