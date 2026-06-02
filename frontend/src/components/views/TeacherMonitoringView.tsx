"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Mail, RefreshCw, Shield, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { api, type AuditLog } from "@/services/api";
import type { Teacher } from "@/types/academic";
import { getEntidadLabel } from "@/data/section-labels";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";

const ACCION_LABEL: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Actualizó",
  DELETE: "Eliminó / desactivó",
  LOGIN: "Inició sesión",
  CREATE_ACCOUNT: "Cuenta de acceso creada",
  CHANGE_PASSWORD: "Cambió contraseña",
  UPDATE_STATUS: "Cambió estado",
};

type TeacherMonitoringViewProps = {
  teachers: Teacher[];
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actorLabel(log: AuditLog) {
  if (log.usuario) {
    return `${log.usuario.nombres} ${log.usuario.apellidos} (${log.usuario.email})`;
  }
  if (log.teacher) {
    return `${log.teacher.nombres} ${log.teacher.apellidos}`;
  }
  return "Sistema";
}

export function TeacherMonitoringView({ teachers }: TeacherMonitoringViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [teacherId, setTeacherId] = useState("");
  const [entidad, setEntidad] = useState("");

  const withAccount = teachers.filter((t) => t.userId).length;
  const withoutAccount = teachers.length - withAccount;

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        page,
        limit: 40,
        role: "docente",
        teacherId: teacherId || undefined,
        entidad: entidad || undefined,
      });
      setLogs(res.items);
      setTotalPages(res.pagination.pages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar actividad");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, teacherId, entidad]);

  useEffect(() => {
    void load();
  }, [load]);

  const entidades = useMemo(() => {
    const set = new Set(logs.map((l) => l.entidad));
    return [...set].sort();
  }, [logs]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-500" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Monitoreo de docentes</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Revise qué hace cada profesor en el sistema: registros, notas, cursos y accesos. Para
            crear el correo de login, use el menú <strong className="text-[var(--text-primary)]">Académico → Profesores</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="btn-secondary shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="premium-card rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Docentes activos</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{teachers.length}</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <UserCheck className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Con correo de acceso</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{withAccount}</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-500">
            <UserX className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Sin cuenta aún</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{withoutAccount}</p>
          {withoutAccount > 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              En Profesores: «Activar acceso» o marque «Crear cuenta» al registrar.
            </p>
          ) : null}
        </div>
      </div>

      <div className="premium-card rounded-2xl p-4 md:p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Mail className="h-4 w-4 text-violet-500" />
          Cuentas de acceso (correo institucional)
        </p>
        <ul className="divide-y divide-[var(--border-subtle)]">
          {teachers.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="font-medium text-[var(--text-primary)]">
                {t.nombres} {t.apellidos}
                <span className="ml-2 text-xs text-[var(--text-muted)]">({t.codigo})</span>
              </span>
              {t.userId ? (
                <span className="badge-success inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {t.correo}
                </span>
              ) : (
                <span className="badge-warning">Sin acceso — crear en Profesores</span>
              )}
            </li>
          ))}
          {teachers.length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--text-muted)]">No hay docentes registrados.</li>
          ) : null}
        </ul>
      </div>

      <DataTablePanel
        title="Registro de actividad"
        description="Acciones realizadas por usuarios con rol docente en la plataforma."
        isEmpty={!loading && logs.length === 0}
        emptyMessage="No hay movimientos registrados para los filtros seleccionados."
        toolbar={
          <div className="flex flex-wrap gap-2">
            <select
              className={INPUT_CLASS}
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los docentes</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.apellidos}, {t.nombres}
                </option>
              ))}
            </select>
            <select
              className={INPUT_CLASS}
              value={entidad}
              onChange={(e) => {
                setEntidad(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las entidades</option>
              {entidades.map((e) => (
                <option key={e} value={e}>
                  {getEntidadLabel(e)}
                </option>
              ))}
              <option value="Student">Estudiante</option>
              <option value="Course">Curso</option>
              <option value="Enrollment">Matrícula</option>
              <option value="Grade">Nota</option>
              <option value="Teacher">Profesor</option>
            </select>
          </div>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Docente / usuario</th>
              <th>Acción</th>
              <th>Detalle</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
                  {formatFecha(log.createdAt)}
                </td>
                <td className="max-w-[200px] text-sm">{actorLabel(log)}</td>
                <td>
                  <span className="badge-info">
                    {ACCION_LABEL[log.accion] ?? log.accion} · {getEntidadLabel(log.entidad)}
                  </span>
                </td>
                <td className="max-w-xs text-xs text-[var(--text-secondary)]">
                  {log.detalle ?? "—"}
                  {log.student
                    ? ` · ${log.student.apellidos}, ${log.student.nombres} (${log.student.codigo})`
                    : null}
                </td>
                <td className="text-xs text-[var(--text-muted)]">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              className="btn-ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              className="btn-ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </DataTablePanel>

      <p className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Las acciones del administrador sobre docentes también quedan en este registro cuando incluyen
        al profesor (crear cuenta, desactivar, etc.).
      </p>
    </div>
  );
}
