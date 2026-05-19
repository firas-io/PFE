"use client";

import { Modal } from "@/components/Modal";
import { userFirstName, userLastName } from "@/lib/userDisplay";
import type { Ticket } from "./tickets.types";
import { STATUS_LABEL, formatTicketDate, ticketTitle } from "./tickets.constants";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  footer?: React.ReactNode;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tkt-detail-row">
      <span className="tkt-detail-label">{label}</span>
      <div className="tkt-detail-value">{children}</div>
    </div>
  );
}

export function TicketDetailModal({ ticket, open, onClose, isAdmin, footer }: TicketDetailModalProps) {
  if (!ticket) return null;

  const user = ticket.user;
  const userLabel = user
    ? `${userFirstName(user)} ${userLastName(user)}`.trim() || user.email
    : null;

  return (
    <Modal
      open={open}
      title={ticketTitle(ticket)}
      subtitle={`#${ticket._id.slice(-6).toUpperCase()} · ${STATUS_LABEL[ticket.status]}`}
      onClose={onClose}
      size="lg"
      footer={footer}
    >
      <div className="tkt-detail-body">
        <DetailRow label="Statut">
          <span className={`tkt-badge tkt-badge--${ticket.status}`}>{STATUS_LABEL[ticket.status]}</span>
        </DetailRow>

        {isAdmin && userLabel && (
          <DetailRow label="Demandeur">
            <div>
              <div className="fw-semibold">{userLabel}</div>
              {user?.email && <div className="text-secondary small">{user.email}</div>}
            </div>
          </DetailRow>
        )}

        <DetailRow label="Type">
          {ticket.type === "habitude" ? "Habitude" : "Catégorie"}
        </DetailRow>

        {ticket.scope && (
          <DetailRow label="Portée">
            {ticket.scope === "team" ? "Équipe" : "Personnel"}
          </DetailRow>
        )}

        <DetailRow label="Créé le">{formatTicketDate(ticket.createdAt)}</DetailRow>

        {ticket.description && (
          <DetailRow label="Description">
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>
          </DetailRow>
        )}

        {ticket.proposed_category_name && (
          <DetailRow label="Catégorie proposée">{ticket.proposed_category_name}</DetailRow>
        )}

        {ticket.habit_data && (
          <DetailRow label="Données habitude">
            <ul className="mb-0 ps-3 small">
              {ticket.habit_data.nom && <li><strong>Nom :</strong> {ticket.habit_data.nom}</li>}
              {ticket.habit_data.categorie && <li><strong>Catégorie :</strong> {ticket.habit_data.categorie}</li>}
              {ticket.habit_data.frequence && <li><strong>Fréquence :</strong> {ticket.habit_data.frequence}</li>}
              {ticket.habit_data.priorite && <li><strong>Priorité :</strong> {ticket.habit_data.priorite}</li>}
              {ticket.habit_data.description && <li>{ticket.habit_data.description}</li>}
            </ul>
          </DetailRow>
        )}

        {ticket.admin_note && (
          <div className="tkt-admin-note mt-2">
            <p className="tkt-admin-note-label">Note administrateur</p>
            <p className="tkt-admin-note-text">{ticket.admin_note}</p>
            {ticket.resolved_at && (
              <p className="tkt-admin-note-time">Résolu le {formatTicketDate(ticket.resolved_at)}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
