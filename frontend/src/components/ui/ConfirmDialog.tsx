"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/** Diálogo de confirmación accesible y responsive (Escape, foco, una sola acción). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  busy = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const targets = Array.from(
        root.querySelectorAll<HTMLElement>("button:not(:disabled), select, input, [tabindex='0']"),
      ).filter((el) => el.getClientRects().length);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-[#0a1729]/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-xl sm:p-6"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
            {children ? <div className="mt-4">{children}</div> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="btn-primary"
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? "Procesando…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
