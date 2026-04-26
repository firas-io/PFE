import { ProgressView } from './_components/ProgressView';

export const metadata = {
  title: 'Mon Avancement | HabitFlow',
};

const AdminProgressPage = async () => {
  return (
    <div className="container-fluid">
      <ProgressView />
    </div>
  );
};

export default AdminProgressPage;
