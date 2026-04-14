"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { IconArchive, IconCopy, IconEdit, IconPlayerPause, IconPlayerPlay, IconPlus, IconTemplate, IconTrash } from "@tabler/icons-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Habit = {
  _id: string;
  nom: string;
  description?: string;
  categorie?: "sante" | "travail" | "apprentissage" | "bien_etre" | "sport" | "autre";
  frequence?: "daily" | "weekly" | "monthly" | "specific_days" | "times_per_week";
  jours_specifiques?: string[];
  fois_par_semaine?: number;
  horaires_cibles?: Array<"matin" | "midi" | "soir">;
  heure_precise?: string;
  priorite?: "high" | "medium" | "low";
  objectif_detail?: string;
  date_debut?: string;
  statut?: "active" | "pause" | "archived";
  visible_pour_tous?: boolean;
};

type HabitTemplate = {
  _id: string;
  nom_template: string;
  description?: string;
  categorie?: Habit["categorie"];
};

type HabitForm = {
  nom: string;
  description: string;
  categorie: string;
  frequence: string;
  jours_specifiques: string[];
  fois_par_semaine: string;
  horaires_cibles: string[];
  heure_precise: string;
  priorite: string;
  objectif_quantifiable: string;
  date_debut: string;
  visible_pour_tous: boolean;
};

type HabitSort = "recent" | "priority_desc" | "priority_asc" | "status";

function labelCategorie(value?: Habit["categorie"]) {
  const map: Record<string, string> = {
    sante: "Sante",
    travail: "Travail",
    apprentissage: "Apprentissage",
    bien_etre: "Bien-etre",
    sport: "Sport",
    autre: "Autre"
  };
  return value ? map[value] || value : "-";
}

function labelFrequence(value?: Habit["frequence"]) {
  const map: Record<string, string> = {
    daily: "Quotidienne",
    weekly: "Hebdomadaire",
    monthly: "Mensuelle",
    specific_days: "Jours specifiques",
    times_per_week: "X fois/semaine"
  };
  return value ? map[value] || value : "-";
}

function labelPriorite(value?: Habit["priorite"]) {
  const map: Record<string, string> = {
    high: "Haute",
    medium: "Moyenne",
    low: "Basse"
  };
  return value ? map[value] || value : "-";
}

function labelStatut(value?: Habit["statut"]) {
  const map: Record<string, string> = {
    active: "Active",
    pause: "En pause",
    archived: "Archivee"
  };
  return map[value || "active"] || value || "Active";
}

function statusRank(value?: Habit["statut"]) {
  if (value === "active" || !value) return 0;
  if (value === "pause") return 1;
  return 2;
}

function priorityRank(value?: Habit["priorite"]) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!props.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [props.open]);

  if (!isBrowser || !props.open) return null;

  const sizeClass = props.size === "lg" ? "modal-dialog modal-lg" : "modal-dialog";
  return createPortal(
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={props.onClose}>
        <div className={sizeClass} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title h5">{props.title}</div>
                {props.subtitle ? <div className="text-secondary small">{props.subtitle}</div> : null}
              </div>
              <button type="button" className="btn-close" onClick={props.onClose} aria-label="Close" />
            </div>
            <div className="modal-body">{props.children}</div>
            {props.footer ? <div className="modal-footer">{props.footer}</div> : null}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body
  );
}

const emptyForm: HabitForm = {
  nom: "",
  description: "",
  categorie: "autre",
  frequence: "daily",
  jours_specifiques: [],
  fois_par_semaine: "",
  horaires_cibles: [],
  heure_precise: "",
  priorite: "medium",
  objectif_quantifiable: "",
  date_debut: "",
  visible_pour_tous: false
};

function HabitVisibilitySection(props: {
  idPrefix: string;
  visiblePourTous: boolean;
  setVisiblePourTous: (v: boolean) => void;
}) {
  const base = props.idPrefix;
  return (
    <div className="col-12">
      <div className="border border-primary border-opacity-25 rounded-3 p-3 bg-primary bg-opacity-10">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="badge bg-primary">Visibilité</span>
          <span className="fw-semibold">Qui voit cette habitude dans « mes habitudes » ?</span>
        </div>
        <p className="text-secondary small mb-3 mb-md-4">
          Par défaut, les nouvelles habitudes sont proposées à <strong>tous les utilisateurs</strong>. Choisissez « Administrateur uniquement » pour une habitude privée (visible seulement sur votre compte).
        </p>
        <div className="vstack gap-3">
          <div className="form-check p-3 rounded-2 border bg-body">
            <input
              className="form-check-input"
              type="radio"
              name={`${base}-audience`}
              id={`${base}-audience-me`}
              checked={!props.visiblePourTous}
              onChange={() => props.setVisiblePourTous(false)}
            />
            <label className="form-check-label w-100" htmlFor={`${base}-audience-me`}>
              <span className="fw-medium d-block">Administrateur uniquement</span>
              <span className="text-secondary small d-block mt-1">
                Visible uniquement pour votre compte administrateur ; les autres utilisateurs ne voient pas cette habitude.
              </span>
            </label>
          </div>
          <div className="form-check p-3 rounded-2 border bg-body">
            <input
              className="form-check-input"
              type="radio"
              name={`${base}-audience`}
              id={`${base}-audience-all`}
              checked={props.visiblePourTous}
              onChange={() => props.setVisiblePourTous(true)}
            />
            <label className="form-check-label w-100" htmlFor={`${base}-audience-all`}>
              <span className="fw-medium d-block">Tous les utilisateurs</span>
              <span className="text-secondary small d-block mt-1">
                Chaque utilisateur voit cette habitude dans sa propre liste (en plus des siennes). Idéal pour des habitudes proposées par l’organisation.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitsAdminPageContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pause" | "archived">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<HabitSort>("recent");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVisiblePourTous, setTemplateVisiblePourTous] = useState(true);
  const [form, setForm] = useState<HabitForm>(emptyForm);

  function msg(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitData, templateData] = await Promise.all([
        apiFetch<Habit[]>("/habits?includeArchived=true"),
        apiFetch<HabitTemplate[]>("/habits/templates")
      ]);
      setHabits(habitData);
      setTemplates(templateData);
      if (!selectedTemplateId && templateData.length) setSelectedTemplateId(templateData[0]._id);
    } catch (err: unknown) {
      const errorMessage = msg(err, "Impossible de charger les habitudes.");
      setError(errorMessage);
      // If it's a permission error, show a more specific message
      if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
        setError("Accès refusé. Vous devez être administrateur pour voir toutes les habitudes.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  const displayedHabits = useMemo(() => {
    let list = habits.slice();

    // Check if active filter query parameter is set
    const showActiveOnly = searchParams?.get("active") === "true";
    const filterStatut = showActiveOnly ? "active" : statusFilter;

    if (filterStatut !== "all") {
      list = list.filter((h) => (h.statut || "active") === filterStatut);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((h) => {
        const title = (h.nom || "").toLowerCase();
        const desc = (h.description || "").toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    if (sortBy === "priority_desc") {
      list.sort((a, b) => priorityRank(b.priorite) - priorityRank(a.priorite));
    } else if (sortBy === "priority_asc") {
      list.sort((a, b) => priorityRank(a.priorite) - priorityRank(b.priorite));
    } else if (sortBy === "status") {
      list.sort((a, b) => statusRank(a.statut) - statusRank(b.statut));
    } else {
      list.reverse();
    }

    return list;
  }, [habits, statusFilter, search, sortBy, searchParams]);

  function openCreate() {
    setSelectedHabit(null);
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(habit: Habit) {
    setSelectedHabit(habit);
    setForm({
      nom: habit.nom || "",
      description: habit.description || "",
      categorie: habit.categorie || "autre",
      frequence: habit.frequence || "daily",
      jours_specifiques: habit.jours_specifiques || [],
      fois_par_semaine: habit.fois_par_semaine ? String(habit.fois_par_semaine) : "",
      horaires_cibles: habit.horaires_cibles || [],
      heure_precise: habit.heure_precise || "",
      priorite: habit.priorite || "medium",
      objectif_quantifiable: habit.objectif_detail || "",
      date_debut: habit.date_debut || "",
      visible_pour_tous: habit.visible_pour_tous === true
    });
    setEditOpen(true);
  }

  function updateForm<K extends keyof HabitForm>(key: K, value: HabitForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toPayload(current: HabitForm) {
    return {
      nom: current.nom.trim(),
      description: current.description.trim() || undefined,
      categorie: current.categorie,
      frequence: current.frequence,
      jours_specifiques: current.frequence === "specific_days" ? current.jours_specifiques : undefined,
      fois_par_semaine:
        current.frequence === "times_per_week" && current.fois_par_semaine ? Number(current.fois_par_semaine) : undefined,
      horaires_cibles: current.horaires_cibles.length ? current.horaires_cibles : undefined,
      heure_precise: current.heure_precise || undefined,
      date_debut: current.date_debut || undefined,
      priorite: current.priorite,
      objectif_quantifiable: current.objectif_quantifiable.trim() || undefined,
      visible_pour_tous: current.visible_pour_tous
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/habits", { method: "POST", body: JSON.stringify(toPayload(form)) });
      setCreateOpen(false);
      setForm(emptyForm);
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors de la création de l'habitude."));
    } finally {
      setLoading(false);
    }
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedHabit) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/${selectedHabit._id}`, { method: "PUT", body: JSON.stringify(toPayload(form)) });
      setEditOpen(false);
      setSelectedHabit(null);
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors de la modification de l'habitude."));
    } finally {
      setLoading(false);
    }
  }

  async function cloneHabit(habitId: string) {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/${habitId}/clone`, { method: "POST" });
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors du clonage."));
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(habitId: string, status: "active" | "pause" | "archived") {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/${habitId}/status`, { method: "PATCH", body: JSON.stringify({ statut: status }) });
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors du changement de statut."));
    } finally {
      setLoading(false);
    }
  }

  async function archiveHabit(habitId: string) {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/${habitId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut: "archived" }),
      });
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors de l'archivage."));
    } finally {
      setLoading(false);
    }
  }

  async function hardDeleteHabit(habitId: string) {
    if (!confirm("Supprimer définitivement cette habitude ? Cette action est irréversible.")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/${habitId}/hard`, { method: "DELETE" });
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors de la suppression définitive."));
    } finally {
      setLoading(false);
    }
  }

  async function createFromTemplate() {
    if (!selectedTemplateId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/habits/from-template/${selectedTemplateId}`, {
        method: "POST",
        body: JSON.stringify({ visible_pour_tous: templateVisiblePourTous })
      });
      setTemplateOpen(false);
      await refresh();
    } catch (err: unknown) {
      setError(msg(err, "Erreur lors de la création depuis template."));
    } finally {
      setLoading(false);
    }
  }

  if (token === null) {
    return (
      <div className="page">
        <div className="container py-4 text-secondary">Chargement...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="page">
        <div className="container py-4">
          <div className="alert alert-warning">Vous devez être connecté pour accéder à cette page.</div>
          <Link className="btn btn-primary" href="/login">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="h3 mb-1 text-primary">Gestion des Habitudes</h2>
        <div className="text-secondary small">Administration des habitudes</div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <div className="btn-group">
          {(["all", "active", "pause", "archived"] as const).map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline-primary"}`}
              type="button"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Tous" : s === "active" ? "Actives" : s === "pause" ? "En pause" : "Archivées"}
            </button>
          ))}
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 260 }}
            placeholder="Rechercher par titre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-select" style={{ width: 220 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as HabitSort)}>
            <option value="recent">Tri: Plus recentes</option>
            <option value="priority_desc">Tri: Priorite (haute vers basse)</option>
            <option value="priority_asc">Tri: Priorite (basse vers haute)</option>
            <option value="status">Tri: Statut</option>
          </select>
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={() => {
              setTemplateVisiblePourTous(true);
              setTemplateOpen(true);
            }}
          >
            <IconTemplate size={18} className="me-2" />
            Depuis template
          </button>
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <IconPlus size={18} className="me-2" />
            Nouvelle habitude
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Date de début</th>
                <th>Fréquence</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Visibilité</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {displayedHabits.map((h) => (
                <tr key={h._id}>
                  <td>
                    <div className="fw-medium">{h.nom}</div>
                    {h.description ? <div className="text-secondary small">{h.description}</div> : null}
                  </td>
                  <td>{labelCategorie(h.categorie)}</td>
                  <td>{h.date_debut ? new Date(h.date_debut).toLocaleDateString("fr-FR") : "-"}</td>
                  <td>{labelFrequence(h.frequence)}</td>
                  <td>{labelPriorite(h.priorite)}</td>
                  <td>
                    <span className={`badge ${h.statut === "archived" ? "bg-secondary" : h.statut === "pause" ? "bg-warning text-dark" : "bg-success"}`}>
                      {labelStatut(h.statut)}
                    </span>
                  </td>
                  <td>
                    {h.visible_pour_tous ? (
                      <span className="badge bg-info text-dark">Tous les utilisateurs</span>
                    ) : (
                      <span className="badge bg-light text-dark border">Moi seulement</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-list flex-nowrap">
                      <button className="btn btn-sm btn-outline-primary" type="button" title="Modifier" onClick={() => openEdit(h)}>
                        <IconEdit size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" title="Cloner" onClick={() => cloneHabit(h._id)}>
                        <IconCopy size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-warning" type="button" title="Mettre en pause" onClick={() => setStatus(h._id, "pause")}>
                        <IconPlayerPause size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-success" type="button" title="Réactiver" onClick={() => setStatus(h._id, "active")}>
                        <IconPlayerPlay size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" type="button" title="Archiver" onClick={() => archiveHabit(h._id)}>
                        <IconArchive size={16} />
                      </button>                      <button className="btn btn-sm btn-outline-danger" type="button" title="Supprimer définitivement" onClick={() => hardDeleteHabit(h._id)}>
                        <IconTrash size={16} />
                      </button>                    </div>
                  </td>
                </tr>
              ))}
              {displayedHabits.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-secondary py-4">
                    Aucune habitude.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <HabitFormModal
          open={createOpen}
          title="Créer une habitude"
          submitLabel="Créer"
          loading={loading}
          form={form}
          setForm={updateForm}
          onSubmit={onCreate}
          onClose={() => setCreateOpen(false)}
          visibilityIdPrefix="create"
        />

      <HabitFormModal
          open={editOpen}
          title="Modifier une habitude"
          submitLabel="Enregistrer"
          loading={loading}
          form={form}
          setForm={updateForm}
          onSubmit={onEdit}
          onClose={() => setEditOpen(false)}
          visibilityIdPrefix="edit"
        />

      <Modal
          open={templateOpen}
          title="Créer depuis un template"
          subtitle="Bibliothèque d'habitudes populaires pré-configurées."
          onClose={() => setTemplateOpen(false)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setTemplateOpen(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-primary" type="button" onClick={createFromTemplate} disabled={loading || !selectedTemplateId}>
                créer
              </button>
            </>
          }
        >
          <label className="form-label">Template</label>
          <select className="form-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.nom_template}
              </option>
            ))}
          </select>
          <div className="mt-3 row g-3 mx-0">
            <HabitVisibilitySection
              idPrefix="template"
              visiblePourTous={templateVisiblePourTous}
              setVisiblePourTous={setTemplateVisiblePourTous}
            />
          </div>
      </Modal>
    </div>
  );
}

function HabitFormModal(props: {
  open: boolean;
  title: string;
  submitLabel: string;
  loading: boolean;
  form: HabitForm;
  setForm: <K extends keyof HabitForm>(key: K, value: HabitForm[K]) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onClose: () => void;
  visibilityIdPrefix: string;
}) {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const slots = ["matin", "midi", "soir"];

  return (
    <Modal
      open={props.open}
      title={props.title}
      onClose={props.onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={props.onClose} disabled={props.loading}>
            Annuler
          </button>
          <button className="btn btn-primary" type="submit" form="habit-form" disabled={props.loading}>
            {props.submitLabel}
          </button>
        </>
      }
    >
      <form id="habit-form" onSubmit={props.onSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Titre</label>
            <input className="form-control" value={props.form.nom} onChange={(e) => props.setForm("nom", e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Catégorie</label>
            <select className="form-select" value={props.form.categorie} onChange={(e) => props.setForm("categorie", e.target.value)}>
              <option value="sante">Santé</option>
              <option value="travail">Travail</option>
              <option value="apprentissage">Apprentissage</option>
              <option value="bien_etre">Bien-être</option>
              <option value="sport">Sport</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={props.form.description} onChange={(e) => props.setForm("description", e.target.value)} />
          </div>

          <HabitVisibilitySection
            idPrefix={props.visibilityIdPrefix}
            visiblePourTous={props.form.visible_pour_tous}
            setVisiblePourTous={(v) => props.setForm("visible_pour_tous", v)}
          />

          <div className="col-md-4">
            <label className="form-label">Fréquence</label>
            <select className="form-select" value={props.form.frequence} onChange={(e) => props.setForm("frequence", e.target.value)}>
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
              <option value="specific_days">Jours spécifiques</option>
              <option value="times_per_week">X fois / semaine</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Priorité</label>
            <select className="form-select" value={props.form.priorite} onChange={(e) => props.setForm("priorite", e.target.value)}>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Heure précise (optionnel)</label>
            <input className="form-control" type="time" value={props.form.heure_precise} onChange={(e) => props.setForm("heure_precise", e.target.value)} />
          </div>
            <div className="col-md-4">
              <label className="form-label">Date de début</label>
              <input className="form-control" type="date" value={props.form.date_debut} onChange={(e) => props.setForm("date_debut", e.target.value)} />
            </div>

          {props.form.frequence === "specific_days" ? (
            <div className="col-12">
              <label className="form-label d-block">Jours spécifiques</label>
              <div className="d-flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${props.form.jours_specifiques.includes(d) ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      const next = props.form.jours_specifiques.includes(d)
                        ? props.form.jours_specifiques.filter((x) => x !== d)
                        : [...props.form.jours_specifiques, d];
                      props.setForm("jours_specifiques", next);
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {props.form.frequence === "times_per_week" ? (
            <div className="col-md-4">
              <label className="form-label">Nombre de fois par semaine</label>
              <input
                className="form-control"
                type="number"
                min="1"
                max="7"
                value={props.form.fois_par_semaine}
                onChange={(e) => props.setForm("fois_par_semaine", e.target.value)}
              />
            </div>
          ) : null}

          <div className="col-12">
            <label className="form-label d-block">Horaires cibles (optionnel)</label>
            <div className="d-flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${props.form.horaires_cibles.includes(s) ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => {
                    const next = props.form.horaires_cibles.includes(s)
                      ? props.form.horaires_cibles.filter((x) => x !== s)
                      : [...props.form.horaires_cibles, s];
                    props.setForm("horaires_cibles", next);
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Objectif quantifiable (optionnel)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Ex: Faire 10000 pas par jour, Lire 20 pages"
              value={props.form.objectif_quantifiable}
              onChange={(e) => props.setForm("objectif_quantifiable", e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function HabitsAdminPage() {
  return (
    <Suspense fallback={<div className="container py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Chargement...</span></div></div>}>
      <HabitsAdminPageContent />
    </Suspense>
  );
}
