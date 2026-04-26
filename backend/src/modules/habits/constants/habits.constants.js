export const ErrorsCodes = {
  NOM_REQUIRED:     "HABIT-001",
  NOT_FOUND:        "HABIT-002",
  ACCESS_DENIED:    "HABIT-003",
  CASCADE_PARTIAL:  "HABIT-005",
  DATE_IS_OFF:      "HABIT-006",
  INVALID_CATEGORY: "HAB-CAT-001",
};

export const ErrorMessages = {
  [ErrorsCodes.NOM_REQUIRED]:    "nom/titre is required",
  [ErrorsCodes.NOT_FOUND]:       "Habit not found",
  [ErrorsCodes.ACCESS_DENIED]:   "Accès refusé",
  [ErrorsCodes.CASCADE_PARTIAL]: "Cascade delete failed partially — check partial field for details",
  [ErrorsCodes.DATE_IS_OFF]:     "One or more dates conflict with a public holiday",
  [ErrorsCodes.INVALID_CATEGORY]: "Invalid habit category — see GET /categories for allowed slugs",
};

export const HabitStatuts = { ACTIVE: "active", PAUSE: "pause", ARCHIVED: "archived" };
export const HabitCategories = { SANTE: "sante", SPORT: "sport", TRAVAIL: "travail", EDUCATION: "education", SOCIAL: "social", AUTRE: "autre" };
export const HabitPriorites  = { HAUTE: "haute", MOYENNE: "moyenne", BASSE: "basse" };
export const HabitFrequences = { QUOTIDIENNE: "quotidienne", HEBDOMADAIRE: "hebdomadaire", MENSUELLE: "mensuelle", PERSONNALISEE: "personnalisee" };
