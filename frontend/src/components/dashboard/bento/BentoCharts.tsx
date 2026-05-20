"use client";

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
import { TrendingUp, Target } from "lucide-react";
import type { CourseRiskRow } from "@/lib/aggregates";
import type { RiskHistoryPoint } from "@/types/academic";

const gridStroke = "rgba(255, 255, 255, 0.05)";
const tickFill = "var(--text-muted)";

type BentoRiskTrendProps = {
  data: RiskHistoryPoint[];
  highRisk: number;
};

export function BentoRiskTrend({ data, highRisk }: BentoRiskTrendProps) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
            <TrendingUp className="h-4 w-4 text-violet-400" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Tendencia de riesgo</h3>
            <p className="text-xs text-[var(--text-secondary)]">Últimos 6 meses · cohorte activo</p>
          </div>
        </div>
        <span className="badge badge-danger text-[11px]">{highRisk} alto</span>
      </header>
      <div className="mt-4 min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="bentoRiskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Area
              type="monotone"
              dataKey="riesgoGlobal"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#bentoRiskFill)"
              name="Riesgo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type BentoDistributionProps = {
  data: { name: string; value: number; fill: string }[];
};

export function BentoDistribution({ data }: BentoDistributionProps) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <Target className="h-4 w-4 text-amber-400" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Distribución</h3>
          <p className="text-xs text-[var(--text-secondary)]">Niveles del ensemble</p>
        </div>
      </header>
      <div className="relative mt-2 flex flex-1 items-center justify-center">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
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
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
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
      <div className="mt-4 min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" formatter={(v: number) => [`${v.toFixed(1)}`, "Score"]} />
            <Bar dataKey="riesgoPromedio" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
