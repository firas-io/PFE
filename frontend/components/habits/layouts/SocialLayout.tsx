"use client";

import { HeartHandshake, UserCircle2, Users } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

const INTERACTION: Record<string, typeof Users> = {
  famille: HeartHandshake,
  amis: Users,
  collegues: UserCircle2,
  autre: Users,
};

export default function SocialLayout(props: HabitsLayoutProps) {
  const key = String(props.fieldValues.type_interaction ?? "autre");
  const Icon = INTERACTION[key] ?? Users;
  const duree = Number(props.fieldValues.duree ?? 0) || 0;
  const freq = Math.min(100, Math.round(Math.min(duree, 120) / 1.2));

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="d-flex flex-column gap-3 rounded-4 border border-pink-500/25 bg-pink-500/5 p-3 flex-sm-row align-items-sm-center">
          <div className="d-flex flex-fill align-items-center gap-3">
            <div className="d-flex h-14 w-14 align-items-center justify-content-center rounded-5 bg-pink-500/20 text-pink-600 dark:text-pink-300">
              <Icon className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] fw-semibold text-uppercase tracking-wide text-muted">
                Type d&apos;interaction
              </p>
              <p className="text-sm fw-bold text-body">{key || "—"}</p>
              <p className="text-[11px] text-muted">{duree} min enregistrées</p>
            </div>
          </div>
          <div className="w-100">
            <p className="mb-1 text-[10px] fw-medium text-muted">Fréquence (indicatif)</p>
            <div className="h-2 overflow-hidden rounded-pill bg-light">
              <div
                className="h-100 rounded-pill bg-pink-500 transition-all-custom duration-500"
                style={{ width: `${freq}%` }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
