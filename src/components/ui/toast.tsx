"use client";

import React, { useState, useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

export const toast = {
  success(msg: string) {
    this.show(msg, "success");
  },
  error(msg: string) {
    this.show(msg, "error");
  },
  info(msg: string) {
    this.show(msg, "info");
  },
  show(message: string, type: ToastType = "info") {
    const id = Math.random().toString();
    toasts = [...toasts, { id, message, type }];
    toastListeners.forEach((listener) => listener(toasts));
    
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      toastListeners.forEach((listener) => listener(toasts));
    }, 4000);
  },
};

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setActiveToasts);
    // Initialize with current toasts
    setActiveToasts(toasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setActiveToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {activeToasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-2xl shadow-xl text-xs font-bold border flex items-center justify-between pointer-events-auto transition-all duration-300 transform translate-y-0 scale-100 ${
            t.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-250/30"
              : t.type === "error"
              ? "bg-red-50 text-red-800 border-red-250/30"
              : "bg-zinc-950 text-zinc-100 border-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {t.type === "success" ? "✓" : t.type === "error" ? "⚠" : "ℹ"}
            <span>{t.message}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              toasts = toasts.filter((item) => item.id !== t.id);
              toastListeners.forEach((listener) => listener(toasts));
            }}
            className="ml-4 hover:opacity-80 cursor-pointer font-bold text-[10px] p-1 opacity-50 text-current"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
