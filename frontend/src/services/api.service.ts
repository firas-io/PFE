/**
 * api.service.ts
 * HTTP fetch wrapper with automatic access-token refresh on 401.
 */
import { clearAuth, getRefreshToken, getToken, getUser, setRefreshToken, setToken, setUser } from "./auth.service";

function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return "http://localhost:5000";
}

export const API_BASE = resolveApiBase();

// Prevents multiple simultaneous refresh requests
let _refreshing: Promise<string | null> | null = null;

async function _tryRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) { clearAuth(); return null; }

  try {
    const res = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { clearAuth(); return null; }

    const data = await res.json().catch(() => null);
    const at = data?.accessToken ?? data?.token ?? null;
    if (!at) { clearAuth(); return null; }

    setToken(at);
    if (data?.refreshToken) setRefreshToken(data.refreshToken);
    // Keep role/permissions in localStorage aligned with the new access token payload.
    if (data?.user && typeof data.user === "object") {
      const prev = getUser<Record<string, unknown>>() ?? {};
      setUser({ ...prev, ...data.user });
    }
    return at;
  } catch {
    clearAuth();
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const hasBody  = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res  = await fetch(url, { ...options, headers });

  // ── Auto-refresh on 401 ─────────────────────────────────────────────────
  if (res.status === 401 && !_retried) {
    if (!_refreshing) _refreshing = _tryRefresh().finally(() => { _refreshing = null; });
    const newToken = await _refreshing;

    if (!newToken) {
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expirée. Reconnectez-vous.");
    }
    return apiFetch<T>(path, options, true);
  }

  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* ignore */ }
    const record     = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const bodyError  = typeof record?.error   === "string" ? record.error   : undefined;
    const bodyMsg    = typeof record?.message === "string" ? record.message : undefined;
    throw new Error(bodyError ?? bodyMsg ?? `HTTP ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
