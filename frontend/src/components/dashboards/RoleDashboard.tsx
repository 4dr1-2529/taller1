"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, GraduationCap, Users } from "lucide-react";
import type { UserRole, Student, Course, Enrollment } from "@/types/academic";
import { earlyAlertCount } from "@/lib/aggregates";
import { StaggerItem, StaggerList } from "@/components/ui/PageTransition";

type RoleDashboardProps = {
  role: UserRole | string;
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  alertCount: number;
};

const ROLE_COPY: Record<string, { title: string; subtitle: string }> = {
  admin: {
    title: "Panel administrativo",
    subtitle: "Gestión integral, IA, auditoría y estadísticas globales del colegio.",
  },
  docente: {
    title: "Panel docente",
    subtitle: "Notas, asistencia y seguimiento de estudiantes asignados.",
  },
  tutor: {
    title: "Panel tutoría",
    subtitle: "Monitoreo del aula, alertas tempranas y conducta LMS.",
  },
  psicologo: {
    title: "Panel psicología",
    subtitle: "Seguimiento emocional, observaciones y recomendaciones.",
  },
  estudiante: {
    title: "Mi progreso",
    subtitle: "Notas, asistencia, alertas y recomendaciones personalizadas.",
  },
  apoderado: {
    title: "Seguimiento familiar",
    subtitle: "Rendimiento, asistencia y alertas de su hijo(a).",
  },
};

export function RoleDashboard({ role, students, courses, enrollments, alertCount }: RoleDashboardProps) {
  const copy = ROLE_COPY[role] ?? ROLE_COPY.estudiante;
  const atRisk = students.filter((s) => s.estado === "en riesgo").length;

  const cards = [
    { label: "Estudiantes", value: students.length, icon: Users, tone: "from-indigo-500 to-violet-600" },
    { label: "Cursos activos", value: courses.length, icon: BookOpen, tone: "from-cyan-500 to-blue-600" },
    { label: "Matrículas", value: enrollments.length, icon: GraduationCap, tone: "from-emerald-500 to-teal-600" },
    {
      label: "Alertas tempranas",
      value: alertCount || earlyAlertCount(students),
      icon: AlertTriangle,
      tone: "from-amber-500 to-orange-600",
    },
    { label: "En riesgo", value: atRisk, icon: AlertTriangle, tone: "from-rose-500 to-pink-600" },
  ];

  return (
    <div className="space-y-6">
      <motion.header
        className="premium-card p-6 md:p-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          I.E.P. Huancayo · Perú
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">{copy.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{copy.subtitle}</p>
      </motion.header>

      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <motion.article
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tone} p-5 text-white shadow-lg`}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <c.icon className="absolute right-3 top-3 h-10 w-10 opacity-25" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90">{c.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{c.value}</p>
            </motion.article>
          </StaggerItem>
        ))}
      </StaggerList>

      {students.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--accent-muted)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Sin datos aún. Registre estudiantes y matrículas para activar predicciones de deserción.
        </p>
      ) : null}
    </div>
  );
}
