/**
 * Client-side permission helpers (mirror backend role.permissions).
 * Server remains authoritative — these gates only hide UI / avoid useless navigation.
 */

export interface StoredAuthUser {
  _id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string | null;
  permissions?: string[];
}

export function hasPermission(user: StoredAuthUser | null | undefined, perm: string): boolean {
  const list = user?.permissions;
  if (!Array.isArray(list)) return false;
  if (list.includes("ALL")) return true;
  return list.includes(perm);
}

export function hasAnyPermission(user: StoredAuthUser | null | undefined, perms: string[]): boolean {
  return perms.some((p) => hasPermission(user, p));
}

const ADMIN_SHELL_PERMISSIONS = [
  "OFF_DAYS_MANAGE", "OFFDAYS_VIEW",
  "USERS_VIEW", "USERS_MANAGE",
  "HABITS_MANAGE",
  "ROLES_VIEW", "ROLES_MANAGE",
  "MANAGERS_MANAGE",
  "ADMIN_STATS_VIEW",
  "TICKETS_MANAGE",
  "CATEGORIES_MANAGE",
];

/** Accès aux routes sous /admin. Admin/manager by role, others by explicit permissions. */
export function canAccessAdminShell(user: StoredAuthUser | null | undefined): boolean {
  const r = user?.role;
  if (r === "admin" || r === "manager") return true;
  return hasAnyPermission(user, ADMIN_SHELL_PERMISSIONS);
}

/** Gestion des comptes managers (backend: manage:Manager → MANAGERS_MANAGE). */
export function canManageManagersCrud(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "MANAGERS_MANAGE");
}

/** File complète des tickets catégories (backend: manage:Ticket). */
export function canManageCategoryTickets(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "TICKETS_MANAGE");
}

// ─── Habits ──────────────────────────────────────────────────────────────────
export function canCreateHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["HABITS_CREATE", "HABITS_MANAGE"]);
}

export function canViewHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE"]);
}

export function canManageHabits(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "HABITS_MANAGE");
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
export function canViewLogs(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["LOGS_VIEW", "LOGS_MANAGE"]);
}

// ─── Stats / progress ─────────────────────────────────────────────────────────
export function canViewStats(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["STATS_VIEW", "ADMIN_STATS_VIEW", "LOGS_VIEW"]);
}

export function canViewProgress(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "PROGRESS_VIEW");
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function canViewUsers(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["USERS_VIEW", "MANAGERS_MANAGE"]);
}

// ─── Off-days ─────────────────────────────────────────────────────────────────
export function canViewOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["OFFDAYS_VIEW", "OFF_DAYS_MANAGE"]);
}

export function canManageOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["OFF_DAYS_MANAGE", "OFFDAYS_VIEW"]);
}

export function canAddOffDays(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "OFF_DAYS_MANAGE");
}

// ─── Roles ────────────────────────────────────────────────────────────────────
export function canViewRoles(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["ROLES_VIEW", "ROLES_MANAGE"]);
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function canViewCategories(user: StoredAuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ["CATEGORIES_VIEW", "CATEGORIES_MANAGE"]);
}
