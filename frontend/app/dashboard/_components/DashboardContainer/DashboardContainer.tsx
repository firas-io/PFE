"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
  className?: string;
}

export function DashboardContainer({ children, className }: DashboardContainerProps) {
  return (
    <div className={cn("min-h-full bg-gradient-to-b from-background to-muted/20", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
    </div>
  );
}
