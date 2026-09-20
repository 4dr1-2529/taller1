"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { estudianteService } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { AcademicTooltip, ChartCard } from "@/components/ui/ChartCard";
import { CardSkeleton } from "@/components/ui/Skeleton";

const PIE_COLORS = ["var(--risk-low)", "var(--risk-medium)"];

export function StudentLMSView() {
  const { ready, isEstudiante } = useAuthReady();
  const [data, setData] = useState<Awaited<ReturnType<typeof estudianteService.getLms>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !isEstudiante) return;
    setLoading(true);
    void estudianteService
      .getLms()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, isEstudiante]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinLms}</p>;
  }

  const { tarjetas, semanas, chartSemanal, chartTareas } = data;
  const compromisoLabel =
    tarjetas.compromiso === "alto" ? "Alto" : tarjetas.compromiso === "medio" ? "Medio" : "Bajo";

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)]">{ESTUDIANTE_MSG.lms}</p>

      <SummaryStatsRow
        stats={[
          { label: "Nivel de compromiso", value: compromisoLabel, tone: "brand" },
          { label: "Tiempo en plataforma (h)", value: tarjetas.tiempoPlataforma },
          { label: "Accesos LMS", value: tarjetas.accesosLms },
          { label: "Tareas entregadas", value: `${tarjetas.tareasEntregadas}%`, tone: "success" },
          { label: "Tareas pendientes", value: `${tarjetas.tareasPendientes}%`, tone: "warning" },
          { label: "Participación", value: `${tarjetas.participacion}%` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Actividad por semana" description="Participación registrada a lo largo de las semanas.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartSemanal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Bar isAnimationActive={false} dataKey="actividad" fill="var(--chart-primary)" name="Actividad %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Tiempo en plataforma por semana" description="Minutos dedicados al aprendizaje en la plataforma.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartSemanal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<AcademicTooltip />} />
              <Line isAnimationActive={false} type="monotone" dataKey="minutos" stroke="var(--chart-secondary)" name="Minutos" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Entregas vs pendientes" description="Estado de las tareas registradas.">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie isAnimationActive={false} data={chartTareas} dataKey="valor" nameKey="tipo" innerRadius={50} outerRadius={80}>
                {chartTareas.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<AcademicTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Evolución de compromiso" description="Nivel de compromiso durante las semanas disponibles.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={semanas.map((s) => ({
                semana: s.semana,
                valor: s.compromiso === "alto" ? 3 : s.compromiso === "medio" ? 2 : 1,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => (v === 3 ? "Alto" : v === 2 ? "Medio" : "Bajo")} />
              <Tooltip formatter={(v) => (Number(v) === 3 ? "Alto" : Number(v) === 2 ? "Medio" : "Bajo")} />
              <Line isAnimationActive={false} type="monotone" dataKey="valor" stroke="var(--risk-medium)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTablePanel title="Detalle semanal" isEmpty={semanas.length === 0} emptyMessage={ESTUDIANTE_MSG.sinLms}>
        <TableWrap>
          <thead>
            <tr>
              <th>Semana</th>
              <th>Accesos</th>
              <th>Minutos</th>
              <th>Tareas entregadas</th>
              <th>Participación</th>
              <th>Compromiso</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => (
              <tr key={s.semana}>
                <td>{s.semana}</td>
                <td>{s.accesos}</td>
                <td>{s.minutos}</td>
                <td>{s.tareasEntregadas}%</td>
                <td>{s.participacion}%</td>
                <td>{s.compromiso === "alto" ? "Alto" : s.compromiso === "medio" ? "Medio" : "Bajo"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
