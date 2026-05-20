"use client";

import Link from "next/link";
import { Database, LogIn } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  showLogin?: boolean;
};

export function EmptyState({ title, description, showLogin }: EmptyStateProps) {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <Database className="mb-4 h-12 w-12 text-slate-400" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {showLogin ? (
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <LogIn className="h-4 w-4" />
          Iniciar sesión
        </Link>
      ) : null}
    </div>
  );
}
