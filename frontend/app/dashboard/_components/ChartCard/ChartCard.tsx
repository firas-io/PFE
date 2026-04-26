"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-6 shadow-lg", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
