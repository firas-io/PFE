import { getToken } from "./auth";

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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }

    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const bodyError = typeof record?.error === "string" ? record?.error : undefined;
    const bodyMessage = typeof record?.message === "string" ? record?.message : undefined;
    const msg =
      bodyError || bodyMessage || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  if (res.status === 204) {
    return null as T;
  }

  return (await res.json()) as T;
}

