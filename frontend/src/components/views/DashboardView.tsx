"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  Globe2,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StaggerItem, StaggerList } from "@/components/ui/PageTransition";
import { StatCard } from "@/components/StatCard";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
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
import { api } from "@/services/api";

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

  const totalStudents = students.length;
  const lowRisk = withPred.filter((s) => s.prediction.level === "bajo").length;
  const mediumRisk = withPred.filter((s) => s.prediction.level === "medio").length;
  const healthScore = totalStudents > 0 ? Math.round((lowRisk / totalStudents) * 100) : 0;

  const gridStroke = "rgba(255, 255, 255, 0.04)";
  const tickFill = "var(--text-muted)";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="space-y-8">
      {/* ── Section Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
              Centro de analítica
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Inteligencia de riesgo, LMS y tendencias del I.E.P. Huancayo en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-info flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo
          </span>
          <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
            {totalStudents} estudiantes
          </span>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
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
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <StatCard
              title="Alerta temprana"
              value={alerts}
              subtitle="Estudiantes con riesgo medio o alto"
              icon={AlertTriangle}
              variant={alerts >= 3 ? "danger" : alerts >= 1 ? "warning" : "success"}
            />
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <StatCard
              title="Asistencia promedio"
              value={`${avgAtt}%`}
              subtitle="Indicador institucional"
              icon={TrendingUp}
              variant="cyan"
            />
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <StatCard
              title="Participación LMS"
              value={`${avgLms}%`}
              subtitle="Promedio de actividad semanal reportada"
              icon={Activity}
              variant="purple"
            />
          </motion.div>
        </StaggerItem>
      </StaggerList>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskHeatmap students={students} />
        </div>
        <ActivityFeed students={students} />
      </div>

      {/* ── Middle Row: Line Chart + Donut ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Line Chart - Risk Evolution */}
        <motion.article
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card p-5 md:p-6 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Evolución del riesgo global
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Trayectoria del score agregado por periodo de evaluación
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-danger">
                {highRisk} en riesgo alto
              </span>
            </div>
          </div>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskHistory}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}`}
                />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="riesgoGlobal"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#riskGradient)"
                  dot={{ r: 3, fill: "#6366f1", strokeWidth: 2, stroke: "#09090b" }}
                  activeDot={{ r: 5, fill: "#818cf8", strokeWidth: 2, stroke: "#09090b" }}
                  name="Riesgo global"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        {/* Donut Chart - Risk Distribution */}
        <motion.article
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card p-5 md:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
              <Target className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Distribución de riesgo
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Niveles del ensemble en el cohorte actual
              </p>
            </div>
          </div>

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
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperClassName="chart-tooltip"
                    formatter={(value: number) => [`${value} students`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <Brain className="h-6 w-6 opacity-40" />
                <span>No prediction data available</span>
              </div>
            )}
          </div>

          {/* Legend */}
          {riskDistribution.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-4">
              {riskDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {d.name} ({d.value})
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.article>
      </div>

      {/* ── Bottom Row: Bar Chart + Horizontal Ranking ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Bar Chart - Course Comparison */}
        <motion.article
          custom={6}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-white/10">
                <BookOpen className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Riesgo por curso
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Promedio de score por curso matriculado
                </p>
              </div>
            </div>
            <span className="badge bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              {courseRows.length} cursos
            </span>
          </div>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseRows}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 10, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  formatter={(value: number) => [`${value.toFixed(1)}`, "Risk Score"]}
                />
                <Bar
                  dataKey="riesgoPromedio"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  name="Riesgo"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        {/* Horizontal Bar - Student Ranking */}
        <motion.article
          custom={7}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 ring-1 ring-white/10">
                <Users className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Ranking de estudiantes en riesgo
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ordenados por score del ensemble (mayor primero)
                </p>
              </div>
            </div>
            <BarChart3 className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          </div>

          <div className="mt-5 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankingChart}
                layout="vertical"
                margin={{ left: 16, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={90}
                  tick={{ fontSize: 11, fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  formatter={(value: number) => [`${value}`, "Score"]}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Score">
                  {rankingChart.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.nombre}-${index}`}
                      fill={
                        entry.score >= 66
                          ? "#f43f5e"
                          : entry.score >= 41
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </div>

      {/* ── Analytics Summary ── */}
      <motion.article
        custom={8}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="premium-card p-5 md:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Resumen ejecutivo y recomendaciones
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Insights de IA para intervención proactiva
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <Zap className="h-3 w-3" />
            {healthScore}% saludable
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total estudiantes", value: totalStudents, icon: Users, color: "text-violet-400" },
            { label: "Riesgo bajo", value: lowRisk, icon: Shield, color: "text-emerald-400" },
            { label: "Riesgo medio", value: mediumRisk, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Riesgo alto", value: highRisk, icon: Target, color: "text-rose-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/5"
            >
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Recommendation Bullets */}
        <ul className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span>
              Prioritize follow-up for students with{" "}
              <strong className="text-[var(--text-primary)]">low attendance</strong> and{" "}
              <strong className="text-[var(--text-primary)]">LMS activity</strong> below 50%.
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
              <Brain className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span>
              The <strong className="text-[var(--text-primary)]">prediction module</strong> explains
              factor-level contributions to support thesis defense and model traceability.
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <span>
              The{" "}
              <code className="rounded-md bg-[var(--accent-muted)] px-1.5 py-0.5 text-xs">
                machine-learning
              </code>{" "}
              service integrates{" "}
              <strong className="text-[var(--text-primary)]">Random Forest / XGBoost / stacking</strong>{" "}
              in Python via the Express API.
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </li>
        </ul>
      </motion.article>
    </div>
  );
}
