"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/src/types/category.types";

let memory: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;
const listeners = new Set<() => void>();

export interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  getBySlug: (slug: string) => Category | undefined;
  reload: () => void;
}

/** Clears cache and triggers refetch in all mounted useCategories() hooks. */
export function invalidateCategoriesCache() {
  memory = null;
  inflight = null;
  listeners.forEach((fn) => fn());
}

/**
 * Fetches GET /categories once per session and caches in module memory.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>(() => memory ?? []);
  const [loading, setLoading] = useState(() => memory === null);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    invalidateCategoriesCache();
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const onInvalidate = () => setReloadKey((k) => k + 1);
    listeners.add(onInvalidate);
    return () => {
      listeners.delete(onInvalidate);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = () => {
      if (!inflight) {
        inflight = apiFetch<Category[]>("/categories")
          .then((data) => {
            memory = data;
            return data;
          })
          .finally(() => {
            inflight = null;
          });
      }
      return inflight;
    };

    setLoading(true);
    fetchCategories()
      ?.then((data) => {
        if (cancelled) return;
        setCategories(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const getBySlug = useCallback(
    (slug: string): Category | undefined => {
      if (!slug) return undefined;
      const s = slug.toLowerCase();
      return categories.find((c) => c.slug === slug || c.slug?.toLowerCase() === s);
    },
    [categories]
  );

  return { categories, loading, error, getBySlug, reload };
}
