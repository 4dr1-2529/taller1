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
          ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-amber-200/80 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {isApi ? (
          <Cloud className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>
          {isApi
            ? "Datos en tiempo real desde la API y base de datos."
            : isAuthenticated
              ? "API no disponible — usando datos demo locales."
              : "Modo demo local. Inicie sesión para sincronizar con el servidor."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isAuthenticated && onRefresh ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-1 rounded-lg bg-white/60 px-3 py-1.5 text-xs font-semibold ring-1 ring-black/5 hover:bg-white disabled:opacity-50 dark:bg-slate-800/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        ) : null}
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Iniciar sesión
          </Link>
        ) : null}
      </div>
    </div>
  );
}
