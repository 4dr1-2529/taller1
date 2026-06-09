"use client";

import { Filter, RotateCcw, Search } from "lucide-react";
import { BIMESTRES } from "@/constants/blenkir";
import type { AcademicFilterState } from "@/lib/student-filters";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { INPUT_CLASS } from "@/lib/ui";

type AcademicFiltersBarProps = {
  filters: AcademicFilterState;
  onChange: <K extends keyof AcademicFilterState>(key: K, value: AcademicFilterState[K]) => void;
  onReset: () => void;
  grados: { id: string; label: string }[];
  secciones: SeccionOption[];
  courses?: { id: string; nombre: string }[];
  teachers?: { id: string; label: string }[];
  show?: {
    grado?: boolean;
    seccion?: boolean;
    course?: boolean;
    profesor?: boolean;
    bimestre?: boolean;
    estado?: boolean;
    search?: boolean;
    fecha?: boolean;
    semana?: boolean;
    risk?: boolean;
    alertStatus?: boolean;
  };
};

export function AcademicFiltersBar({
  filters,
  onChange,
  onReset,
  grados,
  secciones,
  courses = [],
  teachers = [],
  show = {},
}: AcademicFiltersBarProps) {
  const s = {
    grado: true,
    seccion: true,
    course: true,
    profesor: false,
    bimestre: false,
    estado: false,
    search: true,
    fecha: false,
    semana: false,
    risk: false,
    alertStatus: false,
    ...show,
  };

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Filter className="h-4 w-4 text-[var(--brand-orange)]" />
          Filtros académicos
        </div>
        <button type="button" onClick={onReset} className="btn-ghost text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {s.grado ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Grado</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.gradoId}
              onChange={(e) => onChange("gradoId", e.target.value)}
            >
              <option value="">Todos</option>
              {grados.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {s.seccion ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Sección / Salón</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.seccionId}
              onChange={(e) => onChange("seccionId", e.target.value)}
              disabled={!filters.gradoId && secciones.length > 12}
            >
              <option value="">Todos</option>
              {secciones.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {s.course ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Curso</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.courseId}
              onChange={(e) => onChange("courseId", e.target.value)}
            >
              <option value="">Todos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {s.profesor ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Profesor</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.profesorId}
              onChange={(e) => onChange("profesorId", e.target.value)}
            >
              <option value="">Todos</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {s.bimestre ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Bimestre</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.bimestre}
              onChange={(e) => onChange("bimestre", e.target.value)}
            >
              <option value="">Todos</option>
              {BIMESTRES.map((b) => (
                <option key={b} value={String(b)}>
                  Bimestre {b}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {s.estado ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Estado estudiante</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.estado}
              onChange={(e) => onChange("estado", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="en riesgo">En riesgo</option>
              <option value="retirado">Retirado</option>
            </select>
          </label>
        ) : null}
        {s.fecha ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Fecha</span>
            <input
              type="date"
              className={`${INPUT_CLASS} w-full`}
              value={filters.fecha}
              onChange={(e) => onChange("fecha", e.target.value)}
            />
          </label>
        ) : null}
        {s.risk ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Nivel de riesgo</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.riskLevel}
              onChange={(e) => onChange("riskLevel", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </label>
        ) : null}
        {s.alertStatus ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            <span className="mb-1 block">Estado alerta</span>
            <select
              className={`${INPUT_CLASS} w-full`}
              value={filters.alertStatus}
              onChange={(e) => onChange("alertStatus", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="nueva">Nueva</option>
              <option value="en_seguimiento">En seguimiento</option>
              <option value="resuelta">Resuelta</option>
            </select>
          </label>
        ) : null}
        {s.search ? (
          <label className="block text-xs font-medium text-[var(--text-secondary)] sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block">Buscar estudiante</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className={`${INPUT_CLASS} w-full pl-9`}
                placeholder="Nombre, apellido o código"
                value={filters.search}
                onChange={(e) => onChange("search", e.target.value)}
              />
            </div>
          </label>
        ) : null}
      </div>
      {!filters.gradoId && !filters.seccionId ? (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Seleccione un grado y sección para ver datos por salón (22 secciones · ~660 estudiantes).
        </p>
      ) : null}
    </div>
  );
}
