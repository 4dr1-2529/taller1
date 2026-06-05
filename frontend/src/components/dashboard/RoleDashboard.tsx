"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, GraduationCap, Users } from "lucide-react";
import { BentoDashboard } from "@/components/dashboard/bento/BentoDashboard";
import { ProfessorDashboard } from "@/components/dashboard/ProfessorDashboard";
import { InstitutionOverview } from "@/components/dashboard/InstitutionOverview";
import { globalRiskScore } from "@/lib/aggregates";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { MatriculaStats } from "@/hooks/useAcademicData";
import type { Course, Student } from "@/types/academic";
type Props = {
  role: string;
  students: Student[];
  courses: Course[];
  matriculaStats?: MatriculaStats | null;
  useApi?: boolean;
};

function KpiCard({ label, value, suffix = "", icon: Icon }: { label: string; value: string | number; suffix?: string; icon: typeof Users }) {
  return (
    <div className="premium-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--brand-orange)]" />
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
        {value}
        {suffix}
      </p>
    </div>
  );
}

export function RoleDashboard({ role, students, courses, matriculaStats = null, useApi = false }: Props) {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<{
    totalStudents?: number;
    totalTeachers?: number;
    totalSalones?: number;
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

  if (role === "admin") {    const totalStudents = kpis?.totalStudents ?? students.length;
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Total estudiantes" value={totalStudents} icon={Users} />
          <KpiCard label="Total profesores" value={kpis?.totalTeachers ?? "—"} icon={GraduationCap} />
          <KpiCard label="Total salones" value={kpis?.totalSalones ?? "—"} icon={BookOpen} />
          <KpiCard label="Alertas activas" value={kpis?.openAlerts ?? 0} icon={AlertTriangle} />
          <KpiCard label="Promedio institucional" value={kpis?.avgGrade ?? globalRiskScore(students)} suffix="/20" icon={BookOpen} />
        </div>
        <BentoDashboard role={role} students={students} courses={courses} matriculaStats={matriculaStats} useApi={useApi} />
      </div>
    );
  }

  if (role === "docente") {
    return <ProfessorDashboard />;
  }

  return (
    <BentoDashboard role={role} students={students} courses={courses} matriculaStats={matriculaStats} useApi={useApi} />
  );
}
