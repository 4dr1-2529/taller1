"use client";
import { ChartCategoryTick } from "@/components/ui/ChartCategoryTick";

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
import { AcademicTooltip, ChartEmptyState, ChartCard } from "@/components/ui/ChartCard";

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
    name: r.label,
    Alto: r.alto,
    Medio: r.medio,
    Bajo: r.bajo,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Evolución del riesgo (BD)">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">Seguimiento temporal disponible.</p>
        {riskTrend.length < 1 ? (
          <ChartEmptyState message="Registre más períodos para visualizar una tendencia." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="periodo" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Line isAnimationActive={false} type="monotone" dataKey="riesgoGlobal" stroke="var(--chart-secondary)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Riesgo por sección">
        {sectionChart.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sectionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" height={80} tick={<ChartCategoryTick />} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar isAnimationActive={false} dataKey="Alto" stackId="a" fill="var(--risk-high)" />
              <Bar isAnimationActive={false} dataKey="Medio" stackId="a" fill="var(--risk-medium)" />
              <Bar isAnimationActive={false} dataKey="Bajo" stackId="a" fill="var(--risk-low)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Riesgo por grado">
        {riskByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={riskByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="grado" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar isAnimationActive={false} dataKey="alto" name="Alto" stackId="g" fill="var(--risk-high)" />
              <Bar isAnimationActive={false} dataKey="medio" name="Medio" stackId="g" fill={BRAND_ORANGE} />
              <Bar isAnimationActive={false} dataKey="bajo" name="Bajo" stackId="g" fill="var(--risk-low)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Asistencia por grado (%)">
        {attendanceByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={attendanceByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="grado" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar isAnimationActive={false} dataKey="asistencia" fill={BRAND_NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Actividad LMS por grado">
        {lmsActivityByGrado.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para este período." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={lmsActivityByGrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="grado" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
              <Bar isAnimationActive={false} dataKey="alta" stackId="l" fill="var(--risk-low)" />
              <Bar isAnimationActive={false} dataKey="media" stackId="l" fill={BRAND_ORANGE} />
              <Bar isAnimationActive={false} dataKey="baja" stackId="l" fill="var(--risk-medium)" />
              <Bar isAnimationActive={false} dataKey="sin" stackId="l" fill="#64748b" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {alertsBySalonShort.length > 0 && (
        <ChartCard title="Alertas por sección">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={alertsBySalonShort}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="salon" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar isAnimationActive={false} dataKey="count" fill={BRAND_ORANGE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Comparación de modelos (F1)">
        {modelComparison.length < 1 ? (
          <ChartEmptyState message="No hay información suficiente para comparar modelos." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={modelComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="modelo" height={80} tick={<ChartCategoryTick />} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar isAnimationActive={false} dataKey="f1" fill={BRAND_ORANGE} name="F1 %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Importancia de variables">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={featureImportance} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis type="category" dataKey="variable" width={136} tick={<ChartCategoryTick vertical />} />
            <Tooltip content={<AcademicTooltip />} />
            <Bar isAnimationActive={false} dataKey="peso" radius={[0, 4, 4, 0]}>
              {featureImportance.map((_, i) => (
                <Cell key={i} fill={`hsl(${220 + i * 12}, 70%, 55%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {alertChart.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:col-span-2">
          <h3 className="mb-1 text-section-title font-semibold text-[var(--text-primary)]">Alertas tempranas abiertas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alertChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" height={80} tick={<ChartCategoryTick />} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar isAnimationActive={false} dataKey="value" fill="var(--risk-high)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
