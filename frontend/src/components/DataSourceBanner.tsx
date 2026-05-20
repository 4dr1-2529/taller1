"use client";

import { motion } from "framer-motion";
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
    <motion.div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between ${
        isApi
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
          : "border-amber-500/25 bg-amber-500/10 text-amber-100"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2">
        {isApi ? (
          <Cloud className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        ) : (
          <CloudOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        )}
        <span className="text-[var(--text-secondary)]">
          {isApi
            ? "Datos en tiempo real desde la API y base de datos."
            : isAuthenticated
              ? "Sin conexión a la API. Verifique que el backend esté activo (puerto 4000)."
              : "Sistema limpio. Inicie sesión y registre sus datos institucionales reales."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isAuthenticated && onRefresh ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onRefresh()}
            className="btn-ghost border-white/10 bg-white/5 text-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        ) : null}
        {!isAuthenticated ? (
          <Link href="/login" className="btn-primary py-2 text-xs">
            Iniciar sesión
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}
