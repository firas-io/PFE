'use client';

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { TicketsBoard } from "@/components/tickets/TicketsBoard";
import type { Ticket } from "@/components/tickets/tickets.types";

type ModalType = "categorie" | null;

export default function TicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch<Ticket[]>("/category-tickets/my")
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!description.trim()) {
      setFormError("La description est requise.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/category-tickets", {
        method: "POST",
        body: JSON.stringify({
          type: "categorie",
          requested_name: title.trim(),
          description: description.trim(),
        }),
      });
      setTitle("");
      setDescription("");
      setActiveModal(null);
      load();
      toast({ variant: "success", title: "Ticket créé" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce ticket ?")) return;
    try {
      await apiFetch(`/category-tickets/${id}`, { method: "DELETE" });
      setTickets((prev) => prev.filter((t) => t._id !== id));
      toast({ variant: "success", title: "Ticket supprimé" });
    } catch (err) {
      toast({ variant: "error", title: "Erreur", description: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <div className="tkt-page tkt-page--board">
      <div className="tkt-header">
        <div>
          <h1 className="tkt-title">Tickets</h1>
          <p className="tkt-subtitle">Suivez vos demandes par statut — style tableau Kanban</p>
        </div>
        <button
          type="button"
          onClick={() => { setActiveModal("categorie"); setFormError(null); }}
          className="tkt-btn-new"
        >
          <Plus size={15} /> Nouveau ticket
        </button>
      </div>

      <AnimatePresence>
        {activeModal === "categorie" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="tkt-form-card"
          >
            <h2>Créer un ticket de catégorie</h2>
            <form onSubmit={handleCreate}>
              <div className="tkt-form-group">
                <label className="tkt-form-label">Titre *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Résumé court…"
                  className="tkt-form-input"
                />
              </div>
              <div className="tkt-form-group">
                <label className="tkt-form-label">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Décrivez votre demande…"
                  className="tkt-form-textarea"
                  required
                />
              </div>
              {formError && <p className="tkt-form-error">{formError}</p>}
              <div className="tkt-form-actions">
                <button type="button" onClick={() => { setActiveModal(null); setFormError(null); }} className="tkt-btn-cancel">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="tkt-btn-submit">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Soumettre
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <TicketsBoard
        tickets={tickets}
        loading={loading}
        onDelete={handleDelete}
      />
    </div>
  );
}
