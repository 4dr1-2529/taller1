"use client";

import { useCallback, useEffect, useState } from "react";
import { profesorService } from "@/services/profesorService";
import { useAuth } from "@/contexts/AuthProvider";
import type { SeccionOption } from "@/hooks/useAcademicStructure";

function mapSeccion(s: {
  id: string;
  nombre: string;
  grado?: {
    id: number | string;
    numero: number;
    nombre: string;
    nivel?: { codigo: string; nombre: string };
  };
}): SeccionOption {
  const grado = s.grado;
  const nivel = grado?.nivel?.codigo === "secundaria" ? "Secundaria" : "Primaria";
  const gradoNombre = grado?.nombre ?? `${grado?.numero ?? ""}°`;
  const gradoLabel = `${nivel} · ${gradoNombre}`;
  return {
    id: s.id,
    nombre: s.nombre,
    gradoId: Number(grado?.id ?? grado?.numero ?? 0),
    nivelCodigo: grado?.nivel?.codigo ?? "primaria",
    gradoLabel,
    label: `${gradoLabel} ${s.nombre}`,
  };
}

/** Secciones y grados solo del profesor autenticado. */
export function useProfessorStructure() {
  const { isAuthenticated, isDocente, loading: authLoading } = useAuth();
  const [secciones, setSecciones] = useState<SeccionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !isDocente) {
      setSecciones([]);
      return;
    }
    setLoading(true);
    try {
      const res = await profesorService.getSecciones();
      setSecciones(res.items.map(mapSeccion));
    } catch {
      setSecciones([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDocente]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [load, authLoading]);

  return { secciones, loading, refresh: load };
}
