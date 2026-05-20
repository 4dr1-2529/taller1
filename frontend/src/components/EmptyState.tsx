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
      className="premium-card flex flex-col items-center rounded-2xl px-6 py-16 text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 ring-1 ring-indigo-500/30">
        <Database className="h-8 w-8 text-indigo-400" />
      </span>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      {showLogin ? (
        <Link href="/login" className="btn-primary mt-8">
          <LogIn className="h-4 w-4" />
          Iniciar sesión
        </Link>
      ) : (
        <p className="mt-6 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Los indicadores IA se activan al registrar estudiantes
        </p>
      )}
    </motion.div>
  );
}
