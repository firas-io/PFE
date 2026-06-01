export const ErrorsCodes = {
  ROLE_NOT_FOUND:        "ROLE-001",
  CANNOT_DELETE_ADMIN:   "ROLE-002",
  CANNOT_MUTATE_ADMIN:   "ROLE-003",
  INVALID_PERMISSION:    "ROLE-004",
};

export const ErrorMessages = {
  [ErrorsCodes.ROLE_NOT_FOUND]:      "Rôle non trouvé",
  [ErrorsCodes.CANNOT_DELETE_ADMIN]: "Impossible de supprimer le rôle administrateur système.",
  [ErrorsCodes.CANNOT_MUTATE_ADMIN]: "Le rôle admin ne peut pas être modifié.",
  [ErrorsCodes.INVALID_PERMISSION]:  "Un ou plusieurs codes de permission sont invalides.",
};

// Sets maximum de permissions par rôle — immuables.
// updateRolePermissions ne peut attribuer que des permissions présentes dans ce set.
export const MAX_PERMISSIONS_BY_ROLE = {
  manager: new Set([
    "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
    "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
    "LOGS_VIEW", "LOGS_MANAGE",
    "STATS_VIEW", "PROGRESS_VIEW",
    "OFFDAYS_VIEW",
    // Permissions backend sans impact UI — tolérées mais non affichées dans l'interface
    "ONBOARDING_VIEW", "REMINDERS_VIEW", "SESSIONS_VIEW",
  ]),
  utilisateur: new Set([
    "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
    "LOGS_VIEW", "LOGS_MANAGE",
    "PROGRESS_VIEW",
    "OFFDAYS_VIEW",
    // Permissions backend sans impact UI — tolérées mais non affichées dans l'interface
    "SELF_VIEW", "SELF_EDIT", "ONBOARDING_VIEW", "REMINDERS_VIEW", "SESSIONS_VIEW",
  ]),
};

// Liste exhaustive des permissions reconnues par le système
export const VALID_PERMISSIONS = new Set([
  "SELF_VIEW", "SELF_EDIT",
  "HABITS_VIEW", "HABITS_CREATE", "HABITS_MANAGE",
  "LOGS_VIEW", "LOGS_MANAGE",
  "USERS_VIEW", "USERS_MANAGE",
  "MANAGERS_MANAGE", "MANAGER_TEAM_VIEW", "MANAGER_USERS_VIEW", "MANAGER_USERS_MANAGE",
  "ROLES_VIEW", "ROLES_MANAGE",
  "STATS_VIEW", "STATS_MANAGE", "ADMIN_STATS_VIEW",
  "PROGRESS_VIEW",
  "ONBOARDING_VIEW", "ONBOARDING_MANAGE",
  "REMINDERS_VIEW", "REMINDERS_MANAGE",
  "SESSIONS_VIEW", "SESSIONS_MANAGE",
  "CATEGORIES_VIEW", "CATEGORIES_MANAGE",
  "TICKETS_MANAGE",
  "OFFDAYS_VIEW", "OFF_DAYS_MANAGE",
]);
