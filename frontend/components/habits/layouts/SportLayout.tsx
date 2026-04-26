"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Activity, Zap } from "lucide-react";
import type { HabitsLayoutProps } from "../layoutTypes";
import DefaultLayout from "./DefaultLayout";

const INTENSITY_LABEL: Record<string, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  elevee: "Élevée",
};

export default function SportLayout(props: HabitsLayoutProps) {
  const { fieldValues } = props;
  const distance = Number(fieldValues.distance ?? 0) || 0;
  const duree = Number(fieldValues.duree ?? 0) || 0;
  const intensite = String(fieldValues.intensite ?? "");
  const chartData = [
    { name: "km", value: distance },
    { name: "min", value: duree },
  ];

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Intensité : {INTENSITY_LABEL[intensite] ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <Activity className="h-3 w-3" aria-hidden />
              Suivi distance & durée
            </span>
          </div>
          <div className="w-full min-w-0 rounded-xl border border-border/50 bg-muted/10 p-2">
            <div className="h-24 w-full min-w-0">
              <ResponsiveContainer width="100%" height={96} minWidth={0}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} name="Valeur" />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      }
    />
  );
}
