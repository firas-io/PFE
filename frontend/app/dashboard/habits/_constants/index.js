/** @deprecated Préférez GET /categories via useCategories (source unique). */
export const HABIT_CATEGORIES = [
  { value: 'sante', label: 'Santé' },
  { value: 'travail', label: 'Travail' },
  { value: 'apprentissage', label: 'Apprentissage' },
  { value: 'bien_etre', label: 'Bien-être' },
  { value: 'sport', label: 'Sport' },
  { value: 'finance', label: 'Finance' },
  { value: 'social', label: 'Social' },
  { value: 'creativite', label: 'Créativité' },
  { value: 'autre', label: 'Autre' },
];

export const HABIT_FREQUENCIES = [
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'specific_days', label: 'Jours spécifiques' },
  { value: 'times_per_week', label: 'Fois par semaine' },
];

export const HABIT_PRIORITIES = [
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

export const STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actives' },
  { value: 'pause', label: 'En pause' },
  { value: 'archived', label: 'Archivées' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'priority_desc', label: 'Priorité haute' },
  { value: 'priority_asc', label: 'Priorité basse' },
  { value: 'status', label: 'Statut' },
];

export const CATEGORY_LABELS = {
  sante: 'Santé',
  travail: 'Travail',
  apprentissage: 'Apprentissage',
  bien_etre: 'Bien-être',
  sport: 'Sport',
  finance: 'Finance',
  social: 'Social',
  creativite: 'Créativité',
  autre: 'Autre',
};

export const FREQUENCY_LABELS = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  specific_days: 'Jours spécifiques',
  times_per_week: 'Fois par semaine',
};

export const PRIORITY_LABELS = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export const STATUS_LABELS = {
  active: 'Active',
  pause: 'En pause',
  archived: 'Archivée',
};

export const EMPTY_HABIT_FORM = {
  nom: '',
  description: '',
  categorie: 'autre',
  categorie_champs: {},
  categorie_autre_nom: '',
  categorie_autre_description: '',
  frequence: 'daily',
  priorite: 'medium',
  objectif_detail: '',
  visible_pour_tous: false,
  note: '',
  date_debut: '',
  dates_specifiques: [],
};

export function priorityRank(value) {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  if (value === 'low') return 1;
  return 0;
}

export function statusRank(value) {
  if (value === 'active') return 0;
  if (value === 'pause') return 1;
  if (value === 'archived') return 2;
  return 3;
}
