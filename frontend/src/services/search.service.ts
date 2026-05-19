import { apiFetch } from "./api.service";

export interface SearchPagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchResult<T> {
  data: T[];
  pagination: SearchPagination;
  q: string;
}

export interface UserSearchParams {
  q: string;
  page?: number;
  limit?: number;
  managerId?: string;
}

export interface HabitSearchParams {
  q: string;
  page?: number;
  limit?: number;
  categorie?: string;
  statut?: string;
  includeArchived?: boolean;
}

export function searchUsers(params: UserSearchParams) {
  const sp = new URLSearchParams();
  sp.set("q", params.q.trim());
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.managerId) sp.set("managerId", params.managerId);
  return apiFetch<SearchResult<Record<string, unknown>>>(`/users/search?${sp}`);
}

export function searchHabits(params: HabitSearchParams) {
  const sp = new URLSearchParams();
  sp.set("q", params.q.trim());
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.categorie) sp.set("categorie", params.categorie);
  if (params.statut) sp.set("statut", params.statut);
  if (params.includeArchived) sp.set("includeArchived", "true");
  return apiFetch<SearchResult<Record<string, unknown>>>(`/habits/search?${sp}`);
}
