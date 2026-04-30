'use client';
import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

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

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((data: Omit<ToastData, "id">) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...data, id }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div role="region" aria-label="Notifications" className="hf-toasts">
        {toasts.map(t => (
          <ToastItem key={t.id} data={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2  size={15} strokeWidth={2} />,
  error:   <XCircle       size={15} strokeWidth={2} />,
  warning: <AlertTriangle size={15} strokeWidth={2} />,
  info:    <Info          size={15} strokeWidth={2} />,
};

function ToastItem({ data: t, onDismiss }: { data: ToastData; onDismiss: (id: string) => void }) {
  const variant = t.variant ?? "info";
  return (
    <div className={`hf-toast hf-toast--${variant}`}>
      <span className="hf-toast-icon">{ICON[variant]}</span>
      <div className="hf-toast-body">
        <p className="hf-toast-title">{t.title}</p>
        {t.description && <p className="hf-toast-desc">{t.description}</p>}
      </div>
      <button onClick={() => onDismiss(t.id)} className="hf-toast-close" aria-label="Fermer">
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
