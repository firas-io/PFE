import { Suspense } from 'react';
import { LogsTable } from './_components/LogsTable';

export const metadata = {
  title: 'Logs | HabitFlow Admin',
};

export default function LogsPage() {
  return (
    <div className="container-fluid">
      <Suspense>
        <LogsTable />
      </Suspense>
    </div>
  );
}
