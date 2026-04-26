"use client";

import { BookMarked, TrendingUp } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

export default function StudyLayout(props: HabitsLayoutProps) {
  const pages = Number(props.fieldValues.pages_lues ?? 0) || 0;
  const goal = 50;
  const pct = Math.min(100, Math.round((pages / goal) * 100));
  const sujet = String(props.fieldValues.sujet ?? "").trim();

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <BookMarked className="h-3.5 w-3.5" aria-hidden />
              {sujet || "Matière / sujet"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <TrendingUp className="h-3 w-3" aria-hidden />
              {pages} p. · objectif indicatif {goal} p.
            </span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Progression pages</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
