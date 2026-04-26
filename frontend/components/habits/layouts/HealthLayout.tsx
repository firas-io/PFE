"use client";

import { Droplets, Pill, Stethoscope } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

const TYPE_ICON: Record<string, typeof Pill> = {
  medicament: Pill,
  consultation: Stethoscope,
  hydratation: Droplets,
  autre: Pill,
};

export default function HealthLayout(props: HabitsLayoutProps) {
  const t = String(props.fieldValues.type_action ?? "autre");
  const Icon = TYPE_ICON[t] ?? Pill;

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="absolute right-2 top-2 opacity-10" aria-hidden>
            <Icon className="h-16 w-16 text-red-500" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Timeline santé
          </p>
          <ol className="relative mt-3 space-y-3 border-l border-red-500/30 pl-4">
            <li className="relative">
              <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500" />
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Icon className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                Action : {t}
              </div>
              {props.fieldValues.quantite != null && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Quantité enregistrée : {String(props.fieldValues.quantite)}
                </p>
              )}
            </li>
            <li className="relative text-[11px] text-muted-foreground">
              <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/40" />
              Rappel : gardez une trace régulière pour votre suivi médical.
            </li>
          </ol>
        </div>
      }
    />
  );
}
