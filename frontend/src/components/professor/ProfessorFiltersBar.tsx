"use client";

import { Search } from "lucide-react";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import type { AcademicFilterState } from "@/lib/student-filters";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { PROFESOR_HINTS } from "@/constants/blenkir";

type ProfessorFiltersBarProps = {
  filters: AcademicFilterState;
  onChange: <K extends keyof AcademicFilterState>(key: K, value: AcademicFilterState[K]) => void;
  onSearch: () => void;
  onClear: () => void;
  grados: { id: string; label: string }[];
  secciones: SeccionOption[];
  courses?: { id: string; nombre: string }[];
  loading?: boolean;
  resultCount?: number;
  show?: Parameters<typeof AcademicFiltersBar>[0]["show"];
  requireSalonMessage?: boolean;
};

export function ProfessorFiltersBar({
  filters,
  onChange,
  onSearch,
  onClear,
  grados,
  secciones,
  courses = [],
  loading = false,
  resultCount,
  show,
  requireSalonMessage = true,
}: ProfessorFiltersBarProps) {
  return (
    <div className="space-y-3">
      <AcademicFiltersBar
        filters={filters}
        onChange={onChange}
        onReset={onClear}
        grados={grados}
        secciones={secciones}
        courses={courses}
        teachers={[]}
        show={{ ...show, search: false }}
      />
      {show?.search !== false ? (
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          <span className="mb-1 block">Buscar estudiante</span>
          <input
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
            placeholder="Nombre, apellido o código"
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={onSearch} disabled={loading}>
          <Search className="h-4 w-4" />
          Buscar
        </button>
        <button type="button" className="btn-secondary" onClick={onClear} disabled={loading}>
          Limpiar
        </button>
      </div>
      {resultCount !== undefined ? (
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {resultCount === 0
            ? "0 resultados encontrados"
            : `${resultCount} resultado(s) encontrado(s)`}
        </p>
      ) : null}
      {requireSalonMessage && resultCount === undefined && !filters.gradoId && !filters.seccionId ? (
        <p className="text-xs text-[var(--text-muted)]">{PROFESOR_HINTS.selectGradoSeccion}</p>
      ) : null}
    </div>
  );
}
