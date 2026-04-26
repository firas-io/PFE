import { Suspense } from 'react';

import { UserList } from './_components/UserList';

export const metadata = {
  title: 'Équipes par manager | HabitFlow Admin',
};

const UsersAdminPage = async () => {
  return (
    <div className="container-fluid">
      <Suspense>
        <UserList />
      </Suspense>
    </div>
  );
};

export default UsersAdminPage;
