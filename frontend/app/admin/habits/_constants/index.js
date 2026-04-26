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
  { value: 'times_per_week', label: 'X fois / semaine' },
];

export const HABIT_PRIORITIES = [
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

export const HABIT_STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actives' },
  { value: 'pause', label: 'En pause' },
  { value: 'archived', label: 'Archivées' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Tri: Plus récentes' },
  { value: 'priority_desc', label: 'Tri: Priorité (haute vers basse)' },
  { value: 'priority_asc', label: 'Tri: Priorité (basse vers haute)' },
  { value: 'status', label: 'Tri: Statut' },
];

export const WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const TIME_SLOTS = ['matin', 'midi', 'soir'];

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
  times_per_week: 'X fois/semaine',
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
  categorie_autre_nom: '',
  categorie_autre_description: '',
  frequence: 'daily',
  jours_specifiques: [],
  fois_par_semaine: '',
  horaires_cibles: [],
  heure_precise: '',
  priorite: 'medium',
  objectif_quantifiable: '',
  date_debut: '',
  visible_pour_tous: false,
};
