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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StaggerItem, StaggerList } from "@/components/ui/PageTransition";
import { StatCard } from "@/components/StatCard";
import {
  attachPredictions,
  averageAttendance,
  averageLmsParticipation,
  buildRiskHistory,
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
  const riskHistory = useMemo(() => buildRiskHistory(students), [students]);
  const trend = useMemo(() => riskTrendLabel(riskHistory), [riskHistory]);

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

  const riskDistribution = useMemo(() => {
    const medio = withPred.filter((s) => s.prediction.level === "medio").length;
    const bajo = withPred.filter((s) => s.prediction.level === "bajo").length;
    return [
      { name: "Alto", value: highRisk, fill: "#f43f5e" },
      { name: "Medio", value: medio, fill: "#f59e0b" },
      { name: "Bajo", value: bajo, fill: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [withPred, highRisk]);

  const gridStroke = "var(--border-subtle)";
  const tickFill = "var(--text-muted)";

  return (
    <div className="space-y-6">
      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            title="Riesgo global del sistema"
            value={globalRisk}
            subtitle="Promedio del score de riesgo (0–100)"
            icon={Globe2}
            variant={globalVariant}
            trend={{
              direction: trend.direction === "up" ? "up" : trend.direction === "down" ? "down" : "flat",
              label: trend.label,
            }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Alerta temprana"
            value={alerts}
            subtitle="Estudiantes con riesgo medio o alto"
            icon={AlertTriangle}
            variant={alerts >= 3 ? "danger" : alerts >= 1 ? "warning" : "success"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Asistencia promedio"
            value={`${avgAtt}%`}
            subtitle="Indicador institucional"
            icon={TrendingUp}
            variant="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Participación LMS"
            value={`${avgLms}%`}
            subtitle="Promedio de actividad semanal reportada"
            icon={Activity}
            variant="purple"
          />
        </StaggerItem>
      </StaggerList>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="premium-card p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Evolución del riesgo global
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Riesgo global del periodo actual (con más snapshots se mostrará tendencia).
              </p>
            </div>
            <span className="badge-info hidden sm:inline">{highRisk} en riesgo alto hoy</span>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: tickFill }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip wrapperClassName="chart-tooltip" />
                <Line
                  type="monotone"
                  dataKey="riesgoGlobal"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1" }}
                  name="Riesgo global"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Distribución de riesgo</h3>
          <p className="text-sm text-[var(--text-secondary)]">Niveles del ensemble por cohorte actual.</p>
          <div className="mt-4 h-72 w-full">
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip wrapperClassName="chart-tooltip" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                Sin datos de predicción
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="premium-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Comparación entre cursos</h3>
          <p className="text-sm text-[var(--text-secondary)]">Riesgo promedio por cohorte matriculada.</p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: tickFill }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip wrapperClassName="chart-tooltip" />
                <Bar dataKey="riesgoPromedio" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Riesgo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Ranking de estudiantes en riesgo</h3>
              <p className="text-sm text-[var(--text-secondary)]">Ordenados por score ensemble (mayor primero).</p>
            </div>
            <BarChart3 className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
          </div>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingChart} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: tickFill }} />
                <YAxis type="category" dataKey="nombre" width={80} tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip wrapperClassName="chart-tooltip" />
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
      </section>

      <section>
        <article className="premium-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Resumen ejecutivo</h3>
          <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
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
                El servicio{" "}
                <code className="rounded-md bg-[var(--accent-muted)] px-1.5 py-0.5 text-xs">machine-learning</code>{" "}
                integra <strong>Random Forest / XGBoost / stacking</strong> en Python vía la API Express.
              </span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
