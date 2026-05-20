"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, GraduationCap, Users } from "lucide-react";
import {
  attachPredictions,
  averageAttendance,
  averageLmsParticipation,
  earlyAlertCount,
  globalRiskScore,
  rankingAtRisk,
  riskByCourse,
  riskTrendLabel,
} from "@/lib/aggregates";
import {
  buildActivityStream,
  buildAiInsights,
  dashboardGreeting,
  buildRiskHistorySeries,
  buildTimelineEvents,
} from "@/lib/dashboard-data";
import type { Course, Enrollment, Student } from "@/types/academic";
import { api } from "@/services/api";
import { BentoCell } from "./BentoCell";
import { BentoHero } from "./BentoHero";
import { BentoAlertsPanel } from "./BentoAlertsPanel";
import { BentoKpiStrip, type KpiItem } from "./BentoKpiStrip";
import { BentoRiskTrend, BentoDistribution, BentoCourseBars } from "./BentoCharts";
import { BentoAtRiskList } from "./BentoAtRiskList";
import { BentoTimeline } from "./BentoTimeline";
import { BentoActivity } from "./BentoActivity";
import { BentoAiInsights } from "./BentoAiInsights";

type BentoDashboardProps = {
  role: string;
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  useApi?: boolean;
};

export function BentoDashboard({
  role,
  students,
  courses,
  enrollments,
  useApi = false,
}: BentoDashboardProps) {
  const [apiKpis, setApiKpis] = useState<{
    avgRisk?: number;
    openAlerts?: number;
  } | null>(null);

  useEffect(() => {
    if (!useApi) return;
    void api.getDashboardKpis().then((r) => {
      const k = r.kpis as { avgRisk?: number; openAlerts?: number };
      setApiKpis(k);
    }).catch(() => setApiKpis(null));
  }, [useApi, students.length]);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const globalRisk = useMemo(
    () => (apiKpis?.avgRisk != null && useApi ? apiKpis.avgRisk : globalRiskScore(students)),
    [students, apiKpis, useApi],
  );
  const alerts = useMemo(
    () => (apiKpis?.openAlerts != null && useApi ? apiKpis.openAlerts : earlyAlertCount(students)),
    [students, apiKpis, useApi],
  );
  const avgAtt = useMemo(() => averageAttendance(students), [students]);
  const avgLms = useMemo(() => averageLmsParticipation(students), [students]);
  const riskHistory = useMemo(() => buildRiskHistorySeries(students), [students]);
  const trend = useMemo(() => riskTrendLabel(riskHistory), [riskHistory]);
  const courseRows = useMemo(
    () => riskByCourse(students, courses, enrollments),
    [students, courses, enrollments],
  );
  const topAtRisk = useMemo(() => rankingAtRisk(students, 5), [students]);
  const alertQueue = useMemo(
    () =>
      [...withPred]
        .filter((s) => s.prediction.level !== "bajo")
        .sort((a, b) => b.prediction.score - a.prediction.score)
        .slice(0, 6),
    [withPred],
  );

  const highRisk = withPred.filter((s) => s.prediction.level === "alto").length;
  const lowRisk = withPred.filter((s) => s.prediction.level === "bajo").length;
  const healthScore = students.length > 0 ? Math.round((lowRisk / students.length) * 100) : 0;

  const riskDistribution = useMemo(() => {
    const medio = withPred.filter((s) => s.prediction.level === "medio").length;
    return [
      { name: "Alto", value: highRisk, fill: "#f43f5e" },
      { name: "Medio", value: medio, fill: "#f59e0b" },
      { name: "Bajo", value: lowRisk, fill: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [withPred, highRisk, lowRisk]);

  const timeline = useMemo(() => buildTimelineEvents(students), [students]);
  const activity = useMemo(() => buildActivityStream(students), [students]);
  const insights = useMemo(() => buildAiInsights(students), [students]);

  const kpis: KpiItem[] = [
    { label: "Estudiantes", value: students.length, icon: Users, hint: "Cohorte activo" },
    { label: "Cursos", value: courses.length, icon: BookOpen },
    { label: "Matrículas", value: enrollments.length, icon: GraduationCap },
    {
      label: "Asistencia",
      value: avgAtt,
      suffix: "%",
      icon: Activity,
      hint: "Promedio institucional",
    },
    {
      label: "LMS",
      value: avgLms,
      suffix: "%",
      icon: Activity,
      hint: "Participación semanal",
    },
  ];

  return (
    <div className="bento-grid">
      <BentoCell col={8} row={2} delay={0} variant="hero" className="lg:row-span-2">
        <BentoHero
          greeting={dashboardGreeting(role)}
          globalRisk={globalRisk}
          alerts={alerts}
          healthScore={healthScore}
          trend={trend}
          topStudent={topAtRisk[0]}
        />
      </BentoCell>

      <BentoCell col={4} row={2} delay={0.05} className="lg:row-span-2">
        <BentoAlertsPanel items={alertQueue} />
      </BentoCell>

      <BentoCell col={12} row={1} delay={0.08}>
        <BentoKpiStrip items={kpis} />
      </BentoCell>

      <BentoCell col={8} row={2} delay={0.1}>
        <BentoRiskTrend data={riskHistory} highRisk={highRisk} />
      </BentoCell>

      <BentoCell col={4} row={2} delay={0.12}>
        <BentoDistribution data={riskDistribution} />
      </BentoCell>

      <BentoCell col={6} row={2} delay={0.14}>
        <BentoCourseBars rows={courseRows} />
      </BentoCell>

      <BentoCell col={6} row={2} delay={0.16}>
        <BentoAtRiskList students={topAtRisk} />
      </BentoCell>

      <BentoCell col={4} row={2} delay={0.18}>
        <BentoTimeline events={timeline} />
      </BentoCell>

      <BentoCell col={4} row={2} delay={0.2}>
        <BentoActivity items={activity} />
      </BentoCell>

      <BentoCell col={4} row={2} delay={0.22}>
        <BentoAiInsights insights={insights} />
      </BentoCell>
    </div>
  );
}
