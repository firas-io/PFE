/**
 * utils/habit-normalize.js
 * Shared helpers for normalizing habit payloads across the habits
 * and habit-templates modules.
 */

import { resolveCategorieSlug } from "@/shared/constants/categories.js";

// ─── String Helpers ───────────────────────────────────────────────────────────

export function stripAccents(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeKey(value) {
  return stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_");
}

// ─── Lookup Maps ──────────────────────────────────────────────────────────────

const prioriteMap = {
  haute: "high", high: "high", moyenne: "medium", medium: "medium", basse: "low", low: "low"
};

const statusMap = {
  active: "active", actif: "active", pause: "pause", en_pause: "pause",
  archived: "archived", archiver: "archived", archivee: "archived"
};

const freqMap = {
  daily: "daily", quotidienne: "daily",
  hebdomadaire: "weekly", weekly: "weekly",
  monthly: "monthly", mensuelle: "monthly", mensuel: "monthly",
  specific_days: "specific_days", jours_specifiques: "specific_days",
  times_per_week: "times_per_week", fois_par_semaine: "times_per_week",
  x_fois_par_semaine: "times_per_week"
};

const weekDayMap = {
  lundi: "lundi", mon: "lundi", mardi: "mardi", tue: "mardi",
  mercredi: "mercredi", wed: "mercredi", jeudi: "jeudi", thu: "jeudi",
  vendredi: "vendredi", fri: "vendredi", samedi: "samedi", sat: "samedi",
  dimanche: "dimanche", sun: "dimanche"
};

const horairesMap = { matin: "matin", midi: "midi", soir: "soir" };

// ─── Field Normalizers ────────────────────────────────────────────────────────

export function normalizeStatus(input) {
  if (input == null) return undefined;
  return statusMap[normalizeKey(input)] || undefined;
}

export function normalizePriorite(input) {
  if (input == null) return undefined;
  return prioriteMap[normalizeKey(input)] || undefined;
}

export function normalizeCategorie(input) {
  return resolveCategorieSlug(input);
}

export function normalizeFrequence(input, body) {
  let mode;
  if (typeof input === "string") mode = freqMap[normalizeKey(input)];
  if (!mode) {
    const maybe = body?.frequence_mode ?? body?.frequenceMode ?? body?.frequenceType;
    if (typeof maybe === "string") mode = freqMap[normalizeKey(maybe)];
  }
  if (!mode) {
    if (body?.jours_specifiques ?? body?.joursSpecifiques) mode = "specific_days";
    if (body?.fois_par_semaine  ?? body?.foisParSemaine)  mode = "times_per_week";
  }
  return mode;
}

export function normalizeWeekDays(value) {
  if (value == null) return undefined;
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const result = list
    .map(v => (typeof v === "string" ? normalizeKey(v) : v))
    .map(v => weekDayMap[v] || v)
    .filter(Boolean);
  return result.length ? result : undefined;
}

export function normalizeHorairesCibles(value) {
  if (value == null) return undefined;
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const result = list
    .map(v => (typeof v === "string" ? normalizeKey(v) : v))
    .map(v => horairesMap[v] || v)
    .filter(Boolean);
  return result.length ? result : undefined;
}

export function normalizeHeurePrecise(input) {
  if (input == null) return undefined;
  return String(input).trim();
}

// ─── Objectif Parser ─────────────────────────────────────────────────────────

export function parseObjectifString(s) {
  const str   = String(s).trim();
  const lower = stripAccents(str).toLowerCase();
  const numMatch = lower.match(/(\d[\d\s.,]*)/);
  if (!numMatch) return undefined;

  const valeur = Number(numMatch[1].replace(/\s+/g, "").replace(",", "."));
  if (!Number.isFinite(valeur)) return undefined;

  const unitCandidate = lower.slice(numMatch.index + numMatch[0].length).trim();
  if (!unitCandidate) return { valeur, unite: undefined, detail: str };

  let unite = unitCandidate;
  if (unite.includes("minute")) unite = "minutes";
  else if (unite.includes("pas")) unite = "pas";
  else if (unite.includes("heure")) unite = "heures";

  return { valeur, unite, detail: str };
}

export function normalizeObjectif(body) {
  if (body.objectif_valeur !== undefined || body.objectif_unite !== undefined || body.objectif_detail !== undefined) {
    const out = {};
    if (body.objectif_valeur !== undefined) {
      const v = Number(body.objectif_valeur);
      if (Number.isFinite(v)) out.objectif_valeur = v;
    }
    if (body.objectif_unite  !== undefined) out.objectif_unite  = body.objectif_unite;
    if (body.objectif_detail !== undefined) out.objectif_detail = body.objectif_detail;
    return out;
  }
  const raw = body.objectif_quantifiable ?? body.objectif;
  if (!raw || typeof raw !== "string") return {};
  const parsed = parseObjectifString(raw);
  if (!parsed) return {};
  const out = { objectif_valeur: parsed.valeur, objectif_detail: parsed.detail };
  if (parsed.unite !== undefined) out.objectif_unite = parsed.unite;
  return out;
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

export function canSetVisiblePourTous(req) {
  const p = req.user.permissions || [];
  return p.includes("HABITS_MANAGE") || p.includes("HABITS_VIEW") || p.includes("ALL");
}

export function parseVisiblePourTous(body) {
  const v = body?.visible_pour_tous ?? body?.visiblePourTous;
  if (v === true  || v === "true"  || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

// ─── Master Payload Normalizer ────────────────────────────────────────────────

export function normalizeHabitPayload(body, { requireNom = false } = {}) {
  const payload = {};

  const nom = body.nom ?? body.titre;
  if (nom !== undefined) payload.nom = String(nom).trim();
  if (requireNom && (!payload.nom || !payload.nom.length)) return null;

  if (body.description !== undefined) payload.description = body.description;
  if (body.note        !== undefined) payload.note        = body.note;
  if (body.date_debut  !== undefined && body.date_debut)
    payload.date_debut = new Date(body.date_debut);

  if (body.dates_specifiques !== undefined && Array.isArray(body.dates_specifiques))
    payload.dates_specifiques = body.dates_specifiques.map(d => new Date(d));

  const categorie = normalizeCategorie(body.categorie ?? body.category);
  if (categorie !== undefined) payload.categorie = categorie;

  const categorieChamps = body.categorie_champs ?? body.categorieChamps;
  if (categorieChamps !== undefined) {
    if (categorieChamps === null) payload.categorie_champs = null;
    else if (typeof categorieChamps === "object" && !Array.isArray(categorieChamps))
      payload.categorie_champs = { ...categorieChamps };
  }

  const statut = normalizeStatus(body.statut ?? body.status);
  if (statut !== undefined) {
    payload.statut = statut;
    if (statut === "archived") payload.date_archivage = body.date_archivage ?? new Date();
  }

  const priorite = normalizePriorite(body.priorite ?? body.priority);
  if (priorite !== undefined) payload.priorite = priorite;

  const frequence = normalizeFrequence(body.frequence, body);
  if (frequence !== undefined) payload.frequence = frequence;

  const jours = normalizeWeekDays(body.jours_specifiques ?? body.joursSpecifiques);
  if (jours) payload.jours_specifiques = jours;

  const fois = body.fois_par_semaine ?? body.foisParSemaine;
  if (fois !== undefined) payload.fois_par_semaine = Number(fois);

  const horaires = normalizeHorairesCibles(body.horaires_cibles ?? body.horairesCibles ?? body.horaires);
  if (horaires) payload.horaires_cibles = horaires;

  const heure = normalizeHeurePrecise(body.heure_precise ?? body.heurePrecise);
  if (heure !== undefined) payload.heure_precise = heure;

  Object.assign(payload, normalizeObjectif(body));
  return payload;
}
