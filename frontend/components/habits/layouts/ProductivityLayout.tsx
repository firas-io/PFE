"use client";

import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

function MiniHeatmap({ active }: { active: number }) {
  const cells = Array.from({ length: 28 }, (_, i) => i < active);
  return (
    <div className="grid grid-cols-7 gap-1" aria-label="Heatmap de concentration (symbolique)">
      {cells.map((on, i) => (
        <div
          key={i}
          className={`h-3.5 w-full rounded-sm ${on ? "bg-violet-500/80" : "bg-muted/60"}`}
        />
      ))}
    </div>
  );
}

export default function ProductivityLayout(props: HabitsLayoutProps) {
  const tasks = Math.min(99, Number(props.fieldValues.taches_terminees ?? 0) || 0);
  const focus = Number(props.fieldValues.temps_concentration ?? 0) || 0;

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-violet-600 dark:text-violet-300" aria-hidden />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tâches terminées
                </p>
                <motion.span
                  key={tasks}
                  initial={{ scale: 1.15, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="inline-block text-3xl font-black tabular-nums text-violet-700 dark:text-violet-200"
                >
                  {tasks}
                </motion.span>
              </div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground">
              <div className="font-semibold text-foreground">{focus} min</div>
              <div>concentration saisie</div>
            </div>
          </div>
          <MiniHeatmap active={Math.min(28, Math.max(1, Math.round(focus / 5)))} />
        </div>
      }
    />
  );
}
