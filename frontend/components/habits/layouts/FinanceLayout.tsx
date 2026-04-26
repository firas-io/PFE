"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Euro } from "lucide-react";
import DefaultLayout from "./DefaultLayout";
import type { HabitsLayoutProps } from "../layoutTypes";

export default function FinanceLayout(props: HabitsLayoutProps) {
  const type = String(props.fieldValues.type ?? "");
  const montant = Number(props.fieldValues.montant ?? 0) || 0;
  const positive = type === "revenu" || type === "epargne";
  const stroke = positive ? "#22c55e" : "#ef4444";
  const data = [
    { x: 1, y: Math.max(0, montant * 0.6) },
    { x: 2, y: Math.max(0, montant * 0.85) },
    { x: 3, y: montant },
  ];

  return (
    <DefaultLayout
      {...props}
      beforeFields={
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-xl border p-4 shadow-inner"
            style={{
              borderColor: `${stroke}55`,
              background: `linear-gradient(135deg, ${stroke}18, transparent)`,
            }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Euro className="h-3.5 w-3.5" aria-hidden />
              Montant
            </div>
            <p
              className="mt-2 text-3xl font-black tabular-nums"
              style={{ color: stroke }}
            >
              {montant.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Type : {type || "—"} · tendance symbolique
            </p>
          </div>
          <div className="min-w-0 rounded-xl border border-border/50 bg-muted/10 p-2">
            <div className="h-24 w-full min-w-0">
              <ResponsiveContainer width="100%" height={96} minWidth={0}>
                <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                    }}
                  />
                  <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      }
    />
  );
}
