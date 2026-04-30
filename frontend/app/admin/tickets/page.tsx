import { Suspense } from 'react';
import { TicketsTable } from './_components/TicketsTable';

export const metadata = {
  title: 'Tickets | HabitFlow Admin',
};

export default function TicketsPage() {
  return (
    <div className="container-fluid">
      <Suspense>
        <TicketsTable />
      </Suspense>
    </div>
  );
}
