"use client";

import { useEffect, useState } from "react";
import { estudianteService } from "@/services/estudianteService";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { CardSkeleton } from "@/components/ui/Skeleton";

export function StudentMensajeriaView() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof estudianteService.getMensajes>>["items"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void estudianteService
      .getMensajes()
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">{ESTUDIANTE_MSG.mensajes}</p>
      <DataTablePanel
        title="Mis mensajes"
        isEmpty={items.length === 0}
        emptyMessage={ESTUDIANTE_MSG.sinMensajes}
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Remitente</th>
              <th>Curso</th>
              <th>Mensaje</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.remitente}</td>
                <td>{m.curso ?? "Institucional"}</td>
                <td className="max-w-md truncate">{m.mensaje}</td>
                <td>{new Date(m.fecha).toLocaleString("es-PE")}</td>
                <td>{m.leido ? "Leído" : "No leído"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
