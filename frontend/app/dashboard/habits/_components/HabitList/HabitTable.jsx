'use client';
import { AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { HabitListSkeleton } from '@/app/dashboard/_components/Skeleton/Skeleton';
import { HabitCard } from '../HabitCard';

export const HabitTable = ({
  habits,
  todayStatus,
  loading,
  disabled,
  onEdit,
  onClone,
  onTogglePause,
  onArchive,
  onToggleDay,
  onNotes,
  onUpdateDate,
  weeklyCompletionMap,
  todayIndex,
  canManage = true,
}) => {
  if (loading) return <div className="p-5"><HabitListSkeleton rows={4} /></div>;

  if (habits.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-16 px-4 text-center">
        <div className="d-flex h-16 w-16 align-items-center justify-content-center rounded-5 bg-light">
          <Bookmark className="h-7 w-7 text-muted" />
        </div>
        <div>
          <p className="fw-semibold text-body">Aucune habitude trouvée</p>
          <p className="text-sm text-muted mt-1">
            Ajustez vos filtres pour afficher d&apos;autres habitudes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 d-flex flex-column gap-2">
      <AnimatePresence initial={false}>
        {habits.map((habit, index) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            index={index}
            todayStatus={todayStatus[habit._id]}
            disabled={disabled}
            weeklyCompletion={weeklyCompletionMap[String(habit._id)] || [false, false, false, false, false, false, false]}
            todayIndex={todayIndex}
            onEdit={onEdit}
            onClone={onClone}
            onTogglePause={onTogglePause}
            onArchive={onArchive}
            onToggleDay={onToggleDay}
            onNotes={onNotes}
            onUpdateDate={onUpdateDate}
            canManage={canManage}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
