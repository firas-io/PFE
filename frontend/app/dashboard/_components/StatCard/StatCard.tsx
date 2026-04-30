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
        "rounded-5 border border-border/60 bg-white p-6 shadow-lg transition-all-custom duration-200",
        "hover:-translate-y-0.5 hover:shadow-xl"
      )}
    >
      <div className="mb-5 d-flex align-items-start justify-content-between gap-3">
        <p className="text-sm fw-medium text-muted">{title}</p>
        <span className="d-inline-flex h-11 w-11 align-items-center justify-content-center rounded-4 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-4xl fw-bold lh-1 tracking-tight text-body">{value}</p>
      {description ? <p className="mt-3 text-sm text-muted">{description}</p> : null}
    </div>
  );
}
