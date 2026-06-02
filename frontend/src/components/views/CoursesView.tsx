"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BookOpen, Plus, Library } from "lucide-react";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Course, Teacher } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";

export type NewCourseForm = {
  codigo: string;
  nombre: string;
  profesorId: string;
  gradoId: string;
  seccionId: string;
};

export const defaultCourseForm: NewCourseForm = {
  codigo: "",
  nombre: "",
  profesorId: "",
  gradoId: "",
  seccionId: "",
};

type CoursesViewProps = {
  courses: Course[];
  teachers: Teacher[];
  secciones: SeccionOption[];
  form: NewCourseForm;
  setForm: (v: NewCourseForm | ((p: NewCourseForm) => NewCourseForm)) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onReassignProfesor?: (courseId: string, profesorId: string) => void;
  canEdit?: boolean;
  canReassign?: boolean;
  lockProfesorId?: string;
};

export function CoursesView({
  courses,
  teachers,
  secciones,
  form,
  setForm,
  onSubmit,
  onReassignProfesor,
  canEdit = true,
  canReassign = false,
  lockProfesorId,
}: CoursesViewProps) {
  const [query, setQuery] = useState("");

  const grados = useMemo(() => {
    const seen = new Map<number, string>();
    for (const s of secciones) {
      if (!seen.has(s.gradoId)) seen.set(s.gradoId, s.gradoLabel);
    }
    return [...seen.entries()].map(([id, label]) => ({ id: String(id), label }));
  }, [secciones]);

  const seccionesDelGrado = useMemo(() => {
    const gid = Number(form.gradoId);
    if (!gid) return [];
    return secciones.filter((s) => s.gradoId === gid);
  }, [secciones, form.gradoId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const teacher = teachers.find((t) => t.id === c.profesorId);
      const teacherName = teacher ? `${teacher.nombres} ${teacher.apellidos}` : "";
      return `${c.nombre} ${c.codigo} ${c.nivel} ${teacherName}`.toLowerCase().includes(q);
    });
  }, [courses, teachers, query]);

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.gradoId || !form.seccionId) {
      toast.error("Seleccione grado y sección (salón A, B o C)");
      return;
    }
    onSubmit(e);
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
              <Library className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Catálogo de cursos
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Administre cursos académicos y asignación de docentes
          </p>
        </div>
        <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
          {filtered.length} cursos
        </span>
      </motion.div>

      {canEdit ? (
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={Plus}
            title="Nuevo curso"
            description="Cada curso pertenece a un grado y una sección (A, B o C). No se comparte entre salones del mismo grado."
          >
            <form className="form-grid" onSubmit={handleFormSubmit}>
              <FormField label="Código">
                <input
                  className={INPUT_CLASS}
                  value={form.codigo}
                  onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Nombre del curso">
                <input
                  className={INPUT_CLASS}
                  placeholder="Comunicación 4° A"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Profesor">
                <select
                  className={INPUT_CLASS}
                  value={lockProfesorId ?? form.profesorId}
                  onChange={(e) => setForm((p) => ({ ...p, profesorId: e.target.value }))}
                  required
                  disabled={!!lockProfesorId}
                >
                  <option value="">Seleccione docente</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres} {t.apellidos} — {t.especialidad}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Grado">
                <select
                  className={INPUT_CLASS}
                  value={form.gradoId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gradoId: e.target.value, seccionId: "" }))
                  }
                  required
                >
                  <option value="">Seleccione grado</option>
                  {grados.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sección (salón)">
                <select
                  className={INPUT_CLASS}
                  value={form.seccionId}
                  onChange={(e) => setForm((p) => ({ ...p, seccionId: e.target.value }))}
                  required
                  disabled={!form.gradoId}
                >
                  <option value="">
                    {form.gradoId ? "Seleccione sección" : "Primero elija el grado"}
                  </option>
                  {seccionesDelGrado.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sección {s.nombre}
                    </option>
                  ))}
                </select>
              </FormField>
              <p className="form-grid-full text-xs text-[var(--text-muted)]">
                El código se guardará con sufijo del salón (ej. MAT-4A) para no repetirlo en 4° B o 4° C.
              </p>
              <button type="submit" className="btn-primary form-grid-full">
                <BookOpen className="h-4 w-4" />
                Crear curso
              </button>
            </form>
          </PageSection>
        </motion.div>
      ) : null}

      {/* Courses Table */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <DataTablePanel
          title={`Oferta académica (${filtered.length})`}
          description="Cursos activos y docente asignado."
          searchPlaceholder="Buscar curso o docente…"
          searchValue={query}
          onSearch={setQuery}
          isEmpty={filtered.length === 0}
          emptyMessage="No hay cursos. Registre docentes y cursos primero."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Código</th>
                <th>Curso</th>
                <th>Grado · sección</th>
                <th>Docente</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => {
                const teacher = teachers.find((t) => t.id === course.profesorId);
                return (
                  <tr key={course.id}>
                    <td className="font-medium">{course.codigo}</td>
                    <td>{course.nombre}</td>
                    <td className="text-[var(--text-secondary)]">{course.nivel}</td>
                    <td>
                      {canReassign && onReassignProfesor ? (
                        <select
                          className={INPUT_CLASS}
                          value={course.profesorId}
                          onChange={(e) => onReassignProfesor(course.id, e.target.value)}
                        >
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombres} {t.apellidos}
                            </option>
                          ))}
                        </select>
                      ) : teacher ? (
                        <span>
                          {teacher.nombres} {teacher.apellidos}
                          <span className="block text-xs text-[var(--text-muted)]">
                            {teacher.especialidad}
                          </span>
                        </span>
                      ) : (
                        <span className="badge-warning">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      </motion.div>
    </div>
  );
}
