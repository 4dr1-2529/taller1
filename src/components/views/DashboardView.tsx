"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Globe2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import {
  RISK_HISTORY_MOCK,
  attachPredictions,
  averageAttendance,
  averageLmsParticipation,
  earlyAlertCount,
  globalRiskScore,
  rankingAtRisk,
  riskByCourse,
  riskTrendLabel,
} from "@/lib/aggregates";
import type { Course, Enrollment, Student } from "@/types/academic";

type DashboardViewProps = {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  useApi?: boolean;
};

export function DashboardView({ students, courses, enrollments, useApi = false }: DashboardViewProps) {
  const [apiKpis, setApiKpis] = useState<{
    avgRisk?: number;
    openAlerts?: number;
    byLevel?: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (!useApi) return;
    void api.getDashboardKpis().then((r) => {
      const k = r.kpis as {
        avgRisk?: number;
        openAlerts?: number;
        byLevel?: Record<string, number>;
      };
      setApiKpis(k);
    }).catch(() => setApiKpis(null));
  }, [useApi, students.length]);

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
  const trend = useMemo(() => riskTrendLabel(RISK_HISTORY_MOCK), []);

  const courseRows = useMemo(
    () => riskByCourse(students, courses, enrollments),
    [students, courses, enrollments],
  );

  const topAtRisk = useMemo(() => rankingAtRisk(students, 6), [students]);

  const rankingChart = useMemo(
    () =>
      topAtRisk.map((s) => ({
        nombre: `${s.nombres} ${s.apellidos}`.split(" ")[0] ?? s.nombres,
        score: s.prediction.score,
      })),
    [topAtRisk],
  );

  const globalVariant =
    globalRisk >= 66 ? "danger" : globalRisk >= 41 ? "warning" : "success";

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const highRisk = withPred.filter((s) => s.prediction.level === "alto").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Riesgo global del sistema"
          value={`${globalRisk}`}
          subtitle="Promedio del score de riesgo (0–100)"
          icon={Globe2}
          variant={globalVariant}
          trend={{
            direction: trend.direction === "up" ? "up" : trend.direction === "down" ? "down" : "flat",
            label: `${trend.label} (${trend.delta >= 0 ? "+" : ""}${trend.delta} pts histórico)`,
          }}
        />
        <StatCard
          title="Alerta temprana"
          value={alerts}
          subtitle="Estudiantes con riesgo medio o alto"
          icon={AlertTriangle}
          variant={alerts >= 3 ? "danger" : alerts >= 1 ? "warning" : "success"}
        />
        <StatCard
          title="Asistencia promedio"
          value={`${avgAtt}%`}
          subtitle="Indicador institucional"
          icon={TrendingUp}
        />
        <StatCard
          title="Participación LMS"
          value={`${avgLms}%`}
          subtitle="Promedio de actividad semanal reportada"
          icon={Activity}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Evolución del riesgo global
              </h3>
              <p className="text-sm text-slate-600">
                Serie histórica simulada (listo para conectar a data warehouse / ETL).
              </p>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline">
              {highRisk} en riesgo alto hoy
            </span>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RISK_HISTORY_MOCK}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="riesgoGlobal"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Riesgo global"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Comparación entre cursos</h3>
          <p className="text-sm text-slate-600">Riesgo promedio por cohorte matriculada.</p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="riesgoPromedio" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Riesgo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Ranking de estudiantes en riesgo</h3>
              <p className="text-sm text-slate-600">Ordenados por score ensemble (mayor primero).</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" aria-hidden />
          </div>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingChart} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nombre" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Score">
                  {rankingChart.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.nombre}-${index}`}
                      fill={
                        entry.score >= 66 ? "#f43f5e" : entry.score >= 41 ? "#f59e0b" : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Resumen ejecutivo</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="flex gap-2">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>
                Priorizar seguimiento a estudiantes con <strong>baja asistencia</strong> y{" "}
                <strong>actividad LMS</strong> por debajo del 50%.
              </span>
            </li>
            <li className="flex gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
              <span>
                El módulo de <strong>predicción</strong> explica contribuciones por factor para apoyar la
                defensa de tesis y la trazabilidad del modelo.
              </span>
            </li>
            <li className="flex gap-2">
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
              <span>
                La ruta <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">ml-service</code> permite
                sustituir este núcleo simulado por <strong>Random Forest / XGBoost / stacking</strong> en
                Python.
              </span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
