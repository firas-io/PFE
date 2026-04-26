'use client';
import React from 'react';
import { Archive, Copy, FileText, Pause, Pencil, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WeeklyCompletionToggle } from './WeeklyCompletionToggle';

const Btn = ({ onClick, disabled, title, className, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-smooth',
      'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
  >
    {children}
  </button>
);

export const Actions = ({
  habit,
  onEdit,
  onClone,
  onTogglePause,
  onArchive,
  onToggleDay,
  onNotes,
  disabled,
  weeklyCompletion,
  todayIndex,
}) => {
  const isActive = !habit.statut || habit.statut === 'active';

  return (
    <div className="flex items-center gap-1">
      {/* Weekly complete toggle */}
      <WeeklyCompletionToggle
        weeklyCompletion={weeklyCompletion}
        todayIndex={todayIndex}
        onToggleDay={(dayIndex) => onToggleDay(habit._id, dayIndex)}
        disabled={disabled}
      />

      {/* Edit */}
      <Btn onClick={() => onEdit(habit)} disabled={disabled} title="Modifier">
        <Pencil className="h-3.5 w-3.5" />
      </Btn>

      {/* Clone */}
      <Btn onClick={() => onClone(habit._id)} disabled={disabled} title="Dupliquer">
        <Copy className="h-3.5 w-3.5" />
      </Btn>

      {/* Pause / Resume */}
      {isActive ? (
        <Btn
          onClick={() => onTogglePause(habit._id, 'pause')}
          disabled={disabled}
          title="Mettre en pause"
          className="hover:border-warning/40 hover:bg-warning/10 hover:text-warning"
        >
          <Pause className="h-3.5 w-3.5" />
        </Btn>
      ) : (
        <Btn
          onClick={() => onTogglePause(habit._id, 'active')}
          disabled={disabled}
          title="Reprendre"
          className="hover:border-success/40 hover:bg-success/10 hover:text-success"
        >
          <Play className="h-3.5 w-3.5" />
        </Btn>
      )}

      {/* Notes */}
      <Btn
        onClick={() => onNotes(habit)}
        disabled={disabled}
        title={habit.note ? 'Modifier les notes' : 'Ajouter des notes'}
        className={habit.note ? 'border-info/30 bg-info/5 text-info hover:bg-info/15 hover:border-info/50 hover:text-info' : ''}
      >
        <FileText className="h-3.5 w-3.5" />
      </Btn>

      {/* Archive */}
      {habit.statut !== 'archived' && (
        <Btn
          onClick={() => onArchive(habit._id)}
          disabled={disabled}
          title="Archiver"
          className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <Archive className="h-3.5 w-3.5" />
        </Btn>
      )}
    </div>
  );
};
