export const ErrorsCodes = {
  ROLE_NOT_FOUND:      "ROLE-001",
  CANNOT_DELETE_ADMIN: "ROLE-002",
};

export const ErrorMessages = {
  [ErrorsCodes.ROLE_NOT_FOUND]:      "Rôle non trouvé",
  [ErrorsCodes.CANNOT_DELETE_ADMIN]: "Impossible de supprimer le rôle administrateur système.",
};
