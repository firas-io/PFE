export type TicketStatus = "pending" | "in_review" | "done" | "rejected";

export interface TicketUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  prenom?: string;
  nom?: string;
  email?: string;
}

export interface TicketHabitData {
  nom?: string | null;
  categorie?: string | null;
  frequence?: string | null;
  objectif?: string | null;
  priorite?: string | null;
  description?: string | null;
}

export interface Ticket {
  _id: string;
  title?: string;
  requested_name?: string;
  proposed_category_name?: string;
  type?: "categorie" | "habitude" | string;
  description?: string | null;
  status: TicketStatus;
  scope?: "personal" | "team" | string;
  admin_note?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  habit_data?: TicketHabitData | null;
  user?: TicketUser | null;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketColumnDef {
  id: TicketStatus;
  label: string;
  color: string;
}
