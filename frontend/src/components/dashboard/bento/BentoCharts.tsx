"use client";
import { AcademicTooltip, ChartEmptyState } from "@/components/ui/ChartCard";
import { ChartCategoryTick } from "@/components/ui/ChartCategoryTick";

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
import { TrendingUp, Target, TriangleAlert, CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CourseRiskRow } from "@/lib/aggregates";
import type { RiskHistoryPoint } from "@/types/academic";

const gridStroke = "var(--border-subtle)";
const tickFill = "var(--text-muted)";

/** Nivel de riesgo → icono: la leyenda no depende solo del color. */
const LEVEL_ICON: Record<string, LucideIcon> = {
  Alto: TriangleAlert,
  Medio: CircleAlert,
  Bajo: CircleCheck,
};

type BentoRiskTrendProps = {
  data: RiskHistoryPoint[];
  highRisk: number;
};

export function BentoRiskTrend({ data, highRisk }: BentoRiskTrendProps) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
            <TrendingUp className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Tendencia de riesgo</h3>
            <p className="text-xs text-[var(--text-secondary)]">Serie temporal disponible del cohorte</p>
          </div>
        </div>
        <span className="badge badge-danger text-[11px]">{highRisk} alto</span>
      </header>
      <div className="mt-4 h-80 min-w-0">
        {data.length === 0 ? <ChartEmptyState message="Sin serie temporal disponible." /> : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 12, left: -15 }}>
            <defs>
              <linearGradient id="bentoRiskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
            <Tooltip content={<AcademicTooltip />} />
            <Area isAnimationActive={false}
              type="monotone"
              dataKey="riesgoGlobal"
              stroke="var(--chart-primary)"
              strokeWidth={2}
              fill="url(#bentoRiskFill)"
              name="Riesgo"
            />
          </AreaChart>
        </ResponsiveContainer>)}
      </div>
    </div>
  );
}

type BentoDistributionProps = {
  data: { name: string; value: number; fill: string }[];
};

export function BentoDistribution({ data }: BentoDistributionProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const summary = data.map((d) => `${d.name}: ${d.value}`).join(", ") || "Sin datos";
  return (
    <div className="risk-distribution">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
          <Target className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Distribución</h3>
          <p className="text-xs text-[var(--text-secondary)]">Niveles de riesgo del cohorte</p>
        </div>
      </header>
      <div className="risk-distribution__body"><div className="risk-distribution__chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize={12}>Riesgo</text>
              <Pie
                isAnimationActive={false}
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={64}
                outerRadius={88}
                paddingAngle={3}
                strokeWidth={0}
                aria-label={`Distribución de riesgo. ${summary}`}
              >
                {data.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip wrapperClassName="chart-tooltip" formatter={(v: number) => [`${v} estudiantes`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Sin datos</p>
        )}
      </div>
      <ul className="risk-distribution__legend" aria-label="Leyenda de niveles de riesgo">
        {data.map((d) => {
          const Icon = LEVEL_ICON[d.name] ?? CircleHelp;
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.name}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: d.fill }} aria-hidden />
              <span>
                Nivel {d.name}
              </span>
              <strong className="tabular-nums text-[var(--text-primary)]">
                {d.value} <span className="font-normal text-[var(--text-muted)]">({pct}%)</span>
              </strong>
            </li>
          );
        })}
      </ul></div>
    </div>
  );
}

export function BentoCourseBars({ rows }: { rows: CourseRiskRow[] }) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Riesgo por curso</h3>
        <p className="text-xs text-[var(--text-secondary)]">Promedio por matrícula activa</p>
      </header>
      <div className="mt-4 overflow-x-auto table-scroll"><div className="h-80" style={{ minWidth: Math.max(280, rows.length * 96) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 16, right: 16, bottom: 45, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="nombre" height={64} interval={0} tick={<ChartCategoryTick />} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" formatter={(v: number) => [`${typeof v === "number" ? v.toFixed(1) : "Sin datos"}`, "Puntaje"]} />
            <Bar isAnimationActive={false} dataKey="riesgoPromedio" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div></div>
    </div>
  );
}
