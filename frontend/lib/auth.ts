/**
 * auth.ts — Backward-compatible re-export.
 * The actual implementation has been moved to src/services/auth.service.ts.
 * Existing imports of "@/lib/auth" continue to work without changes.
 */
export { getToken, setToken, getRefreshToken, setRefreshToken, clearAuth, setUser, getUser } from "../src/services/auth.service";
