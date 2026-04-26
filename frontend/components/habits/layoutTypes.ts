import type { ReactNode } from "react";
import type { Category, CategoryFieldValues } from "@/src/types/category.types";

export interface HabitForLayout {
  _id: string;
  nom: string;
  titre?: string;
  description?: string | null;
  categorie?: string | null;
  categorie_champs?: CategoryFieldValues;
  statut?: string;
  note?: string | null;
}

export interface HabitsLayoutProps {
  habit: HabitForLayout;
  category: Category | null;
  fieldValues: CategoryFieldValues;
  disabled?: boolean;
  /** When false, footer actions are hidden (e.g. external toolbar). */
  showFooter?: boolean;
  onComplete?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onNotes?: () => void;
  beforeFields?: ReactNode;
  afterFields?: ReactNode;
}
