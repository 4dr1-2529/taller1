"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { attachPredictions } from "@/lib/aggregates";
import { Users, BookOpen, TrendingUp, Activity, ClipboardList, GraduationCap } from "lucide-react";
import type { Course, Enrollment, Student } from "@/types/academic";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";

type AcademicViewProps = {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
};

export function AcademicView({ students, courses, enrollments }: AcademicViewProps) {
  const withPred = attachPredictions(students);

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
              <GraduationCap className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Academic Overview
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Student performance metrics and enrollment data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
            {students.length} students
          </span>
          <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
            {courses.length} courses
          </span>
        </div>
      </motion.div>

      {/* Student Cards */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2"
      >
        {withPred.map((s) => (
          <article
            key={s.id}
            className="premium-card rounded-2xl p-5 md:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
                  <Users className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">
                    {s.nombres} {s.apellidos}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">{s.nivel}</p>
                </div>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  s.prediction.level === "alto" && "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20",
                  s.prediction.level === "medio" && "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
                  s.prediction.level === "bajo" && "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
                )}
              >
                Riesgo {s.prediction.level}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 text-violet-400" />
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Promedio general</dt>
                  <dd className="font-semibold text-[var(--text-primary)]">{s.metrics.promedioGeneral.toFixed(1)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <Activity className="mt-0.5 h-3.5 w-3.5 text-cyan-400" />
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Asistencia</dt>
                  <dd className="font-semibold text-[var(--text-primary)]">{s.metrics.asistenciaGeneral}%</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <BookOpen className="mt-0.5 h-3.5 w-3.5 text-amber-400" />
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Engagement LMS</dt>
                  <dd className="font-semibold capitalize text-[var(--text-primary)]">{s.metrics.lms.engagement}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <ClipboardList className="mt-0.5 h-3.5 w-3.5 text-emerald-400" />
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Tareas</dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {s.metrics.lms.tareasEntregadas}/{s.metrics.lms.tareasTotales}
                  </dd>
                </div>
              </div>
            </dl>
          </article>
        ))}
      </motion.div>

      {/* Enrollment Table */}
      <motion.article
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="premium-card rounded-2xl p-5 md:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-white/10">
            <BookOpen className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notas por curso (matrícula)</h3>
            <p className="text-xs text-[var(--text-secondary)]">Enrollment-level grades and attendance</p>
          </div>
        </div>
        <DataTablePanel
          title="Notas por curso"
          isEmpty={enrollments.length === 0}
          emptyMessage="No hay matrículas registradas."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Promedio</th>
                <th>Asistencia curso</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const st = students.find((s) => s.id === e.studentId);
                const c = courses.find((x) => x.id === e.courseId);
                return (
                  <tr key={e.id}>
                    <td>
                      {st ? `${st.nombres} ${st.apellidos}` : e.studentId}
                    </td>
                    <td>{c?.nombre}</td>
                    <td>{e.promedio.toFixed(1)}</td>
                    <td>{e.asistenciaPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      </motion.article>
    </div>
  );
}
