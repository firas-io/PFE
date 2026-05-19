"use client";

import { useMemo, useState } from "react";
import { TicketCard } from "./TicketCard";
import { TicketDetailModal } from "./TicketDetailModal";
import { TICKET_COLUMNS } from "./tickets.constants";
import type { Ticket, TicketStatus } from "./tickets.types";

interface TicketsBoardProps {
  tickets: Ticket[];
  loading?: boolean;
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: TicketStatus) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onApprove?: (ticket: Ticket) => void;
  detailFooter?: (ticket: Ticket, onClose: () => void) => React.ReactNode;
}

export function TicketsBoard({
  tickets,
  loading,
  isAdmin,
  onStatusChange,
  onDelete,
  onApprove,
  detailFooter,
}: TicketsBoardProps) {
  const [selected, setSelected] = useState<Ticket | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<TicketStatus, Ticket[]> = {
      pending: [],
      in_review: [],
      done: [],
      rejected: [],
    };
    for (const t of tickets) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [tickets]);

  if (loading) {
    return (
      <div className="tkt-board tkt-board--loading">
        {TICKET_COLUMNS.map((col) => (
          <div key={col.id} className="tkt-board-column">
            <div className="tkt-skeleton" style={{ height: 28, marginBottom: 12 }} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="tkt-skeleton tkt-board-card-skeleton" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="tkt-board">
        {TICKET_COLUMNS.map((col) => {
          const items = byStatus[col.id] ?? [];
          return (
            <section key={col.id} className="tkt-board-column" aria-label={col.label}>
              <header className="tkt-board-column-header" style={{ borderTopColor: col.color }}>
                <h3 className="tkt-board-column-title">{col.label}</h3>
                <span className="tkt-board-column-count">{items.length}</span>
              </header>
              <div className="tkt-board-column-body">
                {items.length === 0 ? (
                  <p className="tkt-board-empty-col">Aucun ticket</p>
                ) : (
                  items.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      isAdmin={isAdmin}
                      onOpen={setSelected}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onApprove={onApprove}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <TicketDetailModal
        ticket={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        isAdmin={isAdmin}
        footer={selected && detailFooter ? detailFooter(selected, () => setSelected(null)) : undefined}
      />
    </>
  );
}
