'use client';
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface Ticket {
  _id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_review" | "done" | "rejected";
  admin_note?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  createdAt: string;
}

type FilterStatus = "all" | "pending" | "in_review" | "done" | "rejected";

const STATUS_LABEL: Record<string, string> = {
  pending:   "En attente",
  in_review: "En cours",
  done:      "Traité",
  rejected:  "Rejeté",
};

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

export default function Tickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = () => {
    apiFetch<Ticket[]>("/category-tickets/my")
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    pending:   tickets.filter(t => t.status === "pending").length,
    in_review: tickets.filter(t => t.status === "in_review").length,
    done:      tickets.filter(t => t.status === "done").length,
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true); setFormError(null);
    try {
      await apiFetch("/category-tickets", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      setTitle(""); setDescription(""); setShowForm(false); load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/category-tickets/${id}`, { method: "DELETE" });
      setTickets(prev => prev.filter(t => t._id !== id));
      setConfirmDeleteId(null);
      toast({ variant: "success", title: "Ticket supprimé" });
    } catch (err) {
      toast({ variant: "error", title: "Erreur", description: err instanceof Error ? err.message : undefined });
    }
  };

  if (loading) {
    return (
      <div className="tkt-page">
        <div className="tkt-skeleton mb-4" style={{ height: 36, width: 200 }} />
        <div className="tkt-kpi-grid">
          {[0, 1, 2].map(i => <div key={i} className="tkt-skeleton" style={{ height: 90 }} />)}
        </div>
        <div>
          {[0, 1, 2, 3].map(i => <div key={i} className="tkt-skeleton mb-2" style={{ height: 64 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="tkt-page">

      {/* Header */}
      <div className="tkt-header">
        <div>
          <h1 className="tkt-title">Tickets</h1>
          <p className="tkt-subtitle">Demandes, bugs et retours</p>
        </div>
        <button onClick={() => setShowForm(true)} className="tkt-btn-new">
          <Plus size={15} /> Nouveau ticket
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="tkt-form-card"
          >
            <h2>Créer un ticket</h2>
            <form onSubmit={handleCreate}>
              <div className="tkt-form-group">
                <label className="tkt-form-label">Titre *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="Résumé court…"
                  className="tkt-form-input"
                />
              </div>
              <div className="tkt-form-group">
                <label className="tkt-form-label">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Que se passe-t-il ?"
                  className="tkt-form-textarea"
                />
              </div>
              {formError && <p className="tkt-form-error">{formError}</p>}
              <div className="tkt-form-actions">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(null); }}
                  className="tkt-btn-cancel"
                >
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

      {/* KPI cards */}
      <div className="tkt-kpi-grid">
        {(["pending", "in_review", "done"] as const).map((s) => (
          <div key={s} className="tkt-kpi-card">
            <div>
              <p className="tkt-kpi-label">{STATUS_LABEL[s]}</p>
              <p className="tkt-kpi-value">{counts[s]}</p>
            </div>
            <div className={`tkt-kpi-icon tkt-kpi-icon--${s}`}>
              {s === "done"      ? <CheckCircle2 size={18} />
               : s === "in_review" ? <Eye size={18} />
               : <Clock size={18} />}
            </div>
          </div>
        ))}
      </div>

      {/* List card */}
      <div className="tkt-list-card">
        {/* Filter tabs */}
        <div className="tkt-tabs">
          {(["all", "pending", "in_review", "done", "rejected"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`tkt-tab${filter === f ? " is-active" : ""}`}
            >
              {f === "all" ? "Tous" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 && <div className="tkt-empty">Aucun ticket</div>}
        <AnimatePresence initial={false}>
          {filtered.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.04 }}
              className="tkt-row"
            >
              <div className="tkt-row-main">
                <span className="tkt-row-id">#{t._id.slice(-6).toUpperCase()}</span>
                <div className="tkt-row-body">
                  <p className="tkt-row-title">{t.title}</p>
                  {t.description && <p className="tkt-row-desc">{t.description}</p>}
                </div>
                <div className="tkt-row-meta">
                  <span className={`tkt-badge tkt-badge--${t.status}`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  <span className="tkt-row-time">{formatDate(t.createdAt)}</span>
                  {t.status === "pending" && confirmDeleteId !== t._id && (
                    <button
                      onClick={() => setConfirmDeleteId(t._id)}
                      className="tkt-btn-delete"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Delete confirmation */}
              {confirmDeleteId === t._id && (
                <div className="tkt-delete-confirm">
                  <p className="tkt-delete-confirm-text">Supprimer ce ticket définitivement ?</p>
                  <button onClick={() => handleDelete(t._id)} className="tkt-btn-confirm-delete">Confirmer</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="tkt-btn-confirm-cancel">Annuler</button>
                </div>
              )}

              {/* Admin note */}
              {(t.status === "done" || t.status === "rejected") && t.admin_note && (
                <div className="tkt-admin-note">
                  <p className="tkt-admin-note-label">Note de l&apos;admin</p>
                  <p className="tkt-admin-note-text">{t.admin_note}</p>
                  {t.resolved_at && (
                    <p className="tkt-admin-note-time">Résolu {formatDate(t.resolved_at)}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
