"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Clock3, MonitorSmartphone, Send, BarChart3 } from "lucide-react";
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
import type { Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { lmsActivityTier } from "@/lib/student-filters";
import { SELECT_CLASS } from "@/lib/ui";
import { BLENKIR_COLORS, FILTER_HINTS } from "@/constants/blenkir";
import { useAuth } from "@/contexts/AuthProvider";

const ENGAGEMENT_LABELS: Record<string, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

function engagementBadge(eng: string) {
  return clsx(
    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
    eng === "alto" && "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
    eng === "medio" && "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
    eng === "bajo" && "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20",
  );
}

type LMSViewProps = {
  students: Student[];
  secciones?: SeccionOption[];
};

export function LMSView({ students, secciones = [] }: LMSViewProps) {
  const { isDocente } = useAuth();
  const { filters, updateFilter, resetFilters, grados, seccionOptions, filteredStudents } =
    useAcademicFilters(students, [], secciones);

  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (filteredStudents.length && !filteredStudents.some((s) => s.id === studentId)) {
      setStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, studentId]);

  const lmsSummary = useMemo(() => {
    let alta = 0;
    let media = 0;
    let baja = 0;
    let sin = 0;
    for (const s of filteredStudents) {
      const t = lmsActivityTier(s);
      if (t === "alta") alta++;
      else if (t === "media") media++;
      else if (t === "baja") baja++;
      else sin++;
    }
    return { total: filteredStudents.length, alta, media, baja, sin };
  }, [filteredStudents]);

  const student = useMemo(
    () => filteredStudents.find((s) => s.id === studentId) ?? filteredStudents[0],
    [filteredStudents, studentId],
  );

  const weekly = useMemo(() => {
    if (!student) return [];
    const labels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
    return labels.map((semana, i) => ({
      semana,
      actividad: student.metrics.lms.actividadSemanalPct[i] ?? 0,
      minutos: student.metrics.lms.minutosPorSemana[i] ?? 0,
    }));
  }, [student]);

  const tareasData = useMemo(() => {
    if (!student) return [];
    const ok = student.metrics.lms.tareasEntregadas;
    const bad = Math.max(student.metrics.lms.tareasTotales - ok, 0);
    return [
      { tipo: "Entregadas", valor: ok, fill: "#10b981" },
      { tipo: "Pendientes / no entregadas", valor: bad, fill: "#f43f5e" },
    ];
  }, [student]);

  const gridStroke = "rgba(255, 255, 255, 0.04)";
  const tickFill = "var(--text-muted)";

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  if (!student && filteredStudents.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          {filters.gradoId && filters.seccionId
            ? isDocente
              ? FILTER_HINTS.noStudentsProfesor
              : FILTER_HINTS.noStudents
            : "Seleccione grado y sección para ver actividad LMS del salón."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AcademicFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        grados={grados}
        secciones={seccionOptions}
        show={{ grado: true, seccion: true, search: true }}
      />
      <SummaryStatsRow
        stats={[
          { label: "Total alumnos", value: lmsSummary.total, tone: "brand" },
          { label: "Alta actividad", value: lmsSummary.alta, tone: "success" },
          { label: "Media actividad", value: lmsSummary.media, tone: "warning" },
          { label: "Baja actividad", value: lmsSummary.baja, tone: "danger" },
          { label: "Sin actividad", value: lmsSummary.sin },
        ]}
      />

      {student ? (
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <div className="premium-card flex flex-col gap-3 rounded-2xl p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Comportamiento en LMS</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Actividad semanal, tiempo en plataforma y cumplimiento de tareas.
            </p>
          </div>
          <select
            className={clsx(SELECT_CLASS, "w-full md:w-72")}
            value={student.id}
            onChange={(e) => setStudentId(e.target.value)}
          >
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} — {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
      ) : null}

      {student ? (
      <>
      <section className="grid gap-4 lg:grid-cols-3">
        <motion.article
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1"
              style={{ background: `${BLENKIR_COLORS.navy}33`, borderColor: `${BLENKIR_COLORS.orange}44` }}
            >
              <MonitorSmartphone className="h-4 w-4" style={{ color: BLENKIR_COLORS.orange }} aria-hidden />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Nivel de compromiso</h4>
          </div>
          <p className="mt-3">
            <span className={engagementBadge(student.metrics.lms.engagement)}>
              {ENGAGEMENT_LABELS[student.metrics.lms.engagement] ?? student.metrics.lms.engagement}
            </span>
          </p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Derivado de la combinación de actividad semanal, minutos conectados y entregas.
          </p>
        </motion.article>
        <motion.article
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          className="premium-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-white/10">
              <Clock3 className="h-4 w-4 text-cyan-400" aria-hidden />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Tiempo en plataforma</h4>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
            {student.metrics.lms.horasPlataformaSemana.toFixed(1)} h
          </p>
          <p className="text-sm text-[var(--text-secondary)]">Promedio semanal registrado (simulado).</p>
        </motion.article>
        <motion.article
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="premium-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
              <Send className="h-4 w-4 text-amber-400" aria-hidden />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Tareas</h4>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
            {student.metrics.lms.tareasEntregadas}/{student.metrics.lms.tareasTotales}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">Entregadas vs total programadas.</p>
        </motion.article>
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <motion.article
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="premium-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
              <BarChart3 className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Actividad y minutos por semana</h4>
              <p className="text-xs text-[var(--text-secondary)]">Porcentaje de actividad y minutos por semana</p>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="actividad"
                  name="Actividad %"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#6366f1", strokeWidth: 2, stroke: "#09090b" }}
                  activeDot={{ r: 5, fill: "#818cf8", strokeWidth: 2, stroke: "#09090b" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="minutos"
                  name="Minutos"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#06b6d4", strokeWidth: 2, stroke: "#09090b" }}
                  activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 2, stroke: "#09090b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          className="premium-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
              <Send className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Entregas vs pendientes</h4>
              <p className="text-xs text-[var(--text-secondary)]">Desglose de tareas entregadas y pendientes</p>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tareasData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Bar dataKey="valor" name="Cantidad" radius={[6, 6, 0, 0]}>
                  {tareasData.map((row) => (
                    <Cell key={row.tipo} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </section>
      </>
      ) : null}
    </div>
  );
}
