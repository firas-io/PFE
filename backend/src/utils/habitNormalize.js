/**
 * habitNormalize.js
 * Utility functions for normalizing and parsing habit-related input payloads.
 * Extracted from HabitRoutes.js & HabitTemplateRoutes.js to avoid duplication.
 */

// ─── String Helpers ───────────────────────────────────────────────────────────

function stripAccents(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value) {
  return stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_");
}

// ─── Lookup Maps ──────────────────────────────────────────────────────────────

const categorieMap = {
  sante: "sante",
  sante_categorie: "sante",
  travail: "travail",
  apprentissage: "apprentissage",
  bien_etre: "bien_etre",
  sport: "sport",
  autre: "autre"
};

const prioriteMap = {
  haute: "high",
  high: "high",
  moyenne: "medium",
  medium: "medium",
  basse: "low",
  low: "low"
};

const statusMap = {
  active: "active",
  actif: "active",
  pause: "pause",
  en_pause: "pause",
  archived: "archived",
  archiver: "archived",
  archivee: "archived"
};

const freqMap = {
  daily: "daily",
  quotidienne: "daily",
  hebdomadaire: "weekly",
  weekly: "weekly",
  monthly: "monthly",
  mensuelle: "monthly",
  mensuel: "monthly",
  specific_days: "specific_days",
  jours_specifiques: "specific_days",
  times_per_week: "times_per_week",
  fois_par_semaine: "times_per_week",
  x_fois_par_semaine: "times_per_week"
};

const weekDayMap = {
  lundi: "lundi",
  mon: "lundi",
  mardi: "mardi",
  tue: "mardi",
  mercredi: "mercredi",
  wed: "mercredi",
  jeudi: "jeudi",
  thu: "jeudi",
  vendredi: "vendredi",
  fri: "vendredi",
  samedi: "samedi",
  sat: "samedi",
  dimanche: "dimanche",
  sun: "dimanche"
};

const horairesMap = {
  matin: "matin",
  midi: "midi",
  soir: "soir"
};

// ─── Field Normalizers ────────────────────────────────────────────────────────

function normalizeStatus(input) {
  if (input === undefined || input === null) return undefined;
  return statusMap[normalizeKey(input)] || undefined;
}

function normalizePriorite(input) {
  if (input === undefined || input === null) return undefined;
  return prioriteMap[normalizeKey(input)] || undefined;
}

function normalizeCategorie(input) {
  if (input === undefined || input === null) return undefined;
  return categorieMap[normalizeKey(input)] || undefined;
}

function normalizeFrequence(input, body) {
  let mode;
  if (typeof input === "string") {
    mode = freqMap[normalizeKey(input)] || undefined;
  }

  if (!mode) {
    const maybe = body?.frequence_mode ?? body?.frequenceMode ?? body?.frequenceType;
    if (typeof maybe === "string") mode = freqMap[normalizeKey(maybe)] || undefined;
  }

  // Fallback: infer from details presence
  if (!mode) {
    const hasSpecificDays = body?.jours_specifiques ?? body?.joursSpecifiques;
    const hasTimesPerWeek = body?.fois_par_semaine ?? body?.foisParSemaine;
    if (hasSpecificDays) mode = "specific_days";
    if (hasTimesPerWeek) mode = "times_per_week";
  }

  return mode;
}

function normalizeWeekDays(value) {
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const normalized = list
    .map((v) => (typeof v === "string" ? normalizeKey(v) : v))
    .map((v) => weekDayMap[v] || v)
    .filter(Boolean);
  return normalized.length ? normalized : undefined;
}

function normalizeHorairesCibles(value) {
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const normalized = list
    .map((v) => (typeof v === "string" ? normalizeKey(v) : v))
    .map((v) => horairesMap[v] || v)
    .filter(Boolean);
  return normalized.length ? normalized : undefined;
}

function normalizeHeurePrecise(input) {
  if (input === undefined || input === null) return undefined;
  return String(input).trim();
}

// ─── Objectif Parser ─────────────────────────────────────────────────────────

function parseObjectifString(s) {
  const str = String(s).trim();
  const lower = stripAccents(str).toLowerCase();

  const numMatch = lower.match(/(\d[\d\s.,]*)/);
  if (!numMatch) return undefined;

  const rawNumber = numMatch[1].replace(/\s+/g, "").replace(",", ".");
  const valeur = Number(rawNumber);
  if (!Number.isFinite(valeur)) return undefined;

  const unitCandidate = lower.slice(numMatch.index + numMatch[0].length).trim();
  if (!unitCandidate) return { valeur, unite: undefined, detail: str };

  let unite = unitCandidate;
  if (unite.includes("minute")) unite = "minutes";
  else if (unite.includes("pas")) unite = "pas";
  else if (unite.includes("heure")) unite = "heures";

  return { valeur, unite, detail: str };
}

function normalizeObjectif(body) {
  // Format canonique (storage)
  if (
    body.objectif_valeur !== undefined ||
    body.objectif_unite !== undefined ||
    body.objectif_detail !== undefined
  ) {
    const out = {};
    if (body.objectif_valeur !== undefined) {
      const objectif_valeur = Number(body.objectif_valeur);
      if (Number.isFinite(objectif_valeur)) out.objectif_valeur = objectif_valeur;
    }
    if (body.objectif_unite !== undefined) out.objectif_unite = body.objectif_unite;
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

function canSetVisiblePourTous(req) {
  const p = req.user.permissions || [];
  return p.includes("HABITS_MANAGE") || p.includes("HABITS_VIEW") || p.includes("ALL");
}

function parseVisiblePourTous(body) {
  const v = body?.visible_pour_tous ?? body?.visiblePourTous;
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

// ─── Master Payload Normalizer ────────────────────────────────────────────────

function normalizeHabitPayload(body, { requireNom = false } = {}) {
  const payload = {};

  const nom = body.nom ?? body.titre;
  if (nom !== undefined) payload.nom = String(nom).trim();
  if (requireNom && (!payload.nom || !payload.nom.length)) return null;

  if (body.description !== undefined) payload.description = body.description;
  if (body.note !== undefined) payload.note = body.note;

  if (body.date_debut !== undefined && body.date_debut) {
    payload.date_debut = new Date(body.date_debut);
  }

  // Handle dates_specifiques
  if (body.dates_specifiques !== undefined && Array.isArray(body.dates_specifiques)) {
    console.log("[DATES_SPEC] Received array:", body.dates_specifiques);
    const converted = body.dates_specifiques.map(d => {
      const dateObj = new Date(d);
      console.log(`[DATES_SPEC] Converting "${d}" to ${dateObj.toISOString()}`);
      return dateObj;
    });
    payload.dates_specifiques = converted;
    console.log("[DATES_SPEC] Final payload dates:", payload.dates_specifiques);
  } else {
    console.log("[DATES_SPEC] No dates_specifiques in body or not an array. Body:", body.dates_specifiques);
  }

  const categorie = normalizeCategorie(body.categorie);
  if (categorie !== undefined) payload.categorie = categorie;

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

  const heure_precise = normalizeHeurePrecise(body.heure_precise ?? body.heurePrecise);
  if (heure_precise !== undefined) payload.heure_precise = heure_precise;

  Object.assign(payload, normalizeObjectif(body));

  return payload;
}

module.exports = {
  stripAccents,
  normalizeKey,
  normalizeStatus,
  normalizePriorite,
  normalizeCategorie,
  normalizeFrequence,
  normalizeWeekDays,
  normalizeHorairesCibles,
  normalizeHeurePrecise,
  normalizeObjectif,
  parseObjectifString,
  normalizeHabitPayload,
  canSetVisiblePourTous,
  parseVisiblePourTous
};
