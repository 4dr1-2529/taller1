"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Database, LogIn, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  showLogin?: boolean;
  actionLabel?: string;
  /** Icono contextual; por defecto Database. */
  icon?: LucideIcon;
  /** CTA real (botón/enlace) cuando la persona sí puede hacer algo. */
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  showLogin,
  actionLabel,
  icon: Icon = Database,
  action,
}: EmptyStateProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      role="status"
      className="intelligence-empty relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-12 sm:px-8 sm:py-16 text-center shadow-[var(--card-shadow)]"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="relative flex flex-col items-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
          <Icon className="h-7 w-7 text-[var(--brand-orange)]" aria-hidden />
        </span>
        <h3 className="text-section-title font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
        {showLogin ? (
          <Link href="/login" className="btn-primary mt-6 inline-flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Link>
        ) : action ? (
          <div className="mt-6">{action}</div>
        ) : actionLabel ? (
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--brand-orange)]" />
            {actionLabel}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
