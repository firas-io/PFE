"use client";

import { useMemo } from "react";
import type { CategoryField, CategoryFieldValues } from "@/src/types/category.types";
import { cn } from "@/lib/cn";
import { useCategories } from "@/hooks/useCategories";

export interface DynamicFieldsProps {
  categorySlug: string;
  /** When provided, skips resolving fields from /categories cache. */
  fields?: CategoryField[];
  values: CategoryFieldValues;
  onChange: (next: CategoryFieldValues) => void;
  readOnly?: boolean;
  disabled?: boolean;
  formIdPrefix?: string;
}

function formatDisplay(
  field: CategoryField,
  raw: string | number | boolean | null | undefined
): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.type === "boolean") return raw ? "Oui" : "Non";
  if (field.type === "select" && field.options?.length) {
    const opt = field.options.find((o) => o.value === String(raw));
    return opt?.label ?? String(raw);
  }
  if (field.unit) return `${raw} ${field.unit}`;
  return String(raw);
}

export function DynamicFields({
  categorySlug,
  fields: fieldsProp,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  formIdPrefix = "dyn",
}: DynamicFieldsProps) {
  const { getBySlug, loading } = useCategories();

  const fields = useMemo(() => {
    if (fieldsProp?.length) return fieldsProp;
    return getBySlug(categorySlug)?.fields ?? [];
  }, [fieldsProp, getBySlug, categorySlug]);

  const set = (name: string, v: string | number | boolean | null) => {
    onChange({ ...values, [name]: v });
  };

  if (!fields.length) {
    if (loading && !fieldsProp?.length) {
      return <p className="text-xs text-muted-foreground">Chargement des champs…</p>;
    }
    return null;
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const id = `${formIdPrefix}-${field.name}`;
        const raw = values[field.name];
        const unitSuffix = field.unit ? ` (${field.unit})` : "";

        if (readOnly) {
          return (
            <div key={field.name} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {field.label}
                {unitSuffix}
              </div>
              <div className="mt-0.5 text-sm text-foreground">{formatDisplay(field, raw)}</div>
            </div>
          );
        }

        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={id} className="text-xs font-medium text-foreground">
              {field.label}
              {field.unit ? <span className="text-muted-foreground"> ({field.unit})</span> : null}
              {field.required ? <span className="text-destructive"> *</span> : null}
            </label>

            {field.type === "text" && (
              <input
                id={id}
                type="text"
                className={cn(
                  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
                  "placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                )}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) => set(field.name, e.target.value)}
                disabled={disabled}
                required={field.required}
              />
            )}

            {field.type === "number" && (
              <input
                id={id}
                type="number"
                inputMode="decimal"
                className={cn(
                  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                )}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) => {
                  const n = e.target.value === "" ? null : Number(e.target.value);
                  set(field.name, n === null || Number.isNaN(n) ? null : n);
                }}
                disabled={disabled}
                required={field.required}
              />
            )}

            {field.type === "duration" && (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                className={cn(
                  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                )}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) => {
                  const n = e.target.value === "" ? null : Number(e.target.value);
                  set(field.name, n === null || Number.isNaN(n) ? null : n);
                }}
                disabled={disabled}
                required={field.required}
                aria-describedby={field.unit ? `${id}-hint` : undefined}
              />
            )}

            {field.type === "boolean" && (
              <div className="flex items-center gap-2">
                <input
                  id={id}
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  checked={Boolean(raw)}
                  onChange={(e) => set(field.name, e.target.checked)}
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">Activé</span>
              </div>
            )}

            {field.type === "select" && field.options && (
              <select
                id={id}
                className={cn(
                  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
                  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                )}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) => set(field.name, e.target.value)}
                disabled={disabled}
                required={field.required}
              >
                <option value="">—</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
