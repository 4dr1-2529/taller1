"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";

export type SeccionOption = {
  id: string;
  nombre: string;
  /** Ej. Primaria · 4° Primaria A */
  label: string;
  /** Ej. Primaria · 4° Primaria */
  gradoLabel: string;
  gradoId: number;
  nivelCodigo: string;
};

export function useAcademicStructure() {
  const { isAuthenticated } = useAuth();
  const [secciones, setSecciones] = useState<SeccionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!api.hasToken) {
      setSecciones([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getSecciones();
      const options: SeccionOption[] = res.items.map((s) => {
        const grado = s.grado;
        const nivel = grado?.nivel?.codigo === "secundaria" ? "Secundaria" : "Primaria";
        const gradoNombre = grado?.nombre ?? `${grado?.numero}°`;
        const gradoLabel = `${nivel} · ${gradoNombre}`;
        return {
          id: s.id,
          nombre: s.nombre,
          gradoId: Number(grado?.id ?? 0),
          nivelCodigo: grado?.nivel?.codigo ?? "primaria",
          gradoLabel,
          label: `${gradoLabel} ${s.nombre}`,
        };
      });
      setSecciones(options);
    } catch {
      setSecciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setSecciones([]);
  }, [isAuthenticated, load]);

  return { secciones, loading, refresh: load };
}
