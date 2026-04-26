/**
 * Central catalogue of habit categories (slug + UI metadata + dynamic fields).
 * New categories: add an entry with layout: "default" for automatic UI via DefaultLayout.
 */

function slugify(input) {
  if (input == null) return "";
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

/** @typedef {{ name: string, label: string, type: string, unit?: string, options?: { value: string, label: string }[], required?: boolean }} CategoryField */

/** Maps legacy / alternate labels to official slugs. */
export const LEGACY_CATEGORY_ALIASES = {
  education: "apprentissage",
  sante_categorie: "sante",
};

/**
 * @type {Record<string, { slug: string, label: string, icon: string, color: string, layout: string, description: string, fields: CategoryField[] }>}
 */
export const CATEGORIES = {
  sport: {
    slug: "sport",
    label: "Sport",
    icon: "Dumbbell",
    color: "#f97316",
    layout: "sport",
    description: "Suivez vos efforts physiques, la durée et l'intensité.",
    fields: [
      { name: "distance", label: "Distance", type: "number", unit: "km" },
      { name: "duree", label: "Durée", type: "duration", unit: "min" },
      {
        name: "intensite",
        label: "Intensité",
        type: "select",
        options: [
          { value: "faible", label: "Faible" },
          { value: "moyenne", label: "Moyenne" },
          { value: "elevee", label: "Élevée" },
        ],
      },
    ],
  },
  apprentissage: {
    slug: "apprentissage",
    label: "Apprentissage",
    icon: "BookOpen",
    color: "#3b82f6",
    layout: "study",
    description: "Structurez lecture, sujet et temps d'étude.",
    fields: [
      { name: "sujet", label: "Sujet", type: "text" },
      { name: "duree", label: "Durée", type: "duration", unit: "min" },
      { name: "pages_lues", label: "Pages lues", type: "number" },
    ],
  },
  bien_etre: {
    slug: "bien_etre",
    label: "Bien-être",
    icon: "Sparkles",
    color: "#10b981",
    layout: "wellness",
    description: "Humeur et sommeil pour équilibrer votre journée.",
    fields: [
      {
        name: "humeur",
        label: "Humeur",
        type: "select",
        options: [
          { value: "triste", label: "😞 Triste" },
          { value: "neutre", label: "😐 Neutre" },
          { value: "bien", label: "🙂 Bien" },
          { value: "joyeux", label: "😄 Joyeux" },
          { value: "top", label: "🤩 Au top" },
        ],
      },
      { name: "heures_sommeil", label: "Sommeil", type: "number", unit: "h" },
    ],
  },
  travail: {
    slug: "travail",
    label: "Travail",
    icon: "Briefcase",
    color: "#8b5cf6",
    layout: "productivity",
    description: "Tâches accomplies et temps de concentration.",
    fields: [
      { name: "taches_terminees", label: "Tâches terminées", type: "number" },
      { name: "temps_concentration", label: "Temps de concentration", type: "duration", unit: "min" },
    ],
  },
  sante: {
    slug: "sante",
    label: "Santé",
    icon: "Heart",
    color: "#ef4444",
    layout: "health",
    description: "Médicaments, consultations et hydratation.",
    fields: [
      {
        name: "type_action",
        label: "Type d'action",
        type: "select",
        options: [
          { value: "medicament", label: "Médicament" },
          { value: "consultation", label: "Consultation" },
          { value: "hydratation", label: "Hydratation" },
          { value: "autre", label: "Autre" },
        ],
      },
      { name: "quantite", label: "Quantité", type: "number" },
      { name: "notes", label: "Notes", type: "text" },
    ],
  },
  finance: {
    slug: "finance",
    label: "Finance",
    icon: "Wallet",
    color: "#22c55e",
    layout: "finance",
    description: "Flux d'argent : épargne, dépenses et revenus.",
    fields: [
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "epargne", label: "Épargne" },
          { value: "depense", label: "Dépense" },
          { value: "revenu", label: "Revenu" },
        ],
      },
      { name: "montant", label: "Montant", type: "number", unit: "€" },
      { name: "categorie_depense", label: "Catégorie de dépense", type: "text" },
    ],
  },
  social: {
    slug: "social",
    label: "Social",
    icon: "Users",
    color: "#ec4899",
    layout: "social",
    description: "Connexions humaines et temps partagé.",
    fields: [
      {
        name: "type_interaction",
        label: "Type d'interaction",
        type: "select",
        options: [
          { value: "famille", label: "Famille" },
          { value: "amis", label: "Amis" },
          { value: "collegues", label: "Collègues" },
          { value: "autre", label: "Autre" },
        ],
      },
      { name: "duree", label: "Durée", type: "duration", unit: "min" },
      { name: "notes", label: "Notes", type: "text" },
    ],
  },
  creativite: {
    slug: "creativite",
    label: "Créativité",
    icon: "Palette",
    color: "#f59e0b",
    layout: "creativity",
    description: "Discipline artistique, temps créatif et production.",
    fields: [
      {
        name: "discipline",
        label: "Discipline",
        type: "select",
        options: [
          { value: "dessin", label: "Dessin" },
          { value: "musique", label: "Musique" },
          { value: "ecriture", label: "Écriture" },
          { value: "photo", label: "Photo" },
          { value: "autre", label: "Autre" },
        ],
      },
      { name: "duree", label: "Durée", type: "duration", unit: "min" },
      { name: "production", label: "Production", type: "text" },
    ],
  },
  autre: {
    slug: "autre",
    label: "Autre",
    icon: "Circle",
    color: "#6b7280",
    layout: "default",
    description: "Catégorie polyvalente pour tout le reste.",
    fields: [{ name: "notes", label: "Notes", type: "text" }],
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORIES);

/**
 * @param {unknown} input
 * @returns {string|undefined} Normalized slug string, or undefined if empty input
 */
export function resolveCategorieSlug(input) {
  if (input == null || String(input).trim() === "") return undefined;
  const s = slugify(input);
  return LEGACY_CATEGORY_ALIASES[s] ?? s;
}

/**
 * @param {string|undefined|null} slug
 * @returns {boolean}
 */
export function isValidCategory(slug) {
  if (slug == null || typeof slug !== "string") return false;
  return Object.prototype.hasOwnProperty.call(CATEGORIES, slug);
}

/**
 * @param {string|undefined|null} slug
 * @returns {(typeof CATEGORIES)[string]|null}
 */
export function getCategory(slug) {
  if (!isValidCategory(slug)) return null;
  return CATEGORIES[slug];
}

/**
 * Payload safe for clients (no secrets).
 * @returns {ReturnType<typeof getCategory>[]}
 */
export function getPublicCategories() {
  return CATEGORY_SLUGS.map((s) => CATEGORIES[s]);
}
