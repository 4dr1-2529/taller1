"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import type { DataSource } from "@/hooks/useAcademicData";

type DataSourceBannerProps = {
  dataSource: DataSource;
  loading?: boolean;
  onRefresh?: () => void;
};

export function DataSourceBanner({ dataSource, loading, onRefresh }: DataSourceBannerProps) {
  const { isAuthenticated } = useAuth();
  const isApi = dataSource === "api";

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
        isApi
          ? "border-emerald-500/25 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/8"
          : "border-amber-500/30 bg-amber-500/8 dark:border-amber-500/25 dark:bg-amber-500/10"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:mt-0 ${
            isApi
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          }`}
        >
          {isApi ? <Cloud className="h-4 w-4" aria-hidden /> : <CloudOff className="h-4 w-4" aria-hidden />}
        </span>
        <p className="text-[var(--text-secondary)] leading-snug">
          {isApi
            ? "Datos en tiempo real desde la API y base de datos."
            : isAuthenticated
              ? "No se pudieron cargar los datos. Verifique el backend (puerto 4000) y vuelva a iniciar sesión."
              : "Inicie sesión y registre los datos institucionales del colegio."}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
        {isAuthenticated && onRefresh ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-violet-500/35 hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        ) : null}
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Iniciar sesión
          </Link>
        ) : null}
      </div>
    </div>
  );
}
