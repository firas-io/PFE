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
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft",
        "transition-shadow duration-300 hover:shadow-md"
      )}
    >
      <header
        className="flex items-start gap-3 border-b border-border/50 bg-muted/15 px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-inner"
          style={{ backgroundColor: cat.color }}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: `${cat.color}cc` }}
            >
              {cat.label}
            </span>
            {habit.statut && habit.statut !== "active" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {habit.statut}
              </span>
            )}
          </div>
          {cat.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
          )}
          {habit.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">{habit.description}</p>
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
          <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Note : </span>
            {habit.note}
          </div>
        )}
        {afterFields}
      </div>

      {showFooter ? (
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 bg-muted/10 px-3 py-2">
        {onComplete && (
          <TaskCompleteToggle
            checked={false}
            onToggle={onComplete}
            disabled={disabled}
            className="h-8 w-8 rounded-lg"
            ariaLabel="Marquer comme complétée"
          />
        )}
        {onEdit && (
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
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
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
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
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Circle className="h-3 w-3" aria-hidden />
            Aperçu
          </span>
        )}
      </footer>
      ) : null}
    </motion.article>
  );
}
