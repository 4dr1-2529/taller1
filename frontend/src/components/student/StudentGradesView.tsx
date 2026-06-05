"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { estudianteService, type EstudianteNotasData } from "@/services/estudianteService";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { CardSkeleton } from "@/components/ui/Skeleton";

function estadoClass(estado: string): string {
  if (estado === "Aprobado") return "text-emerald-600 dark:text-emerald-400";
  if (estado === "En riesgo") return "text-amber-600 dark:text-amber-400";
  if (estado === "Desaprobado") return "text-rose-600 dark:text-rose-400";
  return "text-[var(--text-muted)]";
}

export function StudentGradesView() {
  const [data, setData] = useState<EstudianteNotasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void estudianteService
      .getNotas()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const profile = data?.profile;
  const filas = data?.filas ?? [];
  const resumen = data?.resumen;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)]">{ESTUDIANTE_MSG.notas}</p>

      {profile ? (
        <div className="premium-card grid gap-3 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          <div>
            <p className="text-[var(--text-muted)]">Código</p>
            <p className="font-semibold">{profile.codigo}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Nombre</p>
            <p className="font-semibold">
              {profile.nombres} {profile.apellidos}
            </p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Grado</p>
            <p className="font-semibold">{profile.gradoLabel ?? "—"}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Sección</p>
            <p className="font-semibold">{profile.salon ?? "—"}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Periodo académico</p>
            <p className="font-semibold">{profile.periodoAcademico ?? "—"}</p>
          </div>
        </div>
      ) : null}

      {resumen ? (
        <SummaryStatsRow
          stats={[
            { label: "Promedio general", value: resumen.promedioGeneral, tone: "brand" },
            { label: "Cursos aprobados", value: resumen.cursosAprobados, tone: "success" },
            { label: "Cursos en riesgo", value: resumen.cursosEnRiesgo, tone: "warning" },
            { label: "Cursos desaprobados", value: resumen.cursosDesaprobados, tone: "danger" },
          ]}
        />
      ) : null}

      <DataTablePanel
        title="Mis calificaciones por curso"
        isEmpty={filas.length === 0}
        emptyMessage={ESTUDIANTE_MSG.sinNotas}
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Curso</th>
              <th>Bimestre 1</th>
              <th>Bimestre 2</th>
              <th>Bimestre 3</th>
              <th>Bimestre 4</th>
              <th>Promedio final</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.courseId}>
                <td>{f.curso}</td>
                <td>{f.bimestre1 ?? "—"}</td>
                <td>{f.bimestre2 ?? "—"}</td>
                <td>{f.bimestre3 ?? "—"}</td>
                <td>{f.bimestre4 ?? "—"}</td>
                <td>{f.promedioFinal ?? "—"}</td>
                <td className={clsx("font-medium", estadoClass(f.estado))}>{f.estado}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
