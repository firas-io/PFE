"use client";

import type { Category } from "@/src/types/category.types";
import { cn } from "@/lib/cn";
import { resolveLucideIcon } from "./resolveLucideIcon";

export interface CategorySelectorProps {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: Error | null;
  "aria-labelledby"?: string;
}

export function CategorySelector({
  categories,
  value,
  onChange,
  disabled = false,
  loading = false,
  error = null,
  "aria-labelledby": ariaLabelledBy,
}: CategorySelectorProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-4 border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      >
        {error.message}
      </div>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div
        className="d-grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-4 border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="d-grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      role="listbox"
      aria-labelledby={ariaLabelledBy}
    >
      {categories.map((cat) => {
        const Icon = resolveLucideIcon(cat.icon);
        const selected = value === cat.slug;
        return (
          <button
            key={cat.slug}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(cat.slug)}
            className={cn(
              "d-flex flex-column align-items-start gap-2 rounded-4 border p-3 text-left transition-all-custom duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "hover:shadow-soft disabled:pointer-events-none disabled:opacity-50",
              selected ? "shadow" : "border-border/70 bg-white hover:border-border"
            )}
            style={
              selected
                ? {
                    borderColor: cat.color,
                    boxShadow: `0 0 0 2px ${cat.color}55, 0 10px 28px -10px ${cat.color}66`,
                  }
                : undefined
            }
          >
            <span
              className="d-flex h-9 w-9 align-items-center justify-content-center rounded-3 text-white shadow-inner"
              style={{ backgroundColor: cat.color }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs fw-semibold leading-tight text-body">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
