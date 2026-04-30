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
    <div className="card-elevated group position-relative overflow-hidden p-5 hover:-translate-y-0.5 hover:shadow-soft transition-smooth">
      <div
        className={cn(
          "position-absolute -right-6 -top-6 h-28 w-28 rounded-pill bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
          accentMap[accent]
        )}
      />
      <div className="position-relative d-flex align-items-start justify-content-between">
        <div className="space-y-1.5">
          <p className="text-xs fw-medium text-uppercase tracking-wider text-muted">{label}</p>
          <p className="fs-2 fw-bold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <div className={cn("d-flex h-10 w-10 align-items-center justify-content-center rounded-4 bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="position-relative mt-4 d-flex align-items-center gap-1.5 text-xs fw-medium">
          <span
            className={cn(
              "d-flex align-items-center gap-0.5 rounded-pill px-2 py-0.5",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted">vs last period</span>
        </div>
      )}
    </div>
  );
}
