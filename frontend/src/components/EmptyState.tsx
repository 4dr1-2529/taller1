"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Database, LogIn, Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  showLogin?: boolean;
  actionLabel?: string;
};

export function EmptyState({ title, description, showLogin, actionLabel }: EmptyStateProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-8 py-16 text-center shadow-[var(--card-shadow)]"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="pointer-events-none absolute -left-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent-muted)] blur-3xl" />
      <div className="relative flex flex-col items-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
          <Database className="h-7 w-7 text-[var(--brand-orange)]" />
        </span>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
        {showLogin ? (
          <Link href="/login" className="btn-primary mt-6 inline-flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Link>
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
