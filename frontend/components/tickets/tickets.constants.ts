import type { TicketColumnDef, TicketStatus } from "./tickets.types";

export const TICKET_COLUMNS: TicketColumnDef[] = [
  { id: "pending",   label: "En attente",  color: "#F59E0B" },
  { id: "in_review", label: "En cours",    color: "#3B82F6" },
  { id: "done",      label: "Traité",      color: "#10B981" },
  { id: "rejected",  label: "Rejeté",      color: "#EF4444" },
];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  pending:   "En attente",
  in_review: "En cours",
  done:      "Traité",
  rejected:  "Rejeté",
};

export function ticketTitle(t: { title?: string; requested_name?: string; proposed_category_name?: string }) {
  return t.requested_name || t.title || t.proposed_category_name || "Sans titre";
}

export function formatTicketDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  return `il y a ${Math.floor(hrs / 24)} j`;
}
