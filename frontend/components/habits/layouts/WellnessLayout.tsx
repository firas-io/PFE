"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

const MOOD: Record<string, string> = {
  triste: "😞",
  neutre: "😐",
  bien: "🙂",
  joyeux: "😄",
  top: "🤩",
};

export default function WellnessLayout(props: HabitsLayoutProps) {
  const humeurKey = String(props.fieldValues.humeur ?? "");
  const sleep = Number(props.fieldValues.heures_sommeil ?? 0) || 0;
  const data = [
    { h: "Lun", s: Math.max(0, sleep - 1) },
    { h: "Mar", s: sleep },
    { h: "Mer", s: Math.max(0, sleep - 0.5) },
    { h: "Jeu", s: sleep },
    { h: "Ven", s: Math.min(12, sleep + 0.5) },
  ];

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/5 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Humeur
            </span>
            <motion.div
              key={humeurKey}
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className="mt-2 text-5xl leading-none"
              aria-label={`Humeur ${humeurKey}`}
            >
              {MOOD[humeurKey] ?? "😐"}
            </motion.div>
          </div>
          <div className="min-w-0 space-y-1 rounded-xl border border-border/50 bg-muted/10 p-2">
            <div className="h-24 w-full min-w-0">
              <ResponsiveContainer width="100%" height={96} minWidth={0}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <YAxis hide domain={[0, 12]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                    }}
                    formatter={(v) => [`${String(v ?? "")} h`, "Sommeil"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="s"
                    stroke="#10b981"
                    fill="#10b98133"
                    strokeWidth={2}
                    name="Heures"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="px-1 text-center text-[10px] text-muted-foreground">
              Aperçu hebdomadaire indicatif (valeur saisie : {sleep} h)
            </p>
          </div>
        </div>
      }
    />
  );
}
