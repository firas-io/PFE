export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} q - Search term (also accepts legacy `search` alias at call site)
 * @param {{ minLength?: number }} opts
 * @returns {RegExp|null}
 */
export function parseSearchQuery(q, { minLength = 1 } = {}) {
  const term = String(q ?? "").trim();
  if (term.length < minLength) return null;
  return new RegExp(escapeRegex(term), "i");
}
