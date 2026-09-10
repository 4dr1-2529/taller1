"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AcademicTooltip, ChartEmptyState } from "@/components/ui/ChartCard";

type RiskTrendPoint = { periodo: string; riesgoGlobal: number; count?: number };
type SectionRow = { label: string; alto: number; medio: number; bajo: number; total: number };
type ModelRow = { modelo: string; f1: number; accuracy: number };
type FeatureRow = { variable: string; peso: number };

type GradoRiskRow = { grado: string; alto: number; medio: number; bajo: number };
type AttendanceGradoRow = { grado: string; asistencia: number };
type LmsGradoRow = { grado: string; alta: number; media: number; baja: number; sin: number };
type SalonAlertRow = { salon: string; count: number };

type Props = {
  riskTrend: RiskTrendPoint[];
  riskBySection: SectionRow[];
  riskByGrado?: GradoRiskRow[];
  attendanceByGrado?: AttendanceGradoRow[];
  lmsActivityByGrado?: LmsGradoRow[];
  alertsBySalonShort?: SalonAlertRow[];
  modelComparison: ModelRow[];
  featureImportance: FeatureRow[];
  alertsByLevel?: Record<string, number>;
};

const BRAND_ORANGE = "#F47C20";
const BRAND_NAVY = "#1F3A5F";

export function BentoAnalyticsPanels({
  riskTrend,
  riskBySection,
  riskByGrado = [],
  attendanceByGrado = [],
  lmsActivityByGrado = [],
  alertsBySalonShort = [],
  modelComparison,
  featureImportance,
  alertsByLevel,
}: Props) {
  const alertChart = alertsByLevel
    ? Object.entries(alertsByLevel).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const sectionChart = riskBySection.slice(0, 6).map((r) => ({
    name: r.label.length > 18 ? `${r.label.slice(0, 16)}…` : r.label,
    Alto: r.alto,
    Medio: r.medio,
    Bajo: r.bajo,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Evolución del riesgo (BD)</h3>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">Seguimiento temporal disponible.</p>
        {riskTrend.length < 1 ? (
          <ChartEmptyState message="Registre más períodos para visualizar una tendencia." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Line type="monotone" dataKey="riesgoGlobal" stroke="#38bdf8" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Riesgo por sección</h3>
        {sectionChart.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar dataKey="Alto" stackId="a" fill="#f43f5e" />
              <Bar dataKey="Medio" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Bajo" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Riesgo por grado</h3>
        {riskByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="grado" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar dataKey="alto" name="Alto" stackId="g" fill="#f43f5e" />
              <Bar dataKey="medio" name="Medio" stackId="g" fill={BRAND_ORANGE} />
              <Bar dataKey="bajo" name="Bajo" stackId="g" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Asistencia por grado (%)</h3>
        {attendanceByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="grado" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar dataKey="asistencia" fill={BRAND_NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Actividad LMS por grado</h3>
        {lmsActivityByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={lmsActivityByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="grado" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar dataKey="alta" stackId="l" fill="#10b981" />
              <Bar dataKey="media" stackId="l" fill={BRAND_ORANGE} />
              <Bar dataKey="baja" stackId="l" fill="#f59e0b" />
              <Bar dataKey="sin" stackId="l" fill="#64748b" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {alertsBySalonShort.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
          <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Alertas por sección</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertsBySalonShort}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="salon" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar dataKey="count" fill={BRAND_ORANGE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Comparación de modelos (F1)</h3>
        {modelComparison.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para comparar modelos." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modelComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="modelo" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar dataKey="f1" fill={BRAND_ORANGE} name="F1 %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Importancia de variables</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={featureImportance} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis type="category" dataKey="variable" width={120} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <Tooltip content={<AcademicTooltip />} />
            <Bar dataKey="peso" radius={[0, 4, 4, 0]}>
              {featureImportance.map((_, i) => (
                <Cell key={i} fill={`hsl(${220 + i * 12}, 70%, 55%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {alertChart.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:col-span-2">
          <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Alertas tempranas abiertas</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={alertChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar dataKey="value" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
