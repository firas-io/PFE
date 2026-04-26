import { AdminDashboard } from './_components/AdminDashboard';

export const metadata = {
  title: 'Tableau de Bord | HabitFlow Admin',
};

const AdminPage = async () => {
  return (
    <div className="container-fluid">
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;
