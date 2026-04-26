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
}) => {
  if (loading) return <div className="p-5"><HabitListSkeleton rows={4} /></div>;

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Bookmark className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Aucune habitude trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustez vos filtres ou créez votre première habitude.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
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
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
