"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Database, LogIn, Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  showLogin?: boolean;
};

export function EmptyState({ title, description, showLogin }: EmptyStateProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-8 py-20 text-center shadow-[var(--card-shadow)]"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <motion.span
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-violet-500/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Database className="h-8 w-8 text-violet-400" />
        </motion.span>

        <motion.h3
          className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {title}
        </motion.h3>

        <motion.p
          className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {description}
        </motion.p>

        {showLogin ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Link
              href="/login"
              className="btn-primary mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/40 hover:brightness-110"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          </motion.div>
        ) : (
          <motion.p
            className="mt-8 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Los indicadores IA se activan al registrar estudiantes
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
