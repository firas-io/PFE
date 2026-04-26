'use client';
import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, "id">) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((data: Omit<ToastData, "id">) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...data, id }]); // max 5 at once
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} data={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single toast item ────────────────────────────────────────────────────────

const ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />,
  error:   <XCircle      className="h-4 w-4 text-destructive flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />,
  info:    <Info          className="h-4 w-4 text-info flex-shrink-0" />,
};

const BORDER: Record<ToastVariant, string> = {
  success: "border-success/25",
  error:   "border-destructive/25",
  warning: "border-warning/25",
  info:    "border-info/25",
};

function ToastItem({ data: t, onDismiss }: { data: ToastData; onDismiss: (id: string) => void }) {
  const variant = t.variant ?? "info";
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur-sm",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        BORDER[variant]
      )}
    >
      {ICON[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
