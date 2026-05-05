"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Clock3, MonitorSmartphone, Send } from "lucide-react";
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

function engagementBadge(eng: string) {
  return clsx(
    "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
    eng === "alto" && "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    eng === "medio" && "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    eng === "bajo" && "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
  );
}

type LMSViewProps = {
  students: Student[];
};

export function LMSView({ students }: LMSViewProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");

  const student = useMemo(
    () => students.find((s) => s.id === studentId) ?? students[0],
    [students, studentId],
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

  if (!student) {
    return <p className="text-sm text-slate-600">No hay estudiantes para analizar LMS.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Comportamiento en LMS</h3>
          <p className="text-sm text-slate-600">
            Actividad semanal, tiempo en plataforma y cumplimiento de tareas.
          </p>
        </div>
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:w-72"
          value={student.id}
          onChange={(e) => setStudentId(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombres} {s.apellidos}
            </option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <MonitorSmartphone className="h-5 w-5 text-indigo-600" aria-hidden />
            <h4 className="font-semibold">Nivel de engagement</h4>
          </div>
          <p className="mt-3">
            <span className={engagementBadge(student.metrics.lms.engagement)}>
              {student.metrics.lms.engagement}
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Derivado de la combinación de actividad semanal, minutos conectados y entregas.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Clock3 className="h-5 w-5 text-sky-600" aria-hidden />
            <h4 className="font-semibold">Tiempo en plataforma</h4>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {student.metrics.lms.horasPlataformaSemana.toFixed(1)} h
          </p>
          <p className="text-sm text-slate-600">Promedio semanal registrado (simulado).</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Send className="h-5 w-5 text-amber-600" aria-hidden />
            <h4 className="font-semibold">Tareas</h4>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {student.metrics.lms.tareasEntregadas}/{student.metrics.lms.tareasTotales}
          </p>
          <p className="text-sm text-slate-600">Entregadas vs total programadas.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h4 className="font-semibold text-slate-900">Actividad y minutos por semana</h4>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="actividad"
                  name="Actividad %"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="minutos"
                  name="Minutos"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h4 className="font-semibold text-slate-900">Entregas vs pendientes</h4>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tareasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="tipo" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="valor" name="Cantidad" radius={[6, 6, 0, 0]}>
                  {tareasData.map((row) => (
                    <Cell key={row.tipo} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
