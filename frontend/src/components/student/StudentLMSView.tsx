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
import { CardSkeleton } from "@/components/ui/Skeleton";

const PIE_COLORS = ["#10b981", "#f59e0b"];

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
        <div className="premium-card rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold">Actividad por semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartSemanal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="actividad" fill="#8b5cf6" name="Actividad %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="premium-card rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold">Tiempo en plataforma por semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartSemanal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="minutos" stroke="#06b6d4" name="Minutos" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="premium-card rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold">Entregas vs pendientes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartTareas} dataKey="valor" nameKey="tipo" innerRadius={50} outerRadius={80}>
                {chartTareas.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="premium-card rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold">Evolución de compromiso</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={semanas.map((s) => ({
                semana: s.semana,
                valor: s.compromiso === "alto" ? 3 : s.compromiso === "medio" ? 2 : 1,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => (v === 3 ? "Alto" : v === 2 ? "Medio" : "Bajo")} />
              <Tooltip formatter={(v) => (Number(v) === 3 ? "Alto" : Number(v) === 2 ? "Medio" : "Bajo")} />
              <Line type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
