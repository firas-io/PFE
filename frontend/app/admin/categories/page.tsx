import { Suspense } from 'react';
import { CategoriesManager } from './_components/CategoriesManager';

export const metadata = {
  title: 'Catégories | HabitFlow Admin',
};

export default function CategoriesPage() {
  return (
    <div className="container-fluid">
      <Suspense>
        <CategoriesManager />
      </Suspense>
    </div>
  );
}
