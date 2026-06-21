"use client";

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

const RISK_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

function KpiCard({
  label,
  value,
  suffix = "",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof Users;
}) {
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
  const riskPie = [
    { name: "Bajo", value: kpis.byLevel.bajo },
    { name: "Medio", value: kpis.byLevel.medio },
    { name: "Alto", value: kpis.byLevel.alto },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Mi panel docente</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Indicadores solo de sus cursos, secciones y estudiantes asignados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Estudiantes asignados" value={kpis.totalStudents} icon={Users} />
        <KpiCard label="Cursos asignados" value={kpis.totalCourses ?? 0} icon={BookOpen} />
        <KpiCard label="Secciones asignadas" value={kpis.misSecciones ?? 0} icon={Layers} />
        <KpiCard label="Alertas activas" value={kpis.openAlerts} icon={AlertTriangle} />
        <KpiCard label="Promedio general" value={kpis.avgGrade} suffix="/20" icon={GraduationCap} />
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

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="premium-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Riesgo por sección</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.riskBySection.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="alto" name="Alto" fill="#f43f5e" stackId="a" />
                <Bar dataKey="medio" name="Medio" fill="#f59e0b" stackId="a" />
                <Bar dataKey="bajo" name="Bajo" fill="#10b981" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Distribución de riesgo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {riskPie.map((_, i) => (
                    <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Alertas por sección</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.alertsBySalonShort}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="salon" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Alertas" fill="#f47c20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Promedio por curso</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.avgByCourse.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="nombre" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Bar dataKey="promedio" name="Promedio" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="premium-card rounded-2xl p-5 xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Asistencia por sección (grado)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceByGrado}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="grado" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="asistencia" name="Asistencia %" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}
