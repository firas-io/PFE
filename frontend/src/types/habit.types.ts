/**
 * habit.types.ts
 * TypeScript interfaces for Habit-related API data.
 */

/** Slugs officiels + chaîne libre pour données historiques ou futures. */
export type HabitCategorie =
  | "sante"
  | "travail"
  | "apprentissage"
  | "bien_etre"
  | "sport"
  | "finance"
  | "social"
  | "creativite"
  | "autre"
  | (string & {});
export type HabitPriorite = "high" | "medium" | "low";
export type HabitStatut = "active" | "pause" | "archived";
export type HabitFrequence = "daily" | "weekly" | "monthly" | "specific_days" | "times_per_week";
export type HoraireCible = "matin" | "midi" | "soir";
export type LogStatut = "completee" | "partielle" | "non_completee" | "manquee";

export interface Habit {
  _id: string;
  nom: string;
  description?: string;
  categorie?: HabitCategorie;
  categorie_champs?: Record<string, string | number | boolean | null | undefined>;
  statut: HabitStatut;
  priorite?: HabitPriorite;
  frequence?: HabitFrequence;
  jours_specifiques?: string[];
  fois_par_semaine?: number;
  horaires_cibles?: HoraireCible[];
  heure_precise?: string;
  objectif_valeur?: number;
  objectif_unite?: string;
  objectif_detail?: string;
  visible_pour_tous: boolean;
  utilisateur_id: string;
  date_debut?: string;
  dates_specifiques?: string[];
  date_archivage?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  _id: string;
  habit_id: string | Habit;
  utilisateur_id: string;
  date: string;
  statut: LogStatut;
  notes?: string;
  photo_url?: string;
  retroactif?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitTemplate {
  _id: string;
  nom_template: string;
  description?: string;
  categorie?: HabitCategorie;
  priorite?: HabitPriorite;
  frequence?: HabitFrequence;
  jours_specifiques?: string[];
  fois_par_semaine?: number;
  horaires_cibles?: HoraireCible[];
  objectif_valeur?: number;
  objectif_unite?: string;
}

export interface NoteHistory {
  _id: string;
  habit_id: string | Habit;
  utilisateur_id: string;
  old_note?: string;
  new_note?: string;
  note_text?: string;
  action: "created" | "updated";
  createdAt: string;
}

export interface ProgressSummary {
  total_habits: number;
  active_habits: number;
  paused_habits: number;
  archived_habits: number;
  total_logs: number;
  completed_logs: number;
  partial_logs: number;
  completion_rate: number;
  today_logs: number;
  today_completed: number;
  today_rate: number;
}

export interface WeeklyProgressDay {
  date: string;
  label: string;
  total: number;
  completed: number;
  rate: number;
}

export interface HabitProgress {
  habit_id: string;
  habit_nom: string;
  statut: HabitStatut;
  visible_pour_tous: boolean;
  total_logs: number;
  completed_logs: number;
  completion_rate: number;
  last_log_date?: string;
}

export interface ProgressResponse {
  summary: ProgressSummary;
  weekly_progress: WeeklyProgressDay[];
  habits_progress: HabitProgress[];
}
