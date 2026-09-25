"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "@/services/api";
import { PageSection } from "@/components/ui/PageSection";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TableWrap } from "@/components/ui/DataTablePanel";

type Entry = {
  id: string;
  entidad: string;
  accion: string;
  entidadId: string;
  createdAt: string;
  detalle?: string;
  usuario?: { email: string };
};

const COLS = ["Fecha", "Usuario", "Entidad", "Acción", "Detalle"];

export function AuditView() {
  const [items, setItems] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void api
      .call<{ items: Entry[]; pagination: { pages: number } }>(`/admin/audit-logs?page=${page}`)
      .then((r) => {
        if (active) {
          setItems(r.items);
          setPages(r.pagination.pages);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "No se pudo cargar la auditoría.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <PageSection
      icon={History}
      title="Auditoría del sistema"
      description="Operaciones registradas por los usuarios del sistema, ordenadas de más reciente a más antigua."
    >
      {loading ? (
        <TableSkeleton rows={6} cols={COLS.length} />
      ) : error ? (
        <ErrorState message={error} technicalDetail="GET /admin/audit-logs" onRetry={() => setPage((p) => p)} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin operaciones registradas"
          description="Aún no se han registrado movimientos en el sistema. Las operaciones aparecerán aquí automáticamente."
        />
      ) : (
        <TableWrap>
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr>
                {COLS.map((x) => (
                  <th key={x} scope="col">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-xs">
                    {new Date(e.createdAt).toLocaleString("es-PE")}
                  </td>
                  <td>{e.usuario?.email ?? "Sistema"}</td>
                  <td>
                    {e.entidad} #{e.entidadId}
                  </td>
                  <td>{e.accion}</td>
                  <td className="text-xs text-[var(--text-secondary)]">{e.detalle ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className="flex items-center justify-between gap-2 pt-4 text-xs text-[var(--text-muted)]">
        <span>
          Página {page} de {Math.max(1, pages)}
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            className="btn-ghost py-1.5 disabled:opacity-40"
            disabled={loading || page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn-ghost py-1.5 disabled:opacity-40"
            disabled={loading || page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </span>
      </div>
    </PageSection>
  );
}
