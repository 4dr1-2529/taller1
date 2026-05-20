"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Layers } from "lucide-react";
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
    return <p className="text-sm text-slate-500">Cargando estructura educativa…</p>;
  }

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-indigo-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Modelo educativo peruano — I.E.P. Huancayo
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Primaria (1°–6°) y Secundaria (1°–5°) con secciones A, B y C. Los cursos varían por grado según el
              catálogo curricular nacional.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {niveles.map((nivel) => (
          <article key={nivel.id} className="glass-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-violet-500" />
              <h4 className="font-semibold capitalize text-slate-900 dark:text-slate-100">{nivel.nombre}</h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {nivel.grados.length} grados
              </span>
            </div>
            <ul className="space-y-3">
              {nivel.grados.map((grado) => (
                <li key={grado.id} className="rounded-xl border border-slate-200/80 p-3 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{grado.nombre}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {grado.secciones.map((sec) => (
                      <span
                        key={sec.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                      >
                        <BookOpen className="h-3 w-3" />
                        Sección {sec.nombre}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
