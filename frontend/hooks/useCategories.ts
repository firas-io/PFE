"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/src/types/category.types";

let memory: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

export interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  getBySlug: (slug: string) => Category | undefined;
}

/**
 * Fetches GET /categories once per session and caches in module memory.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>(() => memory ?? []);
  const [loading, setLoading] = useState(() => memory === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (memory) {
      setCategories(memory);
      setLoading(false);
      return;
    }

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

    setLoading(true);
    inflight
      .then((data) => {
        setCategories(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => setLoading(false));
  }, []);

  const getBySlug = useCallback(
    (slug: string): Category | undefined => categories.find((c) => c.slug === slug),
    [categories]
  );

  return { categories, loading, error, getBySlug };
}
