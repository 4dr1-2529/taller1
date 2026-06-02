"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, GraduationCap, Users } from "lucide-react";
import {
  attachPredictions,
  averageAttendance,
  earlyAlertCount,
  globalRiskScore,
  rankingAtRisk,
  riskByCourse,
  riskTrendLabel,
} from "@/lib/aggregates";
import { dashboardGreeting, buildRiskHistorySeries } from "@/lib/dashboard-data";
import { BentoAnalyticsPanels } from "./BentoAnalyticsPanels";
import type { Course, Enrollment, Student } from "@/types/academic";
import { api } from "@/services/api";
import { BentoCell } from "./BentoCell";
import { BentoHero } from "./BentoHero";
import { BentoAlertsPanel } from "./BentoAlertsPanel";
import { BentoKpiStrip, type KpiItem } from "./BentoKpiStrip";
import { BentoRiskTrend, BentoDistribution, BentoCourseBars } from "./BentoCharts";
import { BentoAtRiskList } from "./BentoAtRiskList";

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
    byLevel?: { bajo: number; medio: number; alto: number };
    alertsByLevel?: Record<string, number>;
  } | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<{
    riskTrend: { periodo: string; riesgoGlobal: number }[];
    riskBySection: { label: string; alto: number; medio: number; bajo: number; total: number }[];
    modelComparison: { modelo: string; f1: number; accuracy: number }[];
    featureImportance: { variable: string; peso: number }[];
  } | null>(null);

  useEffect(() => {
    if (!useApi) return;
    void api
      .getDashboardKpis()
      .then((r) => {
        const k = r.kpis as {
          avgRisk?: number;
          openAlerts?: number;
          byLevel?: { bajo: number; medio: number; alto: number };
          alertsByLevel?: Record<string, number>;
        };
        setApiKpis(k);
        setApiAnalytics({
          riskTrend: (r.riskTrend as { periodo: string; riesgoGlobal: number }[]) ?? [],
          riskBySection:
            (r.riskBySection as { label: string; alto: number; medio: number; bajo: number; total: number }[]) ??
            [],
          modelComparison:
            (r.modelComparison as { modelo: string; f1: number; accuracy: number }[]) ?? [],
          featureImportance:
            (r.featureImportance as { variable: string; peso: number }[]) ?? [],
        });
      })
      .catch(() => {
        setApiKpis(null);
        setApiAnalytics(null);
      });
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
  const riskHistory = useMemo(() => {
    if (useApi && apiAnalytics?.riskTrend?.length) {
      return apiAnalytics.riskTrend.map((p) => ({
        periodo: p.periodo,
        riesgoGlobal: p.riesgoGlobal,
      }));
    }
    return buildRiskHistorySeries(students);
  }, [students, useApi, apiAnalytics]);
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

  const highRisk =
    useApi && apiKpis?.byLevel ? apiKpis.byLevel.alto : withPred.filter((s) => s.prediction.level === "alto").length;
  const lowRisk =
    useApi && apiKpis?.byLevel ? apiKpis.byLevel.bajo : withPred.filter((s) => s.prediction.level === "bajo").length;
  const healthScore = students.length > 0 ? Math.round((lowRisk / students.length) * 100) : 0;

  const riskDistribution = useMemo(() => {
    if (useApi && apiKpis?.byLevel) {
      const { alto, medio, bajo } = apiKpis.byLevel;
      return [
        { name: "Alto", value: alto, fill: "#f43f5e" },
        { name: "Medio", value: medio, fill: "#f59e0b" },
        { name: "Bajo", value: bajo, fill: "#10b981" },
      ].filter((d) => d.value > 0);
    }
    const medio = withPred.filter((s) => s.prediction.level === "medio").length;
    return [
      { name: "Alto", value: highRisk, fill: "#f43f5e" },
      { name: "Medio", value: medio, fill: "#f59e0b" },
      { name: "Bajo", value: lowRisk, fill: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [withPred, highRisk, lowRisk, useApi, apiKpis]);

  const kpis: KpiItem[] = [
    { label: "Estudiantes", value: students.length, icon: Users },
    { label: "Cursos", value: courses.length, icon: BookOpen },
    { label: "Matrículas", value: enrollments.length, icon: GraduationCap },
    { label: "Asistencia prom.", value: avgAtt, suffix: "%", icon: Activity },
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

      {useApi && apiAnalytics && (
        <BentoCell col={12} row={2} delay={0.18}>
          <BentoAnalyticsPanels
            riskTrend={apiAnalytics.riskTrend}
            riskBySection={apiAnalytics.riskBySection}
            modelComparison={apiAnalytics.modelComparison}
            featureImportance={apiAnalytics.featureImportance}
            alertsByLevel={apiKpis?.alertsByLevel}
          />
        </BentoCell>
      )}
    </div>
  );
}
