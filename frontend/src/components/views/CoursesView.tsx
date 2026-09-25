"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Library } from "lucide-react";
import type { Course, Teacher } from "@/types/academic";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SELECT_CLASS } from "@/lib/ui";

type CoursesViewProps = {
  courses: Course[];
  teachers: Teacher[];
  onReassignProfesor?: (courseId: string, profesorId: string) => void;
  onDeactivate?: (courseId: string, nombre: string) => void;
  canReassign?: boolean;
};

export function CoursesView({
  courses,
  teachers,
  onReassignProfesor,
  onDeactivate,
  canReassign = false,
}: CoursesViewProps) {
  const [query, setQuery] = useState("");
  const [reassignTarget, setReassignTarget] = useState<Course | null>(null);
  const [reassignTeacherId, setReassignTeacherId] = useState("");

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] ring-1 ring-white/10">
              <Library className="h-4 w-4 text-[var(--risk-medium)]" />
            </div>
            <SectionHeading title="Catálogo de cursos" />
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {canReassign
              ? "Consulte, reasigne o desactive la oferta creada desde Asignaciones docentes"
              : "Cursos asignados a usted por grado y sección"}
          </p>
        </div>
        <span className="badge badge-info">
          {filtered.length} {filtered.length === 1 ? "curso" : "cursos"}
        </span>
      </motion.div>

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
                {canReassign && onDeactivate ? <th>Acciones</th> : null}
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
                        <span>
                          {teacher ? (
                            <span>
                              {teacher.nombres} {teacher.apellidos}
                              <span className="block text-xs text-[var(--text-muted)]">
                                {teacher.especialidad}
                              </span>
                            </span>
                          ) : (
                            <span className="badge-warning">Sin asignar</span>
                          )}
                          <button
                            type="button"
                            className="btn-ghost mt-1.5"
                            onClick={() => { setReassignTarget(course); setReassignTeacherId(course.profesorId); }}
                          >
                            Reasignar
                          </button>
                        </span>
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
                    {canReassign && onDeactivate ? (
                      <td>
                        <button
                          type="button"
                          className="btn-ghost text-xs text-[var(--danger)]"
                          onClick={() => onDeactivate(course.id, course.nombre)}
                        >
                          Desactivar
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      </motion.div>
      <ConfirmDialog
        open={reassignTarget !== null}
        title="Reasignar docente"
        description={reassignTarget ? `El curso ${reassignTarget.codigo} pasará a otro docente. Se conservan estudiantes inscritos y notas registradas.` : ""}
        confirmLabel="Confirmar reasignación"
        onClose={() => setReassignTarget(null)}
        onConfirm={() => {
          if (reassignTarget && reassignTeacherId && onReassignProfesor) {
            onReassignProfesor(reassignTarget.id, reassignTeacherId);
          }
          setReassignTarget(null);
        }}
      >
        <FormField label="Docente destino">
          <select
            className={SELECT_CLASS}
            value={reassignTeacherId}
            onChange={(e) => setReassignTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombres} {t.apellidos}
              </option>
            ))}
          </select>
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
