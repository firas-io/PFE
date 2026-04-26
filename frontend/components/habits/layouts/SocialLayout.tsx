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
        <div className="flex flex-col gap-3 rounded-xl border border-pink-500/25 bg-pink-500/5 p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-600 dark:text-pink-300">
              <Icon className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Type d&apos;interaction
              </p>
              <p className="text-sm font-bold text-foreground">{key || "—"}</p>
              <p className="text-[11px] text-muted-foreground">{duree} min enregistrées</p>
            </div>
          </div>
          <div className="sm:w-40">
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">Fréquence (indicatif)</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-500"
                style={{ width: `${freq}%` }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
