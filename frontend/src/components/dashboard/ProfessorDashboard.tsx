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
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { AcademicTooltip, ChartCard } from "@/components/ui/ChartCard";

const RISK_COLORS: Record<string, string> = { Bajo: "var(--risk-low)", Medio: "var(--risk-medium)", Alto: "var(--risk-high)" };


export function ProfessorDashboard() {
  const { ready, isDocente } = useAuthReady();
  const [data, setData] = useState<ProfesorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready || !isDocente) return;
    setLoading(true);
    void profesorService
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, isDocente, reloadKey]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <ErrorState
        message="No se pudo cargar el panel docente. Verifique su sesión."
        technicalDetail="GET /profesor/dashboard"
        onRetry={() => setReloadKey((k) => k + 1)}
        retryLabel="Volver a intentar"
      />
    );
  }

  // Defensa ante respuestas parciales: un campo ausente no debe tumbar la vista.
  const kpis = data.kpis ?? ({} as ProfesorDashboardData["kpis"]);
  const byLevel = kpis.byLevel ?? { bajo: 0, medio: 0, alto: 0 };
  const workload = data.workload;
  const riskBySection = data.riskBySection ?? [];
  const alertsBySalonShort = data.alertsBySalonShort ?? [];
  const avgByCourse = data.avgByCourse ?? [];
  const attendanceByGrado = data.attendanceByGrado ?? [];
  const riskPie = [
    { name: "Bajo", value: byLevel.bajo },
    { name: "Medio", value: byLevel.medio },
    { name: "Alto", value: byLevel.alto },
  ].filter((d) => d.value > 0);

  return (
    <div className="professor-dashboard space-y-6">
      <PageHeader
        eyebrow="Seguimiento académico"
        title="Mi aula en foco"
        description={
          workload?.tipoAsignacion ?? "Indicadores de sus cursos, secciones y estudiantes asignados."
        }
        extra={
          workload?.cursos?.length ? (
            <p className="teaching-context">
              Cursos: {workload.cursos.map((c) => c.nombre).join(" · ")} — Salones:{" "}
              {workload.secciones?.join(", ")}
            </p>
          ) : null
        }
      />

      <section className="teaching-focus grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Atención por sección" description="Estudiantes por nivel de riesgo en sus secciones. Compare dónde concentrar el acompañamiento." isEmpty={!riskBySection.length}>
          <div className="min-w-0" style={{ height: Math.max(320, riskBySection.slice(0, 8).length * 48) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBySection.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20, top: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" interval={0} width={115} tick={<ChartCategoryTick vertical />} axisLine={false} tickLine={false} />
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
                <Pie isAnimationActive={false} data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={100} paddingAngle={3}>
                  {riskPie.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" />
                <Tooltip content={<AcademicTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </section>
      <section className="teaching-summary"><p className="intelligence-eyebrow">Resumen docente</p><div className="metric-band">
        <KpiCard label="Estudiantes asignados" value={kpis.totalAlumnos ?? kpis.totalStudents ?? "—"} icon={Users} index={0} />
        <KpiCard label="Cursos asignados" value={kpis.totalCourses ?? workload?.cursos?.length ?? "—"} icon={BookOpen} index={1} />
        <KpiCard label="Alertas activas" value={kpis.openAlerts ?? "—"} icon={AlertTriangle} index={2} />
        <KpiCard label="Promedio general" value={kpis.avgGrade ?? "—"} suffix={kpis.avgGrade == null ? undefined : "/20"} icon={GraduationCap} index={3} />

        <KpiCard label="Secciones asignadas" value={kpis.misSecciones ?? 0} icon={Layers} />
        <KpiCard label="Notas pendientes (B1-B2)" value={kpis.notasPendientes ?? 0} icon={GraduationCap} />
        <KpiCard label="Asistencia promedio" value={kpis.avgAttendance ?? "—"} suffix={kpis.avgAttendance == null ? undefined : "%"} icon={TrendingUp} />
      </div></section>

      <SummaryStatsRow
        stats={[
          { label: "Riesgo alto", value: byLevel.alto, tone: "danger" },
          { label: "Riesgo medio", value: byLevel.medio, tone: "warning" },
          { label: "Riesgo bajo", value: byLevel.bajo, tone: "success" },
          { label: "Puntaje promedio IA", value: kpis.avgRisk ?? "—" },
        ]}
      />

      <div className="teaching-analytics grid gap-6 xl:grid-cols-2">
        <ChartCard title="Alertas por sección" description="Casos abiertos que requieren seguimiento." isEmpty={!alertsBySalonShort.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsBySalonShort}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="salon" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<AcademicTooltip />} />
                <Bar isAnimationActive={false} dataKey="count" name="Alertas" fill="var(--brand-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Promedio por curso" description="Rendimiento observado en sus cursos." isEmpty={!avgByCourse.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgByCourse.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="nombre" height={80} tick={<ChartCategoryTick />} />
                <YAxis domain={[0, 20]} />
                <Tooltip content={<AcademicTooltip />} />
                <Bar isAnimationActive={false} dataKey="promedio" name="Promedio" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Asistencia por sección (grado)" description="Promedio de asistencia disponible por grado." className="xl:col-span-2" isEmpty={!attendanceByGrado.length}>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceByGrado}>
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
