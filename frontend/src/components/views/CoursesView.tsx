"use client";

import { type FormEvent, useMemo, useState } from "react";
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
  seccionId: string;
};

export const defaultCourseForm: NewCourseForm = {
  codigo: "",
  nombre: "",
  profesorId: "",
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const teacher = teachers.find((t) => t.id === c.profesorId);
      const teacherName = teacher ? `${teacher.nombres} ${teacher.apellidos}` : "";
      return `${c.nombre} ${c.codigo} ${c.nivel} ${teacherName}`.toLowerCase().includes(q);
    });
  }, [courses, teachers, query]);

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
              Course Catalog
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage academic courses and teacher assignments
          </p>
        </div>
        <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
          {filtered.length} courses
        </span>
      </motion.div>

      {canEdit ? (
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={Plus}
            title="Nuevo curso"
            description="Asigne nombre, código y docente responsable. Puede vincular una sección (grado · salón)."
          >
            <form className="form-grid" onSubmit={onSubmit}>
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
              <FormField label="Sección (opcional)">
                <select
                  className={INPUT_CLASS}
                  value={form.seccionId}
                  onChange={(e) => setForm((p) => ({ ...p, seccionId: e.target.value }))}
                >
                  <option value="">Sin sección específica</option>
                  {secciones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>
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
                <th>Área / nivel</th>
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
