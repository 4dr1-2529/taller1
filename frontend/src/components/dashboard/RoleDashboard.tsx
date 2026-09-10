"use client";

import { DashboardMetricCard as KpiCard } from "@/components/dashboard/DashboardMetricCard";

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
    if (!useApi || role !== "admin") return;
    void api.getDashboardKpis().then((r) => setKpis(r.kpis as typeof kpis)).catch(() => setKpis(null));
  }, [useApi, role, students.length]);

  if (role === "admin") {    const totalStudents = kpis?.totalStudents ?? students.length;
    const directorName =
      kpis?.directorName ??
      (user ? `${user.nombres ?? ""} ${user.apellidos ?? ""}`.trim() : "Director institucional");

    return (
      <div className="space-y-8">
        <InstitutionOverview
          institutionName={kpis?.institutionName ?? "I.E.P. Blenkir"}
          directorName={directorName || "Director institucional"}
          directorEmail={kpis?.directorEmail ?? user?.email}
          totalStudents={totalStudents}
          totalTeachers={kpis?.totalTeachers ?? 0}
        />
        <div className="dashboard-metrics">
          <KpiCard label="Total estudiantes" value={totalStudents} icon={Users} index={0} />
          <KpiCard label="Total profesores" value={kpis?.totalTeachers ?? "—"} icon={GraduationCap} index={1} />
          <KpiCard label="Total salones" value={kpis?.totalSalones ?? "—"} icon={BookOpen} index={2} />
          <KpiCard label="Alertas activas" value={kpis?.openAlerts ?? 0} icon={AlertTriangle} index={3} />
        </div>
        <div className="dashboard-secondary">
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
