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
    <div className={cn("rounded-5 border border-border/60 bg-white p-6 shadow-lg", className)}>
      <div className="mb-5 d-flex align-items-start justify-content-between gap-3">
        <div>
          <h3 className="fs-5 fw-semibold text-body">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
