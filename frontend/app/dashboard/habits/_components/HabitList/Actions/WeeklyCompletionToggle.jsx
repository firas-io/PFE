'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const WeeklyCompletionToggle = ({ weeklyCompletion, todayIndex, onToggleDay, disabled }) => (
  <div className="flex items-end gap-1.5">
    {DAY_LABELS.map((label, i) => {
      const isDone  = weeklyCompletion[i] === true;
      const isToday = i === todayIndex;

      return (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              'text-[9px] font-bold leading-none',
              isToday ? 'text-primary' : 'text-muted-foreground/50'
            )}
          >
            {label}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => onToggleDay(i)}
            disabled={disabled}
            title={`${label} — ${isDone ? 'complété' : 'non complété'}`}
            aria-label={`${label} — ${isDone ? 'complété' : 'non complété'}`}
            aria-pressed={isDone}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all duration-200',
              'disabled:pointer-events-none disabled:opacity-40',
              isDone
                ? 'border-success/70 bg-success text-white shadow-sm'
                : isToday
                ? 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/15'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
            )}
          >
            {isDone
              ? <Check className="h-3.5 w-3.5" strokeWidth={3} />
              : <span className={cn('block h-1.5 w-1.5 rounded-sm', isToday ? 'bg-primary/50' : 'bg-muted-foreground/20')} />}
          </motion.button>
        </div>
      );
    })}
  </div>
);
