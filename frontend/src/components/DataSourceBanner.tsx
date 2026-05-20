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
      className={`group relative overflow-hidden rounded-2xl border px-5 py-4 text-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between ${
        isApi
          ? "border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10"
          : "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10"
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <motion.span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isApi
              ? "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30"
              : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isApi ? <Cloud className="h-4 w-4" aria-hidden /> : <CloudOff className="h-4 w-4" aria-hidden />}
        </motion.span>
        <span className="text-[var(--text-secondary)]">
          {isApi
            ? "Datos en tiempo real desde la API y base de datos."
            : isAuthenticated
              ? "Sin conexión a la API. Verifique que el backend esté activo (puerto 4000)."
              : "Sistema limpio. Inicie sesión y registre sus datos institucionales reales."}
        </span>
      </div>

      <div className="relative mt-3 flex items-center gap-2 sm:mt-0">
        {isAuthenticated && onRefresh ? (
          <motion.button
            type="button"
            disabled={loading}
            onClick={() => void onRefresh()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </motion.button>
        ) : null}
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/40 hover:brightness-110"
          >
            Iniciar sesión
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}
