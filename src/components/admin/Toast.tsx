"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (title: string, message?: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-up ${
              t.type === "success"
                ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40"
                : t.type === "error"
                ? "bg-slate-900/90 border-rose-500/40 text-rose-300 shadow-rose-950/40"
                : "bg-slate-900/90 border-violet-500/40 text-violet-300 shadow-violet-950/40"
            }`}
          >
            <div className="flex items-start gap-3">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
              {t.type === "info" && <Info className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">{t.title}</h4>
                {t.message && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{t.message}</p>}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-2"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      toast: (title: string, message?: string) => {
        console.log(`[Toast] ${title}: ${message ?? ""}`);
      },
    };
  }
  return context;
}
