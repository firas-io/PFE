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

/** Accès aux routes sous /admin (cohérent avec admin/layout.tsx). */
export function canAccessAdminShell(user: StoredAuthUser | null | undefined): boolean {
  const r = user?.role;
  return r === "admin" || r === "manager";
}

/** Gestion des comptes managers (backend: manage:Manager → MANAGERS_MANAGE). */
export function canManageManagersCrud(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "MANAGERS_MANAGE");
}

/** File complète des tickets catégories (backend: manage:Ticket). */
export function canManageCategoryTickets(user: StoredAuthUser | null | undefined): boolean {
  return hasPermission(user, "TICKETS_MANAGE");
}
