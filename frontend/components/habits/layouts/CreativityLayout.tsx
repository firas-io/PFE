"use client";

import { Brush } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

function isLikelyImageUrl(s: string): boolean {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(s.trim());
}

export default function CreativityLayout(props: HabitsLayoutProps) {
  const production = String(props.fieldValues.production ?? "").trim();
  const discipline = String(props.fieldValues.discipline ?? "");
  const showImg = isLikelyImageUrl(production);

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            <Brush className="h-4 w-4" aria-hidden />
            Discipline : {discipline || "—"}
          </div>
          {showImg ? (
            <div className="relative aspect-video w-full max-h-40 overflow-hidden rounded-lg border border-border/60 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- URLs utilisateur arbitraires */}
              <img
                src={production}
                alt="Production créative"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : production ? (
            <p className="rounded-lg border border-dashed border-amber-500/40 bg-card/60 px-3 py-2 text-xs text-muted-foreground">
              {production}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Ajoutez une URL d&apos;image dans « production » pour la galerie.</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Timeline créative — prochaines itérations pourront lier plusieurs productions.
          </p>
        </div>
      }
    />
  );
}
