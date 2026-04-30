'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, CalendarDays, Check, ChevronDown,
  Copy, FileText, Flame, Pause, Pencil, Play,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCategories } from '@/hooks/useCategories';
import { resolveLucideIcon } from '@/components/habits/resolveLucideIcon';
import { FREQUENCY_LABELS, PRIORITY_LABELS } from '../../_constants';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_LABELS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Action button (compact) ─────────────────────────────────────────────────
const BTN_STYLES = {
  edit:    'border-indigo-200  bg-indigo-50  text-indigo-500  hover:bg-indigo-100  hover:border-indigo-400',
  clone:   'border-violet-200  bg-violet-50  text-violet-500  hover:bg-violet-100  hover:border-violet-400',
  pause:   'border-amber-200   bg-amber-50   text-amber-500   hover:bg-amber-100   hover:border-amber-400',
  notes:   'border-teal-200    bg-teal-50    text-teal-500    hover:bg-teal-100    hover:border-teal-400',
  archive: 'border-rose-200    bg-rose-50    text-rose-500    hover:bg-rose-100    hover:border-rose-400',
};

const ActionBtn = ({ onClick, disabled, title, variant = 'edit', children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'd-flex h-7 w-7 align-items-center justify-content-center rounded-3 border transition-all-custom duration-150',
      'hover:scale-105 active:scale-95',
      'disabled:pointer-events-none disabled:opacity-35',
      BTN_STYLES[variant] ?? BTN_STYLES.edit
    )}
  >
    {children}
  </button>
);

// ─── Date editor (compact) ────────────────────────────────────────────────────
function DateCell({ habit, disabled, onUpdateDate }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const open   = () => { setDraft(habit.date_debut ? habit.date_debut.split('T')[0] : ''); setEditing(true); };
  const save   = () => { onUpdateDate(habit._id, draft); setEditing(false); };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="d-flex align-items-center gap-1.5">
        <input
          type="date"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={disabled}
          className="rounded border bg-white px-2 py-1 text-xs text-body"
        />
        <button onClick={save}   disabled={disabled} className="rounded bg-success/15 px-2 py-1 text-xs fw-bold text-success hover:bg-success/25 transition-colors-custom">✓</button>
        <button onClick={cancel} disabled={disabled} className="rounded bg-light px-2 py-1 text-xs text-muted hover:bg-border transition-colors-custom">✕</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={disabled}
      className="d-flex align-items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted hover:bg-muted hover:text-foreground transition-all-custom disabled:opacity-40"
      title="Modifier la date de début"
    >
      <CalendarDays className="h-3 w-3 opacity-60" />
      {habit.date_debut
        ? new Date(habit.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        : 'Date de début'}
    </button>
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

  const hasDetails = !!(habit.note || habit.description || habit.objectif_detail);

  return (
    <motion.article
      key={habit._id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, delay: index * 0.03, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'group position-relative overflow-hidden rounded-4 border bg-white',
        'transition-shadow duration-200 hover:shadow-md',
        isCompleted ? 'border-success/40' : 'border-border/60',
        isArchived && 'opacity-55'
      )}
    >
      {/* Left accent bar */}
      <div
        className="position-absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
        style={{ backgroundColor: catColor }}
        aria-hidden
      />

      {/* ── MAIN ROW ─────────────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 ps-3 pe-4 py-3">

        {/* Category icon (small) */}
        <span
          className="d-flex h-8 w-8 flex-shrink-0 align-items-center justify-content-center rounded-3 text-white shadow-sm"
          style={{ backgroundColor: catColor }}
          aria-hidden
        >
          <CatIcon className="h-4 w-4" />
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-fill">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h3
              className={cn(
                'text-sm fw-bold leading-tight text-body text-truncate',
                isCompleted && 'text-muted line-through decoration-2'
              )}
            >
              {habit.nom || habit.titre || 'Habitude'}
            </h3>
            {category && (
              <span
                className="flex-shrink-0 rounded-pill px-2 py-0.5 text-[10px] fw-semibold"
                style={{ backgroundColor: `${catColor}22`, color: catColor }}
              >
                {category.label}
              </span>
            )}
          </div>

          <div className="mt-0.5 d-flex align-items-center gap-2 text-xs text-muted">
            {habit.frequence && (
              <span>{FREQUENCY_LABELS[habit.frequence] || habit.frequence}</span>
            )}
            {habit.priorite && habit.priorite !== 'low' && (
              <>
                <span className="opacity-40">·</span>
                <span className={cn(
                  'fw-medium',
                  habit.priorite === 'high' ? 'text-destructive' : 'text-warning'
                )}>
                  ⚑ {PRIORITY_LABELS[habit.priorite]}
                </span>
              </>
            )}
            {localStreak > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="d-flex align-items-center gap-0.5 text-orange-500 fw-semibold">
                  <Flame className="h-3 w-3" />
                  {localStreak} jour{localStreak > 1 ? 's' : ''}
                </span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span className={cn(
              'fw-medium',
              isPaused   ? 'text-warning'          :
              isArchived ? 'text-muted' :
                           'text-success'
            )}>
              {isPaused ? '⏸ Pause' : isArchived ? 'Archivé' : '● Actif'}
            </span>
            {isCompleted && (
              <>
                <span className="opacity-40">·</span>
                <span className="d-flex align-items-center gap-0.5 text-success fw-semibold">
                  <Check className="h-3 w-3" strokeWidth={3} /> Fait
                </span>
              </>
            )}
          </div>
        </div>

        {/* Day letter circles */}
        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {DAY_LETTERS.map((letter, i) => {
            const isDone  = weeklyCompletion[i] === true;
            const isToday = i === todayIndex;
            return (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: 0.82 }}
                onClick={() => onToggleDay(habit._id, i)}
                disabled={disabled}
                title={`${DAY_LABELS[i]} — ${isDone ? 'complété' : 'non complété'}`}
                aria-label={`${DAY_LABELS[i]} — ${isDone ? 'complété' : 'non complété'}`}
                aria-pressed={isDone}
                className={cn(
                  'd-flex h-7 w-7 align-items-center justify-content-center rounded-pill text-[10px] fw-bold border-2 transition-all-custom duration-150',
                  'disabled:pointer-events-none disabled:opacity-40',
                  isDone
                    ? 'border-success bg-success text-white shadow-sm'
                    : isToday
                    ? 'border-primary text-primary bg-primary/8 shadow-sm'
                    : 'border-border/60 text-muted hover:border-primary/40 hover:text-primary/70'
                )}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : letter}
              </motion.button>
            );
          })}
        </div>

        {/* Actions (appear on hover) */}
        <div className="d-flex align-items-center gap-1 flex-shrink-0 ml-1">
          <ActionBtn onClick={() => onEdit(habit)} disabled={disabled} title="Modifier" variant="edit">
            <Pencil className="h-3.5 w-3.5" />
          </ActionBtn>
          <ActionBtn onClick={() => onClone(habit._id)} disabled={disabled} title="Dupliquer" variant="clone">
            <Copy className="h-3.5 w-3.5" />
          </ActionBtn>
          {isActive ? (
            <ActionBtn onClick={() => onTogglePause(habit._id, 'pause')} disabled={disabled} title="Mettre en pause" variant="pause">
              <Pause className="h-3.5 w-3.5" />
            </ActionBtn>
          ) : (
            <ActionBtn onClick={() => onTogglePause(habit._id, 'active')} disabled={disabled} title="Reprendre" variant="pause">
              <Play className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
          <ActionBtn onClick={() => onNotes(habit)} disabled={disabled} title={habit.note ? 'Modifier les notes' : 'Ajouter des notes'} variant="notes">
            <FileText className="h-3.5 w-3.5" />
          </ActionBtn>
          {habit.statut !== 'archived' && (
            <ActionBtn onClick={() => onArchive(habit._id)} disabled={disabled} title="Archiver" variant="archive">
              <Archive className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
        </div>

        {/* Details toggle */}
        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 d-flex h-6 w-6 align-items-center justify-content-center rounded text-muted hover:text-foreground hover:bg-muted transition-all-custom ml-0.5"
            title={expanded ? 'Masquer les détails' : 'Voir les détails'}
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* ── DATE + EXPANDABLE DETAILS ─────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t/30 ps-3 pe-4 py-2 space-y-1.5">
              <DateCell habit={habit} disabled={disabled} onUpdateDate={onUpdateDate} />
              {habit.description && (
                <p className="text-xs text-muted leading-relaxed">{habit.description}</p>
              )}
              {habit.objectif_detail && (
                <p className="text-xs text-muted">
                  <span className="fw-semibold text-body">Objectif : </span>
                  {habit.objectif_detail}
                </p>
              )}
              {habit.note && (
                <div className="rounded-3 border/40 bg-muted/10 px-3 py-2 text-xs text-muted">
                  <span className="fw-semibold text-body">Note : </span>
                  {habit.note}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
