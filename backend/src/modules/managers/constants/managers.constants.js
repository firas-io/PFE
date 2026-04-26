export const ErrorsCodes = {
  MANAGER_NOT_FOUND:       "MGR-001",
  USER_NOT_FOUND:          "MGR-002",
  EMAIL_IN_USE:            "MGR-003",
  FIELDS_REQUIRED:         "MGR-004",
  ACCESS_DENIED:           "MGR-005",
  NOT_A_MANAGER:           "MGR-006",
  CANNOT_DELETE_SELF:      "MGR-007",
  USER_NOT_OWNED:          "MGR-008",
};

export const ErrorMessages = {
  [ErrorsCodes.MANAGER_NOT_FOUND]:  "Manager non trouvé",
  [ErrorsCodes.USER_NOT_FOUND]:     "Utilisateur non trouvé",
  [ErrorsCodes.EMAIL_IN_USE]:       "Email déjà utilisé",
  [ErrorsCodes.FIELDS_REQUIRED]:    "nom, prenom, email et mot_de_passe sont requis",
  [ErrorsCodes.ACCESS_DENIED]:      "Accès refusé",
  [ErrorsCodes.NOT_A_MANAGER]:      "Cet utilisateur n'a pas le rôle manager",
  [ErrorsCodes.CANNOT_DELETE_SELF]: "Impossible de supprimer son propre compte",
  [ErrorsCodes.USER_NOT_OWNED]:     "Cet utilisateur n'appartient pas à ce manager",
};
