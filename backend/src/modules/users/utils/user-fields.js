/**
 * Canonical user field names (English, camelCase) in MongoDB.
 * Legacy French / snake_case keys are still read until data is migrated.
 */

export function getFirstName(doc) {
  if (!doc) return "";
  return doc.firstName ?? doc.prenom ?? "";
}

export function getLastName(doc) {
  if (!doc) return "";
  return doc.lastName ?? doc.nom ?? "";
}

export function getDepartment(doc) {
  if (!doc) return "";
  return doc.department ?? doc.departement ?? "";
}

export function getPasswordHash(doc) {
  if (!doc) return null;
  return doc.passwordHash ?? doc.mot_de_passe ?? null;
}

/** Remove password material from a user document clone for API output. */
export function stripPasswordFields(doc) {
  if (!doc) return doc;
  const { mot_de_passe, passwordHash, ...rest } = doc;
  return rest;
}

/**
 * Spread-safe shape for JSON APIs: keeps stored fields, adds canonical names.
 * After DB migration, legacy keys may be absent.
 */
export function withCanonicalUserFields(doc) {
  if (!doc) return doc;
  const base = stripPasswordFields(doc);
  return {
    ...base,
    firstName: getFirstName(doc),
    lastName: getLastName(doc),
    department: getDepartment(doc),
  };
}
