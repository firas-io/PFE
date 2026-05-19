"use client";

import { Eye, Trash2, ArrowRight, Check, X } from "lucide-react";
import { userFirstName, userLastName } from "@/lib/userDisplay";
import type { Ticket } from "./tickets.types";
import { formatRelative, ticketTitle } from "./tickets.constants";

interface TicketCardProps {
  ticket: Ticket;
  isAdmin?: boolean;
  onOpen: (ticket: Ticket) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onApprove?: (ticket: Ticket) => void;
}

export function TicketCard({
  ticket,
  isAdmin,
  onOpen,
  onDelete,
  onStatusChange,
  onApprove,
}: TicketCardProps) {
  const title = ticketTitle(ticket);
  const user = ticket.user;
  const userLabel = user
    ? `${userFirstName(user)} ${userLastName(user)}`.trim()
    : null;

  return (
    <article className="tkt-board-card">
      <div className="tkt-board-card-top">
        <span className="tkt-board-card-id">#{ticket._id.slice(-6).toUpperCase()}</span>
        {ticket.type && (
          <span className={`tkt-board-card-type tkt-board-card-type--${ticket.type}`}>
            {ticket.type === "habitude" ? "Habitude" : "Catégorie"}
          </span>
        )}
      </div>

      <button type="button" className="tkt-board-card-title" onClick={() => onOpen(ticket)}>
        {title}
      </button>

      {ticket.description && (
        <p className="tkt-board-card-desc">{ticket.description}</p>
      )}

      {isAdmin && userLabel && (
        <p className="tkt-board-card-user">{userLabel}</p>
      )}

      <div className="tkt-board-card-meta">
        <span>{formatRelative(ticket.createdAt)}</span>
        {ticket.scope === "team" && <span className="tkt-board-scope">Équipe</span>}
      </div>

      <div className="tkt-board-card-actions">
        <button type="button" className="tkt-board-btn tkt-board-btn--ghost" onClick={() => onOpen(ticket)} title="Détails">
          <Eye size={14} />
          <span>Détails</span>
        </button>

        {isAdmin && ticket.status === "pending" && onStatusChange && (
          <button
            type="button"
            className="tkt-board-btn tkt-board-btn--primary"
            onClick={() => onStatusChange(ticket._id, "in_review")}
          >
            <ArrowRight size={14} />
            <span>Révision</span>
          </button>
        )}

        {isAdmin && ticket.status === "in_review" && (
          <>
            {onApprove && (
              <button type="button" className="tkt-board-btn tkt-board-btn--success" onClick={() => onApprove(ticket)}>
                <Check size={14} />
                <span>Approuver</span>
              </button>
            )}
            {onStatusChange && (
              <button
                type="button"
                className="tkt-board-btn tkt-board-btn--danger"
                onClick={() => onStatusChange(ticket._id, "rejected")}
              >
                <X size={14} />
                <span>Rejeter</span>
              </button>
            )}
          </>
        )}

        {!isAdmin && ticket.status === "pending" && onDelete && (
          <button
            type="button"
            className="tkt-board-btn tkt-board-btn--danger"
            onClick={() => onDelete(ticket._id)}
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
