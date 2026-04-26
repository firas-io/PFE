'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, CalendarDays, Check, ChevronDown, Circle,
  Copy, FileText, Flame, Pause, Pencil, Play,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCategories } from '@/hooks/useCategories';
import { resolveLucideIcon } from '@/components/habits/resolveLucideIcon';
import { FREQUENCY_LABELS, PRIORITY_LABELS } from '../../_constants';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ children, className, style }) => (
  <span
    style={style}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold leading-none',
      className
    )}
  >
    {children}
  </span>
);

// ─── Action button ────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, disabled, title, danger, warn, info, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'flex h-9 w-9 items-center justify-center rounded-xl border-2 text-muted-foreground transition-all duration-150',
      'hover:scale-105 active:scale-95',
      'disabled:pointer-events-none disabled:opacity-35',
      danger && 'hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
      warn  && 'hover:border-warning/50 hover:bg-warning/10 hover:text-warning',
      info  && 'border-info/40 bg-info/5 text-info hover:bg-info/15 hover:border-info/60',
      !danger && !warn && !info && 'border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
    )}
  >
    {children}
  </button>
);

// ─── Date editor ──────────────────────────────────────────────────────────────
function DateCell({ habit, disabled, onUpdateDate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const open   = () => { setDraft(habit.date_debut ? habit.date_debut.split('T')[0] : ''); setEditing(true); };
  const save   = () => { onUpdateDate(habit._id, draft); setEditing(false); };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={save}   disabled={disabled} className="rounded-lg bg-success/15 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/25 transition-colors">✓</button>
        <button onClick={cancel} disabled={disabled} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-border transition-colors">✕</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-40"
      title="Modifier la date de début"
    >
      <CalendarDays className="h-3.5 w-3.5 opacity-60" />
      {habit.date_debut
        ? new Date(habit.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        : 'Date de début'}
    </button>
  );
}

// ─── Weekly grid ──────────────────────────────────────────────────────────────
function WeeklyGrid({ weeklyCompletion, todayIndex, onToggleDay, disabled }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
        Cette semaine
      </p>
      <div className="flex items-end gap-2">
        {DAY_LABELS.map((label, i) => {
          const isDone  = weeklyCompletion[i] === true;
          const isToday = i === todayIndex;

          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  'text-[11px] font-bold leading-none',
                  isToday ? 'text-primary' : 'text-muted-foreground/60'
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
                  'flex w-full aspect-square items-center justify-center rounded-xl border-2 transition-all duration-200',
                  'disabled:pointer-events-none disabled:opacity-40',
                  isDone
                    ? 'border-success/70 bg-success text-white shadow-md'
                    : isToday
                    ? 'border-primary/60 bg-primary/8 text-primary hover:bg-primary/15 shadow-sm'
                    : 'border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/60'
                )}
                style={{ minHeight: '44px' }}
              >
                {isDone
                  ? <Check className="h-5 w-5" strokeWidth={3} />
                  : <span className={cn('block h-2 w-2 rounded-sm', isToday ? 'bg-primary/60' : 'bg-muted-foreground/25')} />}
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────
export function HabitCard({
  habit,
  index = 0,
  todayStatus,
  disabled,
  weeklyCompletion = [false, false, false, false, false, false, false],
  todayIndex,
  onEdit,
  onClone,
  onTogglePause,
  onArchive,
  onNotes,
  onUpdateDate,
  onToggleDay,
}) {
  const { getBySlug } = useCategories();
  const [expanded, setExpanded] = useState(false);

  const category = getBySlug(habit.categorie ?? '');
  const catColor = category?.color ?? '#6b7280';
  const CatIcon  = resolveLucideIcon(category?.icon ?? 'Circle');

  const isCompleted = todayStatus?.statut === 'completee';
  const isArchived  = habit.statut === 'archived';
  const isPaused    = habit.statut === 'pause';
  const isActive    = habit.statut === 'active' || !habit.statut;

  const localStreak = useMemo(() => {
    let count = 0;
    for (let i = todayIndex; i >= 0; i--) {
      if (weeklyCompletion[i]) count++;
      else break;
    }
    return count;
  }, [weeklyCompletion, todayIndex]);

  return (
    <motion.article
      key={habit._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 bg-card',
        'shadow-md hover:shadow-xl transition-shadow duration-300',
        isCompleted ? 'border-success/40' : 'border-border/70',
        isArchived && 'opacity-55'
      )}
    >
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: catColor }}
        aria-hidden
      />

      <div className="pl-1.5">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">

          {/* Category icon */}
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: catColor }}
            aria-hidden
          >
            <CatIcon className="h-7 w-7" />
          </span>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'text-base font-extrabold tracking-tight text-foreground',
                  isCompleted && 'text-muted-foreground line-through decoration-2'
                )}
              >
                {habit.nom || habit.titre || 'Habitude'}
              </h3>
              {habit.visible_pour_tous && (
                <Badge className="bg-primary/10 text-primary text-[10px] px-2 py-0.5">🌐 Public</Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {habit.frequence && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {FREQUENCY_LABELS[habit.frequence] || habit.frequence}
                </span>
              )}
              {habit.priorite === 'high' && (
                <Badge className="bg-destructive/10 text-destructive">
                  ⚑ {PRIORITY_LABELS[habit.priorite]}
                </Badge>
              )}
              {habit.priorite === 'medium' && (
                <Badge className="bg-warning/10 text-warning">
                  ⚑ {PRIORITY_LABELS[habit.priorite]}
                </Badge>
              )}
              {localStreak > 0 && (
                <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5" />
                  {localStreak} jour{localStreak > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: badges column */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {category && (
              <Badge style={{ backgroundColor: `${catColor}22`, color: catColor }}>
                {category.label}
              </Badge>
            )}
            <Badge
              className={cn(
                isPaused   ? 'bg-warning/15 text-warning'     :
                isArchived ? 'bg-muted text-muted-foreground' :
                             'bg-success/15 text-success'
              )}
            >
              {isPaused ? '⏸ Pause' : isArchived ? '⬜ Archivé' : '● Actif'}
            </Badge>
            <Badge
              className={cn(
                isCompleted ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted
                ? <><Check className="h-3 w-3" strokeWidth={3} /> Fait aujourd&apos;hui</>
                : <><Circle className="h-3 w-3" /> À faire</>}
            </Badge>
          </div>
        </div>

        {/* ── WEEKLY GRID ──────────────────────────────────────────────────── */}
        <div className="px-5 pb-5">
          <WeeklyGrid
            weeklyCompletion={weeklyCompletion}
            todayIndex={todayIndex}
            onToggleDay={(i) => onToggleDay(habit._id, i)}
            disabled={disabled}
          />
        </div>

        {/* ── EXPANDABLE DETAILS ────────────────────────────────────────────── */}
        {(habit.note || habit.description || habit.objectif_detail) && (
          <>
            <div className="border-t border-border/30 px-5">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center gap-2 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')} />
                {expanded ? 'Masquer les détails' : 'Voir les détails'}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 px-5 pb-4">
                    {habit.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{habit.description}</p>
                    )}
                    {habit.objectif_detail && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Objectif : </span>
                        {habit.objectif_detail}
                      </p>
                    )}
                    {habit.note && (
                      <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Note : </span>
                        {habit.note}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-muted/[0.04] px-5 py-3">
          <DateCell habit={habit} disabled={disabled} onUpdateDate={onUpdateDate} />
          <div className="ml-auto flex items-center gap-1.5">
            <ActionBtn onClick={() => onEdit(habit)} disabled={disabled} title="Modifier">
              <Pencil className="h-4 w-4" />
            </ActionBtn>
            <ActionBtn onClick={() => onClone(habit._id)} disabled={disabled} title="Dupliquer">
              <Copy className="h-4 w-4" />
            </ActionBtn>
            {isActive ? (
              <ActionBtn onClick={() => onTogglePause(habit._id, 'pause')} disabled={disabled} title="Mettre en pause" warn>
                <Pause className="h-4 w-4" />
              </ActionBtn>
            ) : (
              <ActionBtn onClick={() => onTogglePause(habit._id, 'active')} disabled={disabled} title="Reprendre">
                <Play className="h-4 w-4" />
              </ActionBtn>
            )}
            <ActionBtn onClick={() => onNotes(habit)} disabled={disabled} title={habit.note ? 'Modifier les notes' : 'Ajouter des notes'} info={!!habit.note}>
              <FileText className="h-4 w-4" />
            </ActionBtn>
            {habit.statut !== 'archived' && (
              <ActionBtn onClick={() => onArchive(habit._id)} disabled={disabled} title="Archiver" danger>
                <Archive className="h-4 w-4" />
              </ActionBtn>
            )}
          </div>
        </div>

      </div>
    </motion.article>
  );
}
