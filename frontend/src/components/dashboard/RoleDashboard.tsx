"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, GraduationCap, TrendingUp, Users } from "lucide-react";
import { BentoDashboard } from "@/components/dashboard/bento/BentoDashboard";
import { InstitutionOverview } from "@/components/dashboard/InstitutionOverview";
import { attachPredictions, globalRiskScore } from "@/lib/aggregates";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Course, Enrollment, Student } from "@/types/academic";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { RiskBadge } from "@/components/ui/RiskBadge";

type Props = {
  role: string;
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  useApi?: boolean;
};

function KpiCard({ label, value, suffix = "", icon: Icon }: { label: string; value: string | number; suffix?: string; icon: typeof Users }) {
  return (
    <div className="premium-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <Icon className="h-4 w-4 text-violet-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
        {value}
        {suffix}
      </p>
    </div>
  );
}

export function RoleDashboard({ role, students, courses, enrollments, useApi = false }: Props) {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<{
    totalStudents?: number;
    totalTeachers?: number;
    openAlerts?: number;
    avgGrade?: number;
    avgAttendance?: number;
    institutionName?: string;
    directorName?: string | null;
    directorEmail?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!useApi) return;
    void api.getDashboardKpis().then((r) => setKpis(r.kpis as typeof kpis)).catch(() => setKpis(null));
  }, [useApi, students.length]);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const self = students[0];
  const selfPred = withPred[0]?.prediction;

  if (role === "admin") {
    const totalStudents = kpis?.totalStudents ?? students.length;
    const directorName =
      kpis?.directorName ??
      (user ? `${user.nombres ?? ""} ${user.apellidos ?? ""}`.trim() : "Director institucional");

    return (
      <div className="space-y-6">
        <InstitutionOverview
          institutionName={kpis?.institutionName ?? "I.E.P. Blenkir"}
          directorName={directorName || "Director institucional"}
          directorEmail={kpis?.directorEmail ?? user?.email}
          totalStudents={totalStudents}
          totalTeachers={kpis?.totalTeachers ?? 0}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total estudiantes" value={totalStudents} icon={Users} />
          <KpiCard label="Total profesores" value={kpis?.totalTeachers ?? "—"} icon={GraduationCap} />
          <KpiCard label="Alertas activas" value={kpis?.openAlerts ?? 0} icon={AlertTriangle} />
          <KpiCard label="Promedio institucional" value={kpis?.avgGrade ?? globalRiskScore(students)} suffix="/20" icon={BookOpen} />
        </div>
        <BentoDashboard role={role} students={students} courses={courses} enrollments={enrollments} useApi={useApi} />
      </div>
    );
  }

  if (role === "docente") {
    const avgNotes =
      students.length > 0
        ? Math.round((students.reduce((a, s) => a + s.metrics.promedioGeneral, 0) / students.length) * 10) / 10
        : 0;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Mis estudiantes" value={students.length} icon={Users} />
          <KpiCard label="Mis cursos" value={courses.length} icon={BookOpen} />
          <KpiCard label="Alertas activas" value={kpis?.openAlerts ?? 0} icon={AlertTriangle} />
          <KpiCard label="Promedio de notas" value={kpis?.avgGrade ?? avgNotes} suffix="/20" icon={TrendingUp} />
        </div>
        <BentoDashboard role={role} students={students} courses={courses} enrollments={enrollments} useApi={useApi} />
      </div>
    );
  }

  if (role === "estudiante" && self && selfPred) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="premium-card col-span-1 flex flex-col items-center justify-center rounded-xl p-6">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Mi riesgo actual</p>
            <RiskGauge score={selfPred.score} level={selfPred.level} />
            <div className="mt-3">
              <RiskBadge level={selfPred.level} score={selfPred.score} />
            </div>
          </div>
          <KpiCard label="Promedio" value={self.metrics.promedioGeneral} suffix="/20" icon={BookOpen} />
          <KpiCard label="Asistencia" value={self.metrics.asistenciaGeneral} suffix="%" icon={TrendingUp} />
        </div>
        <div className="premium-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recomendaciones</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {selfPred.factors.slice(0, 3).map((f) => (
              <li key={f.key}>
                <strong className="text-[var(--text-primary)]">{f.label}</strong> — mantenga seguimiento en este indicador.
              </li>
            ))}
            {selfPred.factors.length === 0 && (
              <li>Continúe con su ritmo académico y participación en la plataforma virtual.</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <BentoDashboard role={role} students={students} courses={courses} enrollments={enrollments} useApi={useApi} />
  );
}
