"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

interface TaskCompleteToggleProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function TaskCompleteToggle({
  checked,
  onToggle,
  disabled = false,
  className,
  ariaLabel,
}: TaskCompleteToggleProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 transition-all duration-200",
        checked
          ? "border-success/60 bg-success text-white shadow-glow"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      aria-label={ariaLabel ?? (checked ? "Marquer incomplet" : "Marquer complété")}
      aria-pressed={checked}
    >
      <motion.span
        key={checked ? "on" : "off"}
        initial={{ scale: 0.75, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : <Circle className="h-4 w-4" />}
      </motion.span>
    </motion.button>
  );
}
