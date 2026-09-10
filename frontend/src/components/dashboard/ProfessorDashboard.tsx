"use client";
import { ChartCategoryTick } from "@/components/ui/ChartCategoryTick";

import { DashboardMetricCard as KpiCard } from "@/components/dashboard/DashboardMetricCard";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { profesorService, type ProfesorDashboardData } from "@/services/profesorService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { AcademicTooltip, ChartCard } from "@/components/ui/ChartCard";

const RISK_COLORS: Record<string, string> = { Bajo: "var(--risk-low)", Medio: "var(--risk-medium)", Alto: "var(--risk-high)" };


export function ProfessorDashboard() {
  const { ready, isDocente } = useAuthReady();
  const [data, setData] = useState<ProfesorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !isDocente) return;
    setLoading(true);
    void profesorService
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, isDocente]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No se pudo cargar el panel del profesor. Verifique su sesión.
      </p>
    );
  }

  const { kpis } = data;
  const workload = data.workload;
  const riskPie = [
    { name: "Bajo", value: kpis.byLevel.bajo },
    { name: "Medio", value: kpis.byLevel.medio },
    { name: "Alto", value: kpis.byLevel.alto },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Seguimiento académico</p>
        <h2 className="text-page-title font-bold text-[var(--text-primary)]">Mi panel docente</h2>
        <p className="mt-2 max-w-2xl text-[15px] text-[var(--text-secondary)]">
          {workload?.tipoAsignacion ?? "Indicadores de sus cursos, secciones y estudiantes asignados."}
        </p>
        {workload?.cursos.length ? (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Cursos: {workload.cursos.map((c) => c.nombre).join(" · ")} — Salones: {workload.secciones.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="dashboard-metrics">
        <KpiCard label="Estudiantes asignados" value={kpis.totalAlumnos ?? kpis.totalStudents} icon={Users} index={0} />
        <KpiCard label="Cursos asignados" value={kpis.totalCourses ?? workload?.cursos.length ?? 0} icon={BookOpen} index={1} />
        <KpiCard label="Alertas activas" value={kpis.openAlerts} icon={AlertTriangle} index={2} />
        <KpiCard label="Promedio general" value={kpis.avgGrade} suffix="/20" icon={GraduationCap} index={3} />
      </div>
      <div className="dashboard-secondary grid gap-4 md:grid-cols-3">
        <KpiCard label="Secciones asignadas" value={kpis.misSecciones ?? 0} icon={Layers} />
        <KpiCard label="Notas pendientes (B1-B2)" value={kpis.notasPendientes ?? 0} icon={GraduationCap} />
        <KpiCard label="Asistencia promedio" value={kpis.avgAttendance} suffix="%" icon={TrendingUp} />
      </div>

      <SummaryStatsRow
        stats={[
          { label: "Riesgo alto", value: kpis.byLevel.alto, tone: "danger" },
          { label: "Riesgo medio", value: kpis.byLevel.medio, tone: "warning" },
          { label: "Riesgo bajo", value: kpis.byLevel.bajo, tone: "success" },
          { label: "Score promedio IA", value: kpis.avgRisk },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Riesgo por sección" description="Distribución de estudiantes por nivel de riesgo." isEmpty={!data.riskBySection.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.riskBySection.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" height={80} tick={<ChartCategoryTick />} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<AcademicTooltip />} />
                <Legend />
                <Bar isAnimationActive={false} dataKey="alto" name="Alto" fill="var(--risk-high)" stackId="a" />
                <Bar isAnimationActive={false} dataKey="medio" name="Medio" fill="var(--risk-medium)" stackId="a" />
                <Bar isAnimationActive={false} dataKey="bajo" name="Bajo" fill="var(--risk-low)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Distribución de riesgo" description="Niveles presentes entre sus estudiantes." isEmpty={!riskPie.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {riskPie.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<AcademicTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Alertas por sección" description="Casos abiertos que requieren seguimiento." isEmpty={!data.alertsBySalonShort.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.alertsBySalonShort}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="salon" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<AcademicTooltip />} />
                <Bar isAnimationActive={false} dataKey="count" name="Alertas" fill="#f47c20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Promedio por curso" description="Rendimiento observado en sus cursos." isEmpty={!data.avgByCourse.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.avgByCourse.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="nombre" height={80} tick={<ChartCategoryTick />} />
                <YAxis domain={[0, 20]} />
                <Tooltip content={<AcademicTooltip />} />
                <Bar isAnimationActive={false} dataKey="promedio" name="Promedio" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Asistencia por sección (grado)" description="Promedio de asistencia disponible por grado." className="xl:col-span-2" isEmpty={!data.attendanceByGrado.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceByGrado}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="grado" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<AcademicTooltip />} />
                <Bar isAnimationActive={false} dataKey="asistencia" name="Asistencia %" fill="var(--chart-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
