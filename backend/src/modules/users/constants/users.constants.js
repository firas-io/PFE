export const ErrorsCodes = {
  PASSWORD_REQUIRED:    "USER-001",
  USER_NOT_FOUND:       "USER-002",
  EMAIL_IN_USE:         "USER-003",
  ROLE_NOT_FOUND:       "USER-004",
  ACCESS_DENIED:        "USER-005",
  SELF_DELETE_ADMIN:    "USER-006",
  SELF_DEACTIVATE:      "USER-007",
  FIELDS_REQUIRED:      "USER-008",
  INVALID_ACTIVE:       "USER-009",
  ALREADY_ANONYMIZED:   "USER-010",
  ANONYMIZE_PARTIAL:    "USER-011",
};

export const ErrorMessages = {
  [ErrorsCodes.PASSWORD_REQUIRED]:  "mot_de_passe is required",
  [ErrorsCodes.USER_NOT_FOUND]:     "User not found",
  [ErrorsCodes.EMAIL_IN_USE]:       "Email already in use",
  [ErrorsCodes.ROLE_NOT_FOUND]:     "Invalid role",
  [ErrorsCodes.ACCESS_DENIED]:      "Accès refusé",
  [ErrorsCodes.SELF_DELETE_ADMIN]:  "Un administrateur ne peut pas supprimer son propre compte.",
  [ErrorsCodes.SELF_DEACTIVATE]:    "Un administrateur ne peut pas désactiver son propre compte",
  [ErrorsCodes.FIELDS_REQUIRED]:    "nom, prenom, email, mot_de_passe, and roleNom are required",
  [ErrorsCodes.INVALID_ACTIVE]:     "isActive must be a boolean",
  [ErrorsCodes.ALREADY_ANONYMIZED]: "User has already been anonymized",
  [ErrorsCodes.ANONYMIZE_PARTIAL]:  "Anonymization failed partially — check partial field for details",
};

// Fixed UUID used as the owner of shared habits after user anonymization.
// Created idempotently by fixtures/setup-admin.js on startup.
export const SYSTEM_ARCHIVED_USER_ID = "00000000-0000-0000-0000-000000000001";
