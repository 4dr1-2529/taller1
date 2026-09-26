"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { estudianteService } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SELECT_CLASS, INPUT_CLASS } from "@/lib/ui";

type AsistenciaItem = {
  id: string;
  fecha: string;
  curso: string | null;
  estado: string;
  observacion: string | null;
  profesor: string | null;
};

type ResumenAsistencia = {
  asistencias: number;
  tardanzas: number;
  faltas: number;
  justificadas: number;
  porcentaje: number | null;
  total: number;
};

const EMPTY_RESUMEN: ResumenAsistencia = {
  asistencias: 0,
  tardanzas: 0,
  faltas: 0,
  justificadas: 0,
  porcentaje: 0,
  total: 0,
};

export function StudentAttendanceView() {
  const { ready, isEstudiante } = useAuthReady();
  const [items, setItems] = useState<AsistenciaItem[]>([]);
  const [resumen, setResumen] = useState<ResumenAsistencia>(EMPTY_RESUMEN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mes, setMes] = useState("");
  const [bimestre, setBimestre] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const load = useCallback(async () => {
    if (!ready || !isEstudiante) return;
    setLoading(true);
    setError(null);
    try {
      const res = await estudianteService.getAsistencia({
        mes: mes || undefined,
        bimestre: bimestre || undefined,
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setItems(res.items ?? []);
      setResumen(res.resumen ?? EMPTY_RESUMEN);
    } catch (e) {
      // Fallo de API: se limpia el resumen anterior para no mostrar KPIs
      // obsoletos junto a un error de la consulta nueva.
      const msg = e instanceof Error ? e.message : "No se pudo cargar tu asistencia.";
      toast.error(msg);
      setError(msg);
      setItems([]);
      setResumen(EMPTY_RESUMEN);
    } finally {
      setLoading(false);
    }
  }, [mes, bimestre, estado, desde, hasta, ready, isEstudiante]);

  useEffect(() => {
    if (!ready || !isEstudiante) return;
    void load();
  }, [load, ready, isEstudiante]);

  function clearFilters() {
    setMes("");
    setBimestre("");
    setEstado("");
    setDesde("");
    setHasta("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistencia diaria"
        title="Historial de asistencia"
      />

      <div className="premium-card grid gap-3 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Mes</span>
          <input type="month" className={INPUT_CLASS} value={mes} onChange={(e) => setMes(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Bimestre</span>
          <select className={SELECT_CLASS} value={bimestre} onChange={(e) => setBimestre(e.target.value)}>
            <option value="">Todos</option>
            <option value="1">Bimestre 1</option>
            <option value="2">Bimestre 2</option>
            <option value="3">Bimestre 3</option>
            <option value="4">Bimestre 4</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Estado</span>
          <select className={SELECT_CLASS} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="asistio">Asistió</option>
            <option value="tardanza">Tardanza</option>
            <option value="falta">Falta</option>
            <option value="justificada">Justificada</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Desde</span>
          <input type="date" className={INPUT_CLASS} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">Hasta</span>
          <input type="date" className={INPUT_CLASS} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => void load()}>
            Buscar
          </button>
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          technicalDetail="GET /estudiante/asistencia"
          onRetry={() => void load()}
        />
      ) : (
        <>
          <SummaryStatsRow
            stats={[
              { label: "Asistencias", value: resumen.asistencias, tone: "success" },
              { label: "Tardanzas", value: resumen.tardanzas, tone: "warning" },
              { label: "Faltas", value: resumen.faltas, tone: "danger" },
              { label: "Justificadas", value: resumen.justificadas },
              { label: "% Asistencia", value: resumen.porcentaje == null ? "—" : `${resumen.porcentaje}%`, tone: "brand" },
            ]}
          />

          <DataTablePanel
            title="Mi historial de asistencia"
            isEmpty={items.length === 0}
            emptyMessage={ESTUDIANTE_MSG.sinAsistencia}
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Curso</th>
                  <th>Estado</th>
                  <th>Observación</th>
                  <th>Profesor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.fecha).toLocaleDateString("es-PE")}</td>
                    <td>{r.curso ?? "—"}</td>
                    <td>{r.estado}</td>
                    <td>{r.observacion ?? "—"}</td>
                    <td>{r.profesor ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </>
      )}
    </div>
  );
}
