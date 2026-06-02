"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Student } from "@/types/academic";
import { EmptyState } from "@/components/EmptyState";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { AttendanceStatusPicker } from "@/components/ui/AttendanceStatusPicker";
import { INPUT_CLASS } from "@/lib/ui";
import {
  estadoBadgeClass,
  estadoLabel,
  estadoToFlags,
  flagsToEstado,
  type AttendanceEstado,
} from "@/lib/attendance-status";
import { CalendarCheck } from "lucide-react";

type AttendanceRow = {
  id: string;
  studentId: string;
  fecha: string;
  presente: boolean;
  justificado: boolean;
  tardanza: boolean;
  observacion?: string | null;
  student?: { codigo: string; nombres: string; apellidos: string };
};

type AttendanceViewProps = {
  students: Student[];
};

export function AttendanceView({ students }: AttendanceViewProps) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    fecha: new Date().toISOString().slice(0, 10),
    estado: "presente" as AttendanceEstado,
    observacion: "",
  });

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getAttendance();
      setItems(res.items as AttendanceRow[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  const filtered = items.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = a.student
      ? `${a.student.nombres} ${a.student.apellidos} ${a.student.codigo}`.toLowerCase()
      : a.studentId;
    return name.includes(q) || new Date(a.fecha).toLocaleDateString("es-PE").includes(q);
  });

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Control de asistencia"
        description="Registre la asistencia diaria: asistió, tardanza, falta o falta justificada."
        showLogin
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.fecha) {
      toast.error("Seleccione estudiante y fecha");
      return;
    }
    const flags = estadoToFlags(form.estado);
    try {
      await api.createAttendance({
        studentId: form.studentId,
        fecha: form.fecha,
        ...flags,
        observacion: form.observacion || undefined,
      });
      toast.success("Asistencia guardada");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={CalendarCheck}
            title="Registrar asistencia del día"
            description="Indique si el estudiante asistió, llegó tarde o tuvo falta."
          >
            <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
              <FormField label="Estudiante" className="form-grid-full">
                <select
                  className={INPUT_CLASS}
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione un estudiante…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} — {s.nombres} {s.apellidos}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Fecha">
                <input
                  type="date"
                  className={INPUT_CLASS}
                  value={form.fecha}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Estado del día" className="form-grid-full">
                <AttendanceStatusPicker
                  value={form.estado}
                  onChange={(estado) => setForm((p) => ({ ...p, estado }))}
                />
              </FormField>
              <FormField label="Observación (opcional)" className="form-grid-full">
                <input
                  className={INPUT_CLASS}
                  placeholder="Ej. permiso médico, viaje familiar…"
                  value={form.observacion}
                  onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Guardar asistencia
              </button>
            </form>
          </PageSection>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title="Historial de asistencia"
            description={loading ? "Cargando registros…" : `${filtered.length} registro(s)`}
            searchPlaceholder="Buscar por nombre, código o fecha…"
            searchValue={query}
            onSearch={setQuery}
            isEmpty={!loading && filtered.length === 0}
            emptyMessage="Aún no hay registros. Use el formulario para marcar la primera asistencia."
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const estado = flagsToEstado(a);
                  return (
                    <tr key={a.id}>
                      <td>{new Date(a.fecha).toLocaleDateString("es-PE")}</td>
                      <td>
                        {a.student
                          ? `${a.student.nombres} ${a.student.apellidos}`
                          : a.studentId}
                      </td>
                      <td>
                        <span className={estadoBadgeClass(estado)}>{estadoLabel(estado)}</span>
                      </td>
                      <td className="text-[var(--text-secondary)]">
                        {a.observacion?.trim() || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.div>
      </div>
    </div>
  );
}
