"use client";

import { motion } from "framer-motion";
import { Archive, Circle, FileText, Pencil } from "lucide-react";
import type { Category } from "@/src/types/category.types";
import { cn } from "@/lib/cn";
import { DynamicFields } from "../DynamicFields";
import { resolveLucideIcon } from "../resolveLucideIcon";
import type { HabitsLayoutProps } from "../layoutTypes";
import { TaskCompleteToggle } from "../TaskCompleteToggle";

function fallbackCategory(slug: string | undefined): Category {
  const s = slug && slug.trim().length ? slug.trim() : "autre";
  return {
    slug: s,
    label: s,
    icon: "Circle",
    color: "#6b7280",
    layout: "default",
    description: "Catégorie personnalisée ou historique — affichage universel.",
    fields: [{ name: "notes", label: "Notes", type: "text" }],
  };
}

/**
 * Carte habitude universelle : toute catégorie (y compris inconnue / futures via tickets).
 */
export default function DefaultLayout({
  habit,
  category,
  fieldValues,
  disabled = false,
  onComplete,
  onEdit,
  onArchive,
  onNotes,
  beforeFields,
  afterFields,
  showFooter = true,
}: HabitsLayoutProps) {
  const cat = category ?? fallbackCategory(habit.categorie ?? undefined);
  const Icon = resolveLucideIcon(cat.icon);
  const title = habit.nom || habit.titre || "Habitude";

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "overflow-hidden rounded-5 border border-border/60 bg-white shadow-soft",
        "transition-shadow duration-300 hover:shadow-md"
      )}
    >
      <header
        className="d-flex align-items-start gap-3 border-b border-border/50 bg-muted/15 px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
      >
        <span
          className="d-flex h-11 w-11 flex-shrink-0 align-items-center justify-content-center rounded-4 text-white shadow-inner"
          style={{ backgroundColor: cat.color }}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-fill">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h3 className="text-truncate text-sm fw-semibold text-body">{title}</h3>
            <span
              className="rounded-pill px-2 py-0.5 text-[10px] fw-bold text-uppercase tracking-wide text-white"
              style={{ backgroundColor: `${cat.color}cc` }}
            >
              {cat.label}
            </span>
            {habit.statut && habit.statut !== "active" && (
              <span className="rounded-pill bg-light px-2 py-0.5 text-[10px] fw-semibold text-muted">
                {habit.statut}
              </span>
            )}
          </div>
          {cat.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted">{cat.description}</p>
          )}
          {habit.description && (
            <p className="mt-1 text-xs text-muted">{habit.description}</p>
          )}
        </div>
      </header>

      <div className="space-y-3 px-4 py-3">
        {beforeFields}
        <section aria-label="Détails de la catégorie">
          <DynamicFields
            categorySlug={cat.slug}
            fields={cat.fields}
            values={fieldValues}
            onChange={() => {}}
            readOnly
            disabled={disabled}
            formIdPrefix={`layout-${habit._id}`}
          />
        </section>
        {habit.note && (
          <div className="rounded-3 border border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted">
            <span className="fw-semibold text-body">Note : </span>
            {habit.note}
          </div>
        )}
        {afterFields}
      </div>

      {showFooter ? (
      <footer className="d-flex flex-wrap align-items-center justify-content-end gap-2 border-t border-border/50 bg-muted/10 px-3 py-2">
        {onComplete && (
          <TaskCompleteToggle
            checked={false}
            onToggle={onComplete}
            disabled={disabled}
            className="h-8 w-8 rounded-3"
            ariaLabel="Marquer comme complétée"
          />
        )}
        {onEdit && (
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="d-inline-flex align-items-center gap-1.5 rounded-3 border border-border bg-white px-3 py-1.5 text-xs fw-semibold text-body transition-colors-custom hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Éditer
          </button>
        )}
        {onNotes && (
          <button
            type="button"
            disabled={disabled}
            onClick={onNotes}
            className="d-inline-flex align-items-center gap-1.5 rounded-3 border border-border bg-white px-3 py-1.5 text-xs fw-semibold text-body transition-colors-custom hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Notes
          </button>
        )}
        {onArchive && habit.statut !== "archived" && (
          <button
            type="button"
            disabled={disabled}
            onClick={onArchive}
            className={cn(
              "d-inline-flex align-items-center gap-1.5 rounded-3 border px-3 py-1.5 text-xs fw-semibold transition-colors-custom",
              "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/35",
              "disabled:opacity-40"
            )}
          >
            <Archive className="h-3.5 w-3.5" aria-hidden />
            Archiver
          </button>
        )}
        {!onComplete && !onEdit && !onArchive && !onNotes && (
          <span className="d-inline-flex align-items-center gap-1 text-[10px] text-muted">
            <Circle className="h-3 w-3" aria-hidden />
            Aperçu
          </span>
        )}
      </footer>
      ) : null}
    </motion.article>
  );
}
