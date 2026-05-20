"use client";

import { AlertTriangle, BookOpen, GraduationCap, Users } from "lucide-react";
import type { UserRole, Student, Course, Enrollment } from "@/types/academic";
import { earlyAlertCount } from "@/lib/aggregates";

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
      <header className="glass-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          I.E.P. Huancayo · Perú
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{copy.title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <article
            key={c.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tone} p-5 text-white shadow-lg`}
          >
            <c.icon className="absolute right-3 top-3 h-8 w-8 opacity-30" />
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </article>
        ))}
      </div>

      {students.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600">
          Sin datos aún. Registre estudiantes y matrículas para activar predicciones de deserción.
        </p>
      ) : null}
    </div>
  );
}
