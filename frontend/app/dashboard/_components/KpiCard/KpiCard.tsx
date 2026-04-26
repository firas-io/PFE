'use client';
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "streak" | "info" | "warning";
  hint?: string;
}

const accentMap = {
  primary: "from-primary/15 to-primary-glow/10 text-primary",
  success: "from-success/15 to-success/5 text-success",
  streak: "from-streak/20 to-streak/5 text-streak",
  info: "from-info/15 to-info/5 text-info",
  warning: "from-warning/15 to-warning/5 text-warning",
};

export function KpiCard({ label, value, delta, icon: Icon, accent = "primary", hint }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="card-elevated group relative overflow-hidden p-5 hover:-translate-y-0.5 hover:shadow-soft transition-smooth">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
          accentMap[accent]
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
