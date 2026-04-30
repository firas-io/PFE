'use client';
import { motion } from "framer-motion";
import { Flame, BookOpen, Brain, Dumbbell, Droplet, Moon, Music, Leaf, Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import { TaskCompleteToggle } from "../../../../components/habits/TaskCompleteToggle";

export interface HabitProgressItem {
  habit_id: string;
  habit_nom: string;
  statut: string;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  total_logs: number;
  completed_logs: number;
  is_done_today?: boolean;
}

const CATEGORY_ICONS = [Dumbbell, BookOpen, Brain, Droplet, Moon, Music, Leaf, Activity];
const CATEGORY_COLORS = [
  "hsl(24 95% 58%)", // orange – fitness
  "hsl(210 95% 60%)", // blue – learning
  "hsl(252 83% 60%)", // violet – mindfulness
  "hsl(152 76% 44%)", // green – health
  "hsl(38 95% 54%)", // amber – creative
];

function getIcon(index: number) {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}
function getColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

interface HabitItemProps {
  habit: HabitProgressItem;
  index?: number;
  onToggle?: (id: string) => void;
  disabled?: boolean;
}

export function HabitItem({ habit, index = 0, onToggle, disabled = false }: HabitItemProps) {
  const Icon = getIcon(index);
  const color = getColor(index);
  const done = habit.is_done_today ?? false;
  const progressPct = Math.min(100, Math.max(0, habit.completion_rate));
  const strokeDash = `${(progressPct / 100) * 97.4} 97.4`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "group position-relative d-flex align-items-center gap-4 rounded-5 border border-border/60 bg-white p-4 transition-smooth hover:border-border hover:shadow-soft",
        done && "bg-gradient-soft"
      )}
    >
      {/* Check / toggle button */}
      <TaskCompleteToggle
        checked={done}
        onToggle={() => onToggle?.(habit.habit_id)}
        disabled={disabled}
        className={cn("h-11 w-11 rounded-4", !done && "group-hover:border-primary/50")}
        ariaLabel={done ? "Marquer incomplet" : "Marquer complet"}
      />

      {/* Content */}
      <div className="min-w-0 flex-fill">
        <div className="d-flex align-items-center gap-2">
          <h4 className={cn("text-truncate text-sm fw-semibold text-body", done && "text-muted line-through decoration-2")}>
            {habit.habit_nom}
          </h4>
        </div>
        <div className="mt-1.5 d-flex align-items-center gap-2.5">
          <span
            className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] fw-semibold"
            style={{ backgroundColor: `${color.replace(")", " / 0.12)")}`, color }}
          >
            <Icon className="h-2.5 w-2.5" />
            {habit.statut === "active" ? "Actif" : habit.statut}
          </span>
          <span className="d-inline-flex align-items-center gap-1 text-xs fw-medium text-muted">
            <Flame className="h-3 w-3 text-streak" /> {habit.current_streak}j
          </span>
        </div>
      </div>

      {/* Progress ring */}
      <div className="position-relative d-none d-sm-block flex-shrink-0" style={{ width: '3rem', height: '3rem' }}>
        <svg className="h-100 w-100" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={strokeDash}
            className="transition-all-custom duration-700"
          />
        </svg>
        <span className="position-absolute inset-0 d-flex align-items-center justify-content-center fw-bold text-body" style={{ fontSize: '10px' }}>
          {Math.round(progressPct)}%
        </span>
      </div>
    </motion.div>
  );
}
