/**
 * Client-side permission helpers — miroir des permissions backend.
 *
 * RÈGLE : aucune vérification de role (user.role) ici sauf canAddNotes
 * (qui reflète une contrainte backend enforced par rôle, sans permission dédiée).
 * Tout le reste est 100% basé sur le tableau user.permissions[].
 *
 * Le backend reste autoritaire — ces helpers cachent/affichent l'UI uniquement.
 */

export interface StoredAuthUser {
  _id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string | null;
  permissions?: string[];
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export function hasPermission(user: StoredAuthUser | null | undefined, perm: string): boolean {
  const list = user?.permissions;
  if (!Array.isArray(list)) return false;
  if (list.includes("ALL")) return true;
  return list.includes(perm);
}

export function hasAnyPermission(user: StoredAuthUser | null | undefined, perms: string[]): boolean {
  return perms.some((p) => hasPermission(user, p));
}

// ─── Accès à l'admin shell (/admin/*) ────────────────────────────────────────
// Option A : basé uniquement sur le rôle.
// Seuls admin et manager ont accès à /admin/*.

export function canAccessAdminShell(user: StoredAuthUser | null | undefined): boolean {
  const r = user?.role?.toLowerCase();
  return r === "admin" || r === "manager";
}

// ─── Sections du sidebar ─────────────────────────────────────────────────────

/** VUE D'ENSEMBLE — tableau de bord admin global */
export function canViewAdminDashboard(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "ADMIN_STATS_VIEW");
}

/** MON ESPACE — espace personnel (habitudes, stats perso, calendrier, progression) */
export function canAccessMonEspace(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "HABITS_VIEW");
}

/** MON ÉQUIPE — gestion de l'équipe */
export function canAccessMonEquipe(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE"]);
}

// ─── Habitudes ────────────────────────────────────────────────────────────────

export function canCreateHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["HABITS_CREATE", "HABITS_MANAGE"]);
}

export function canViewHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE"]);
}

export function canManageHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "HABITS_MANAGE");
}

/**
 * Gestion des habitudes GLOBALES (page admin /admin/habits).
 * Requiert HABITS_MANAGE + ADMIN_STATS_VIEW pour éviter que les managers
 * (qui ont HABITS_MANAGE pour leur équipe) accèdent à la gestion globale.
 */
export function canManageGlobalHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "HABITS_MANAGE") && hasPermission(user, "ADMIN_STATS_VIEW");
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function canViewLogs(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["LOGS_VIEW", "LOGS_MANAGE"]);
}

// ─── Statistiques & progression ───────────────────────────────────────────────

/**
 * Accès à la page statistiques équipe (/admin/stats).
 * N'inclut PAS LOGS_VIEW pour éviter que les managers voient les stats
 * simplement parce qu'ils ont accès aux logs.
 */
export function canViewStats(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["STATS_VIEW", "ADMIN_STATS_VIEW"]);
}

/**
 * Accès aux graphiques analytiques d'équipe (charts, taux, productivité).
 * Purement basé sur les permissions — aucune vérification de rôle.
 */
export function canViewTeamAnalytics(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["ADMIN_STATS_VIEW", "MANAGER_USERS_VIEW", "STATS_VIEW"]);
}

export function canViewProgress(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "PROGRESS_VIEW");
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export function canViewUsers(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["USERS_VIEW", "MANAGERS_MANAGE"]);
}

// ─── Managers ─────────────────────────────────────────────────────────────────

export function canManageManagersCrud(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "MANAGERS_MANAGE");
}

// ─── Jours off ────────────────────────────────────────────────────────────────

export function canViewOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["OFFDAYS_VIEW", "OFF_DAYS_MANAGE"]);
}

export function canManageOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "OFF_DAYS_MANAGE");
}

export function canAddOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "OFF_DAYS_MANAGE");
}

// ─── Rôles ────────────────────────────────────────────────────────────────────

export function canViewRoles(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["ROLES_VIEW", "ROLES_MANAGE"]);
}

// ─── Catégories ───────────────────────────────────────────────────────────────

/** Vue générale des catégories (dropdown, sélection) */
export function canViewCategories(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["CATEGORIES_VIEW", "CATEGORIES_MANAGE"]);
}

/** Gestion admin des catégories (/admin/categories) — CATEGORIES_MANAGE requis */
export function canManageCategories(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "CATEGORIES_MANAGE");
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export function canManageCategoryTickets(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "TICKETS_MANAGE");
}

// ─── Notes ────────────────────────────────────────────────────────────────────
/**
 * Exception : vérifie le rôle car le backend bloque les managers au niveau du rôle
 * sans permission dédiée. Ce helper reflète fidèlement la contrainte backend.
 */
export function canAddNotes(user: StoredAuthUser | null | undefined): boolean {
  if (!user) return false;
  return (user.role?.toLowerCase() ?? "") !== "manager";
}
