'use client';
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
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

const statusLabel: Record<string, string> = {
  pending: "En attente",
  in_review: "En cours",
  done: "Traité",
  rejected: "Rejeté",
};

const statusStyle: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  in_review: "bg-info/15 text-info border-info/30",
  done: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const priorityColors = [
  "bg-success/15 text-success",
  "bg-info/15 text-info",
  "bg-warning/15 text-warning",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
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
  const user = typeof window !== "undefined" ? getUser<{ firstName?: string; lastName?: string; prenom?: string; nom?: string }>() : null;

  const load = () => {
    apiFetch<Ticket[]>("/category-tickets/my")
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const counts = {
    pending: tickets.filter(t => t.status === "pending").length,
    in_review: tickets.filter(t => t.status === "in_review").length,
    done: tickets.filter(t => t.status === "done").length,
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/category-tickets", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      setTitle("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/category-tickets/${id}`, { method: "DELETE" });
      setTickets(prev => prev.filter(t => t._id !== id));
      setConfirmDeleteId(null);
      toast({ variant: "success", title: "Ticket supprimé" });
    } catch (err) {
      toast({ variant: "error", title: "Erreur de suppression", description: err instanceof Error ? err.message : "Erreur suppression" });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Demandes de fonctionnalités, bugs et retours</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-smooth hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nouveau ticket
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          <h2 className="mb-4 text-base font-bold text-foreground">Créer un ticket</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Titre *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Résumé court…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Que se passe-t-il ?"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Soumettre
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Status KPI cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {(["pending", "in_review", "done"] as const).map((s) => (
          <div key={s} className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{statusLabel[s]}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{counts[s]}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", statusStyle[s])}>
                {s === "done" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : s === "in_review" ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Filter tabs + list */}
      <div className="card-elevated p-5">
        <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
          {(["all", "pending", "in_review", "done", "rejected"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-smooth",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === "all" ? "Tous" : statusLabel[f]}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {filtered.length === 0 && (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Aucun ticket
            </div>
          )}
          <AnimatePresence initial={false}>
          {filtered.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.04 }}
              className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-smooth hover:border-border hover:shadow-soft"
            >
              {/* Main row */}
              <div className="flex items-start gap-3 md:items-center">
                <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0 pt-0.5 md:pt-0 md:w-20">
                  #{t._id.slice(-6).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-foreground">{t.title}</h4>
                  {t.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      statusStyle[t.status] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {statusLabel[t.status] ?? t.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>
                  {t.status === "pending" && confirmDeleteId !== t._id && (
                    <button
                      onClick={() => setConfirmDeleteId(t._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground opacity-0 transition-smooth group-hover:opacity-100 hover:border-destructive hover:text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline delete confirmation */}
              {confirmDeleteId === t._id && (
                <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <span className="flex-1 text-xs font-medium text-destructive">Supprimer ce ticket définitivement ?</span>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="rounded-lg bg-destructive px-3 py-1 text-xs font-bold text-white hover:bg-destructive/90"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {/* Admin note (shown when ticket is resolved/rejected) */}
              {(t.status === "done" || t.status === "rejected") && t.admin_note && (
                <div className="rounded-xl border border-info/25 bg-info/5 px-3 py-2.5">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-info/70">Note de l&apos;admin</p>
                  <p className="text-xs text-foreground">{t.admin_note}</p>
                  {t.resolved_at && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Résolu {formatDate(t.resolved_at)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
