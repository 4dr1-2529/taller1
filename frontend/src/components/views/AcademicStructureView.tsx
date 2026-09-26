"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Layers, School } from "lucide-react";
import { api, type ApiNivel } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/Skeleton";

export function AcademicStructureView() {
  const { isAuthenticated } = useAuth();
  const [niveles, setNiveles] = useState<ApiNivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [isAuthenticated, reloadKey]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Estructura académica"
        description="Inicie sesión para ver niveles, grados y secciones configurados para el periodo académico."
        showLogin
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        technicalDetail="GET /niveles + /secciones"
        onRetry={() => setReloadKey((k) => k + 1)}
        retryLabel="Volver a intentar"
      />
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <PageHeader
        icon={School}
        eyebrow="Configuración institucional"
        title="Niveles, grados y secciones"
        description="Organización académica vigente para el periodo lectivo en curso."
      />

      {/* Info Card */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <div className="premium-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] ring-1 ring-[var(--border-subtle)]">
              <Layers className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Estructura institucional
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Niveles, grados, secciones y cursos según la configuración vigente del periodo académico.
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] ring-1 ring-white/10">
                <GraduationCap className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <h4 className="font-semibold capitalize text-[var(--text-primary)]">{nivel.nombre}</h4>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
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
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] ring-1 ring-[var(--brand-orange)]/25"
                      >
                        <BookOpen className="h-3 w-3" aria-hidden />
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
