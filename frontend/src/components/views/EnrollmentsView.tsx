"use client";

import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { UserPlus, FileUser } from "lucide-react";
import type { Course, Enrollment, Student } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";

export type NewEnrollmentForm = {
  studentId: string;
  courseId: string;
  promedio: string;
  asistenciaPct: string;
};

type EnrollmentsViewProps = {
  enrollments: Enrollment[];
  students: Student[];
  courses: Course[];
  form: NewEnrollmentForm;
  setForm: (v: NewEnrollmentForm | ((p: NewEnrollmentForm) => NewEnrollmentForm)) => void;
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
};

export function EnrollmentsView({
  enrollments,
  students,
  courses,
  form,
  setForm,
  onAdd,
}: EnrollmentsViewProps) {
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
              <FileUser className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Enrollment Management
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Link students to courses and track academic performance
          </p>
        </div>
        <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
          {enrollments.length} enrollments
        </span>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Enrollment Form */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={UserPlus}
            title="Nueva matrícula"
            description="Vincule estudiante y curso; alimenta reportes de desaprobados y comparativas."
          >
            <form className="form-grid" onSubmit={onAdd}>
              <FormField label="Estudiante" className="form-grid-full sm:col-span-2">
                <select
                  className={INPUT_CLASS}
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione estudiante</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombres} {s.apellidos}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Curso" className="form-grid-full sm:col-span-2">
                <select
                  className={INPUT_CLASS}
                  value={form.courseId}
                  onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione curso</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Promedio (0–20)">
                <input
                  className={INPUT_CLASS}
                  placeholder="0–20"
                  value={form.promedio}
                  onChange={(e) => setForm((p) => ({ ...p, promedio: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Asistencia %">
                <input
                  className={INPUT_CLASS}
                  placeholder="0–100"
                  value={form.asistenciaPct}
                  onChange={(e) => setForm((p) => ({ ...p, asistenciaPct: e.target.value }))}
                  required
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Guardar matrícula
              </button>
            </form>
          </PageSection>
        </motion.div>

        {/* Enrollments Table */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title={`Matrículas registradas (${enrollments.length})`}
            description="Vínculos estudiante–curso del periodo actual."
            isEmpty={enrollments.length === 0}
            emptyMessage="Sin matrículas. Registre estudiantes y cursos primero."
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Promedio</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const st = students.find((s) => s.id === e.studentId);
                  const c = courses.find((x) => x.id === e.courseId);
                  return (
                    <tr key={e.id}>
                      <td>{st ? `${st.nombres} ${st.apellidos}` : e.studentId}</td>
                      <td>{c?.nombre ?? e.courseId}</td>
                      <td>{e.promedio.toFixed(1)}</td>
                      <td>{e.asistenciaPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.div>
      </div>
    </div>
  );
}
