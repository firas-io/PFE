'use client';
import React, { useState } from 'react';
import { Archive, Copy, FileText, MoreHorizontal, Pause, Pencil, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WeeklyCompletionToggle } from './WeeklyCompletionToggle';

const menuItem = (color) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '8px 14px', border: 'none', background: 'none',
  fontSize: 13, fontWeight: 500, color: color || 'var(--hf-text)',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
});

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
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const isActive = !habit.statut || habit.statut === 'active';

  const close = () => setOpen(false);

  return (
    <div className="d-flex align-items-center gap-1">
      {/* Weekly complete toggle stays inline */}
      <WeeklyCompletionToggle
        weeklyCompletion={weeklyCompletion}
        todayIndex={todayIndex}
        onToggleDay={(dayIndex) => onToggleDay(habit._id, dayIndex)}
        disabled={disabled}
      />

      {/* ⋯ menu trigger */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          disabled={disabled}
          title="Actions"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 });
            setOpen((v) => !v);
          }}
          className={cn(
            'd-flex h-8 w-8 align-items-center justify-content-center rounded-3 border border-border text-muted transition-smooth',
            'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {open && (
          <>
            <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 1299 }} />
            <div style={{
              position: 'fixed', top: menuPos.top, left: menuPos.left,
              background: '#fff', border: '1px solid #E8E7F5', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(67,56,202,0.10)', minWidth: 170,
              zIndex: 1300, overflow: 'hidden',
            }}>
              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); onEdit(habit); }}
              >
                <Pencil size={14} style={{ color: '#6366F1' }} /> Modifier
              </button>

              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); onClone(habit._id); }}
              >
                <Copy size={14} style={{ color: '#6366F1' }} /> Dupliquer
              </button>

              <button
                type="button" style={menuItem()}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { close(); onNotes(habit); }}
              >
                <FileText size={14} style={{ color: habit.note ? '#06B6D4' : '#6366F1' }} />
                {habit.note ? 'Modifier les notes' : 'Ajouter des notes'}
              </button>

              <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />

              {isActive ? (
                <button
                  type="button" style={menuItem()}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => { close(); onTogglePause(habit._id, 'pause'); }}
                >
                  <Pause size={14} style={{ color: '#F59E0B' }} /> Mettre en pause
                </button>
              ) : (
                <button
                  type="button" style={menuItem()}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => { close(); onTogglePause(habit._id, 'active'); }}
                >
                  <Play size={14} style={{ color: '#10B981' }} /> Reprendre
                </button>
              )}

              {habit.statut !== 'archived' && (
                <>
                  <div style={{ height: 1, background: '#F0EFF9', margin: '2px 0' }} />
                  <button
                    type="button" style={menuItem('#EF4444')}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    onClick={() => { close(); onArchive(habit._id); }}
                  >
                    <Archive size={14} /> Archiver
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
