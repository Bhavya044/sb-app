"use client";

import { clsx } from "clsx";

type ToastProps = {
  message: string;
  variant: "success" | "error";
};

export default function Toast({ message, variant }: ToastProps) {
  return (
    <div
      role="status"
      className={clsx(
        "fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-slate-950/60",
        variant === "success" ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200" : "border-rose-400/50 bg-rose-500/10 text-rose-200"
      )}
    >
      {message}
    </div>
  );
}
