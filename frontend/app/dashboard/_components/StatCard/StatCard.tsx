"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-lg transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-xl"
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-4xl font-bold leading-none tracking-tight text-foreground">{value}</p>
      {description ? <p className="mt-3 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
