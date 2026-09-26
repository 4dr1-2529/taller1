"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

type ErrorStateProps = {
  /** Título corto y humano, sin jerga técnica. */
  title?: string;
  /** Qué pudo pasar y qué puede hacer la persona. Nunca stack ni JSON. */
  message: string;
  /** Muestra un botón de reintento si la pantalla sabe recargar. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Detalle técnico: solo se muestra en consola, nunca en pantalla. */
  technicalDetail?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Estado de error uniforme: icono + título + mensaje accionable.
 * El detalle técnico queda fuera del DOM (solo consola) para no exponer
 * errores internos al usuario final.
 */
export function ErrorState({
  title = "No se pudo cargar la información",
  message,
  onRetry,
  retryLabel = "Reintentar",
  technicalDetail,
  children,
  className,
}: ErrorStateProps) {
  const reduced = useReducedMotion();

  if (technicalDetail && process.env.NODE_ENV !== "production") {
    console.warn("[UI]", title, technicalDetail);
  }

  return (
    <motion.div
      role="alert"
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-5 py-8 text-center sm:px-8",
        className,
      )}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger)]/12 ring-1 ring-[var(--danger)]/30">
        <AlertTriangle className="h-6 w-6 text-[var(--danger)]" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
      {children}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary mt-5 inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </button>
      ) : null}
    </motion.div>
  );
}
