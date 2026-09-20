"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
type Entry = { id: string; entidad: string; accion: string; entidadId: string; createdAt: string; detalle?: string; usuario?: { email: string } };
export function AuditView() {
  const [items, setItems] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; setLoading(true); setError("");
    void api.call<{ items: Entry[]; pagination: { pages: number } }>(`/admin/audit-logs?page=${page}`)
      .then(r => { if (active) { setItems(r.items); setPages(r.pagination.pages); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);
  return <section className="premium-card space-y-4 p-6"><h2>Auditoría</h2>
    {loading ? <p role="status">Cargando…</p> : error ? <p role="alert">{error}</p> : items.length === 0 ? <p>Sin operaciones registradas.</p> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Fecha", "Usuario", "Entidad", "Acción", "Detalle"].map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{items.map(e => <tr key={e.id}><td className="p-2">{new Date(e.createdAt).toLocaleString("es-PE")}</td><td>{e.usuario?.email ?? "Sistema"}</td><td>{e.entidad} #{e.entidadId}</td><td>{e.accion}</td><td>{e.detalle}</td></tr>)}</tbody></table></div>}
    <div className="flex gap-4"><button disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page}</span><button disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)}>Siguiente</button></div>
  </section>;
}
