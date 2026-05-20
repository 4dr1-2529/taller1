"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Layers, School } from "lucide-react";
import { api, type ApiNivel } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import { EmptyState } from "@/components/EmptyState";

export function AcademicStructureView() {
  const { isAuthenticated } = useAuth();
  const [niveles, setNiveles] = useState<ApiNivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !api.hasToken) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const res = await api.getNiveles();
        setNiveles(res.items);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar la estructura");
        setNiveles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Estructura académica"
        description="Inicie sesión para ver niveles, grados y secciones del colegio (Primaria y Secundaria — Huancayo)."
        showLogin
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Cargando estructura educativa…</p>;
  }

  if (error) {
    return (
      <div className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
            <Layers className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
              <School className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Academic Structure
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Peruvian educational model — levels, grades, and sections
          </p>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <div className="premium-card rounded-2xl p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
              <Layers className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Modelo educativo peruano — I.E.P. Huancayo
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Primaria (1°–6°) y Secundaria (1°–5°) con secciones A, B y C. Los cursos varían por grado según el
                catálogo curricular nacional.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Levels Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {niveles.map((nivel, idx) => (
          <motion.article
            key={nivel.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.1 }}
            className="premium-card rounded-2xl p-5 md:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
                <GraduationCap className="h-4 w-4 text-violet-400" />
              </div>
              <h4 className="font-semibold capitalize text-[var(--text-primary)]">{nivel.nombre}</h4>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--text-secondary)] ring-1 ring-white/10">
                {nivel.grados.length} grados
              </span>
            </div>
            <ul className="space-y-3">
              {nivel.grados.map((grado) => (
                <li key={grado.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{grado.nombre}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {grado.secciones.map((sec) => (
                      <span
                        key={sec.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20"
                      >
                        <BookOpen className="h-3 w-3" />
                        Sección {sec.nombre}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
