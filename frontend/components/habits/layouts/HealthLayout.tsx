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
        <div className="position-relative overflow-hidden rounded-4 border border-red-500/20 bg-red-500/5 p-3">
          <div className="position-absolute right-2 top-2 opacity-10" aria-hidden>
            <Icon className="h-16 w-16 text-red-500" />
          </div>
          <p className="text-[10px] fw-semibold text-uppercase tracking-wide text-muted">
            Timeline santé
          </p>
          <ol className="position-relative mt-3 space-y-3 border-l border-red-500/30 ps-4">
            <li className="position-relative">
              <span className="position-absolute -left-[21px] top-1 d-flex h-3 w-3 align-items-center justify-content-center rounded-pill bg-red-500" />
              <div className="d-flex align-items-center gap-2 text-xs fw-medium text-body">
                <Icon className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                Action : {t}
              </div>
              {props.fieldValues.quantite != null && (
                <p className="mt-0.5 text-[11px] text-muted">
                  Quantité enregistrée : {String(props.fieldValues.quantite)}
                </p>
              )}
            </li>
            <li className="position-relative text-[11px] text-muted">
              <span className="position-absolute -left-[21px] top-1 d-flex h-3 w-3 align-items-center justify-content-center rounded-pill bg-muted-foreground/40" />
              Rappel : gardez une trace régulière pour votre suivi médical.
            </li>
          </ol>
        </div>
      }
    />
  );
}
