"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarCheck, GraduationCap, Percent } from "lucide-react";
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
import type { MatriculaStats } from "@/hooks/useAcademicData";
import type { Course, Student } from "@/types/academic";
import { api } from "@/services/api";
import { BentoCell } from "./BentoCell";
import { BentoHero } from "./BentoHero";
import { BentoAlertsPanel } from "./BentoAlertsPanel";
import { BentoKpiStrip, type KpiItem } from "./BentoKpiStrip";
import { BentoRiskTrend, BentoDistribution, BentoCourseBars } from "./BentoCharts";
import { BentoAtRiskList } from "./BentoAtRiskList";
import { BentoMlStatus } from "./BentoMlStatus";

type BentoDashboardProps = {
  role: string;
  students: Student[];
  courses: Course[];
  matriculaStats?: MatriculaStats | null;
  useApi?: boolean;
};

export function BentoDashboard({
  role,
  students,
  courses,
  matriculaStats = null,
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
    riskByGrado: { grado: string; alto: number; medio: number; bajo: number }[];
    attendanceByGrado: { grado: string; asistencia: number }[];
    lmsActivityByGrado: { grado: string; alta: number; media: number; baja: number; sin: number }[];
    alertsBySalonShort: { salon: string; count: number }[];
    modelComparison: { modelo: string; f1: number; accuracy: number }[];
    featureImportance: { variable: string; peso: number }[];
  } | null>(null);
  const [apiMl, setApiMl] = useState<Awaited<ReturnType<typeof api.getDashboardKpis>>["ml"] | null>(null);

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
        setApiMl(r.ml ?? null);
        setApiAnalytics({
          riskTrend: (r.riskTrend as { periodo: string; riesgoGlobal: number }[]) ?? [],
          riskBySection:
            (r.riskBySection as { label: string; alto: number; medio: number; bajo: number; total: number }[]) ??
            [],
          riskByGrado: (r.riskByGrado as { grado: string; alto: number; medio: number; bajo: number }[]) ?? [],
          attendanceByGrado: (r.attendanceByGrado as { grado: string; asistencia: number }[]) ?? [],
          lmsActivityByGrado:
            (r.lmsActivityByGrado as {
              grado: string;
              alta: number;
              media: number;
              baja: number;
              sin: number;
            }[]) ?? [],
          alertsBySalonShort: (r.alertsBySalonShort as { salon: string; count: number }[]) ?? [],
          modelComparison:
            (r.modelComparison as { modelo: string; f1: number; accuracy: number }[]) ?? [],
          featureImportance:
            (r.featureImportance as { variable: string; peso: number }[]) ?? [],
        });
      })
      .catch(() => {
        setApiKpis(null);
        setApiAnalytics(null);
        setApiMl(null);
      });
  }, [useApi, students.length]);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const hasPredictions = withPred.length > 0;
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
    return buildRiskHistorySeries();
  }, [useApi, apiAnalytics]);
  const trend = useMemo(() => riskTrendLabel(riskHistory), [riskHistory]);
  const courseRows = useMemo(() => riskByCourse(students, courses), [students, courses]);
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
  const healthScore = students.length > 0 && hasPredictions ? Math.round((lowRisk / students.length) * 100) : null;

  const riskDistribution = useMemo(() => {
    if (useApi && apiKpis?.byLevel) {
      const { alto, medio, bajo } = apiKpis.byLevel;
      return [
        { name: "Alto", value: alto, fill: "var(--risk-high)" },
        { name: "Medio", value: medio, fill: "var(--risk-medium)" },
        { name: "Bajo", value: bajo, fill: "var(--risk-low)" },
      ].filter((d) => d.value > 0);
    }
    if (!hasPredictions) return [];
    const medio = withPred.filter((s) => s.prediction.level === "medio").length;
    return [
      { name: "Alto", value: highRisk, fill: "var(--risk-high)" },
      { name: "Medio", value: medio, fill: "var(--risk-medium)" },
      { name: "Bajo", value: lowRisk, fill: "var(--risk-low)" },
    ].filter((d) => d.value > 0);
  }, [withPred, hasPredictions, highRisk, lowRisk, useApi, apiKpis]);

  /** Probabilidad media: API primero; si no, promedio local de predicciones guardadas. */
  const avgProbability = useMemo(() => {
    if (useApi && apiMl?.avgProbability != null) return apiMl.avgProbability;
    if (!withPred.length) return null;
    const sum = withPred.reduce((acc, s) => acc + (s.prediction.probability ?? 0), 0);
    return sum / withPred.length;
  }, [useApi, apiMl, withPred]);

  // `.institution-pulse` es de 4 columnas: se mantienen exactamente 4 KPIs y
  // fuera los que ya aparecen en la banda institucional superior.
  const kpis: KpiItem[] = [
    {
      label: "Evaluados por el modelo",
      value: apiMl?.evaluated ?? "—",
      hint:
        apiMl?.evaluatedTotal != null
          ? `de ${apiMl.evaluatedTotal} estudiantes`
          : "Sin evaluación predictiva",
      icon: Activity,
    },
    {
      label: "Probabilidad media",
      value: avgProbability != null ? `${(avgProbability * 100).toFixed(1)}%` : "—",
      hint: "Deserción estimada en el cohorte",
      icon: Percent,
    },
    {
      label: "Matrículas activas",
      // Nunca se sustituye por `students.length`: son métricas distintas.
      value: matriculaStats?.matriculasActivas ?? "—",
      icon: GraduationCap,
    },
    {
      label: "Asistencia prom.",
      value: avgAtt ?? "—",
      suffix: avgAtt == null ? undefined : "%",
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="bento-grid">
      <BentoCell col={8} row={2} delay={0} variant="hero" className="command-risk-cell"><div className="command-risk-layout">
        <BentoHero
          greeting={dashboardGreeting(role)}
          globalRisk={globalRisk}
          alerts={alerts}
          healthScore={healthScore}
          trend={trend}
          topStudent={topAtRisk[0]}
          experimental={apiMl?.experimental ?? false}
          datasetVersion={apiMl?.datasetVersion ?? null}
          evaluated={apiMl?.evaluated}
          evaluatedTotal={apiMl?.evaluatedTotal}
          avgProbability={apiMl?.avgProbability ?? null}
        />
        <BentoDistribution data={riskDistribution} />
      </div></BentoCell>

      <BentoCell col={4} row={2} delay={0.05}>
        <BentoAlertsPanel items={alertQueue} />
      </BentoCell>

      <BentoCell col={8} row={1} delay={0.08}>
        <BentoKpiStrip items={kpis} />
      </BentoCell>

      <BentoCell col={4} row={1} delay={0.1}>
        <BentoMlStatus ml={apiMl} showHint />
      </BentoCell>

      <BentoCell col={12} row={2} delay={0.1} className="analytics-lead">
        <BentoRiskTrend data={riskHistory} highRisk={highRisk} />
      </BentoCell>

      <BentoCell col={6} row={2} delay={0.14}>
        <BentoCourseBars rows={courseRows} />
      </BentoCell>

      <BentoCell col={6} row={2} delay={0.16}>
        <BentoAtRiskList students={topAtRisk} />
      </BentoCell>

      {useApi && apiAnalytics && (
        <BentoCell col={12} row={2} delay={0.18} className="analytics-canvas">
          <header className="analytics-heading"><p className="intelligence-eyebrow">Explorar las señales</p><h2>Analítica institucional</h2><p>Secciones, asistencia, actividad y modelos en perspectiva.</p></header>
          <BentoAnalyticsPanels
            riskTrend={apiAnalytics.riskTrend}
            riskBySection={apiAnalytics.riskBySection}
            riskByGrado={apiAnalytics.riskByGrado}
            attendanceByGrado={apiAnalytics.attendanceByGrado}
            lmsActivityByGrado={apiAnalytics.lmsActivityByGrado}
            alertsBySalonShort={apiAnalytics.alertsBySalonShort}
            modelComparison={apiAnalytics.modelComparison}
            featureImportance={apiAnalytics.featureImportance}
            alertsByLevel={apiKpis?.alertsByLevel}
          />
        </BentoCell>
      )}
    </div>
  );
}
