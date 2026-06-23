"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { api, type TeacherAssignment } from "@/services/api";
import type { Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS, SELECT_CLASS } from "@/lib/ui";
import { CardSkeleton } from "@/components/ui/Skeleton";

type Props = {
  teachers: Teacher[];
  secciones: SeccionOption[];
};

type CatalogoCurso = { id: string; codigo: string; nombre: string };

export function TeacherAssignmentsView({ teachers, secciones }: Props) {
  const [items, setItems] = useState<TeacherAssignment[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    profesorId: "",
    cursoId: "",
    gradoId: "",
    seccionId: "",
    esTutor: "",
  });
  const [form, setForm] = useState({
    mode: "curso" as "curso" | "tutor",
    profesorId: "",
    cursoId: "",
    seccionId: "",
  });

  const grados = useMemo(() => {
    const m = new Map<number, { id: string; label: string }>();
    for (const s of secciones) {
      if (!m.has(s.gradoId)) m.set(s.gradoId, { id: String(s.gradoId), label: s.gradoLabel });
    }
    return [...m.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [secciones]);

  const seccionesFiltradas = useMemo(() => {
    if (!filters.gradoId) return secciones;
    return secciones.filter((s) => String(s.gradoId) === filters.gradoId);
  }, [secciones, filters.gradoId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { activo: "true" };
      if (filters.profesorId) params.profesorId = filters.profesorId;
      if (filters.cursoId) params.cursoId = filters.cursoId;
      if (filters.gradoId) params.gradoId = filters.gradoId;
      if (filters.seccionId) params.seccionId = filters.seccionId;
      if (filters.esTutor) params.esTutor = filters.esTutor;
      const res = await api.getTeacherAssignments(params);
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void api.getCursosCatalogo().then((r) => setCatalogo(r.items)).catch(() => setCatalogo([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.profesorId || !form.seccionId) {
      toast.error("Seleccione profesor y sección");
      return;
    }
    try {
      if (form.mode === "tutor") {
        const r = await api.createTutorAssignment({
          profesorId: form.profesorId,
          seccionId: form.seccionId,
        });
        toast.success(`Tutor asignado — ${r.totalCursos} cursos del aula`);
      } else {
        if (!form.cursoId) {
          toast.error("Seleccione curso del catálogo");
          return;
        }
        await api.createTeacherAssignment({
          profesorId: form.profesorId,
          cursoId: form.cursoId,
          seccionId: form.seccionId,
        });
        toast.success("Asignación docente creada");
      }
      setForm({ mode: form.mode, profesorId: "", cursoId: "", seccionId: "" });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  async function deactivate(id: string) {
    try {
      await api.deactivateTeacherAssignment(id);
      toast.success("Asignación desactivada");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-[var(--brand-orange)]" />
        <div>
          <h2 className="text-xl font-bold">Asignaciones docentes</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            1°-2°: tutor de aula (todos los cursos) · 3°-6°: docente por curso en varios salones
          </p>
        </div>
      </div>

      <form className="premium-card grid gap-3 rounded-xl p-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleCreate}>
        <div className="lg:col-span-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={form.mode === "tutor" ? "btn-primary text-xs" : "btn-ghost text-xs"}
            onClick={() => setForm((p) => ({ ...p, mode: "tutor" }))}
          >
            <UserCheck className="h-3.5 w-3.5" /> Tutor de aula (1°-2°)
          </button>
          <button
            type="button"
            className={form.mode === "curso" ? "btn-primary text-xs" : "btn-ghost text-xs"}
            onClick={() => setForm((p) => ({ ...p, mode: "curso" }))}
          >
            <Plus className="h-3.5 w-3.5" /> Docente por curso (3°-6°)
          </button>
        </div>
        <select
          className={SELECT_CLASS}
          value={form.profesorId}
          onChange={(e) => setForm((p) => ({ ...p, profesorId: e.target.value }))}
          required
        >
          <option value="">Profesor</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.apellidos}, {t.nombres}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={form.seccionId}
          onChange={(e) => setForm((p) => ({ ...p, seccionId: e.target.value }))}
          required
        >
          <option value="">Sección</option>
          {secciones.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {form.mode === "curso" ? (
          <select
            className={SELECT_CLASS}
            value={form.cursoId}
            onChange={(e) => setForm((p) => ({ ...p, cursoId: e.target.value }))}
            required
          >
            <option value="">Curso (catálogo)</option>
            {catalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-[var(--text-muted)] self-center">
            Se asignarán todos los cursos del grado en esa sección.
          </p>
        )}
        <button type="submit" className="btn-primary">
          Crear asignación
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          className={SELECT_CLASS}
          value={filters.profesorId}
          onChange={(e) => setFilters((p) => ({ ...p, profesorId: e.target.value }))}
        >
          <option value="">Todos los profesores</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.apellidos}, {t.nombres}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={filters.gradoId}
          onChange={(e) => setFilters((p) => ({ ...p, gradoId: e.target.value, seccionId: "" }))}
        >
          <option value="">Todos los grados</option>
          {grados.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={filters.seccionId}
          onChange={(e) => setFilters((p) => ({ ...p, seccionId: e.target.value }))}
        >
          <option value="">Todas las secciones</option>
          {seccionesFiltradas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={filters.cursoId}
          onChange={(e) => setFilters((p) => ({ ...p, cursoId: e.target.value }))}
        >
          <option value="">Todos los cursos</option>
          {catalogo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={filters.esTutor}
          onChange={(e) => setFilters((p) => ({ ...p, esTutor: e.target.value }))}
        >
          <option value="">Tipo: todos</option>
          <option value="true">Tutor de aula</option>
          <option value="false">Docente por curso</option>
        </select>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <DataTablePanel title="Asignaciones activas" isEmpty={items.length === 0} emptyMessage="Sin asignaciones">
          <TableWrap>
            <thead>
              <tr>
                <th>Profesor</th>
                <th>Tipo</th>
                <th>Curso</th>
                <th>Salón</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.profesor?.nombre ?? "—"}</td>
                  <td>{a.tipoAsignacion}</td>
                  <td>{a.curso?.nombre ?? "—"}</td>
                  <td>{a.seccion?.label ?? "—"}</td>
                  <td>
                    <button type="button" className="btn-ghost text-xs" onClick={() => void deactivate(a.id)}>
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      )}
    </div>
  );
}
