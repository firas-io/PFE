/**
 * api.ts — Backward-compatible re-export.
 * The actual implementation has been moved to src/services/api.service.ts.
 * Existing imports of "@/lib/api" continue to work without changes.
 */
export { apiFetch, API_BASE } from "../src/services/api.service";
