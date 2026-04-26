import { Suspense } from 'react';
import { MyUserList } from './_components/MyUserList';

export const metadata = {
  title: 'Mes Utilisateurs | HabitFlow',
};

const MyUsersPage = async () => (
  <div className="container-fluid">
    <Suspense>
      <MyUserList />
    </Suspense>
  </div>
);

export default MyUsersPage;
