/**
 * Habit category metadata (mirrors GET /categories payload).
 */

export type CategoryLayoutKey =
  | "sport"
  | "study"
  | "wellness"
  | "productivity"
  | "health"
  | "finance"
  | "social"
  | "creativity"
  | "default";

export type CategoryFieldType = "number" | "text" | "duration" | "select" | "boolean";

export interface CategoryFieldOption {
  value: string;
  label: string;
}

export interface CategoryField {
  name: string;
  label: string;
  type: CategoryFieldType;
  unit?: string;
  options?: CategoryFieldOption[];
  required?: boolean;
}

export interface Category {
  slug: string;
  label: string;
  icon: string;
  color: string;
  layout: CategoryLayoutKey;
  description: string;
  fields: CategoryField[];
}

export type CategoryFieldValues = Record<string, string | number | boolean | null | undefined>;
