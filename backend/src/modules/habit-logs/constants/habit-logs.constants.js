export const ErrorsCodes = {
  HABIT_ID_REQUIRED: "LOG-001",
  HABIT_NOT_FOUND:   "LOG-002",
  LOG_NOT_FOUND:     "LOG-003",
  ACCESS_DENIED:     "LOG-004",
  FIELDS_REQUIRED:   "LOG-005",
  INVALID_PHOTO:     "LOG-006",
  INVALID_DATE:      "LOG-007",
};

export const ErrorMessages = {
  [ErrorsCodes.HABIT_ID_REQUIRED]: "habit_id is required",
  [ErrorsCodes.HABIT_NOT_FOUND]:   "Habit not found",
  [ErrorsCodes.LOG_NOT_FOUND]:     "Log not found",
  [ErrorsCodes.ACCESS_DENIED]:     "Accès refusé",
  [ErrorsCodes.FIELDS_REQUIRED]:   "habit_id, date, and photo_url are required",
  [ErrorsCodes.INVALID_PHOTO]:     "photo_url must be a valid base64 image",
  [ErrorsCodes.INVALID_DATE]:      "Date invalide",
};

export const LogStatuts = { COMPLETEE: "completee", PARTIELLE: "partielle", MANQUEE: "manquee", NON_COMPLETEE: "non_completee" };
