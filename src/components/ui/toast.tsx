"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  addToastFn?.({ message, type });
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (toast) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-in slide-in-from-right",
            colors[t.type]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
