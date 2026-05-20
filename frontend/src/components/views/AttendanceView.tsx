"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Student } from "@/types/academic";
import { EmptyState } from "@/components/EmptyState";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";
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
  const [form, setForm] = useState({
    studentId: "",
    fecha: new Date().toISOString().slice(0, 10),
    presente: true,
    justificado: false,
    tardanza: false,
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

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Control de asistencia"
        description="Registre asistencia diaria por estudiante. Los docentes y tutores pueden marcar presente, tardanza o falta justificada."
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
    try {
      await api.createAttendance({
        studentId: form.studentId,
        fecha: form.fecha,
        presente: form.presente,
        justificado: form.justificado,
        tardanza: form.tardanza,
        observacion: form.observacion || undefined,
      });
      toast.success("Asistencia registrada");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    }
  }

  return (
    <div className="space-y-8">
      <PageSection
        variant="form"
        icon={CalendarCheck}
        title="Registrar asistencia"
        description="Marque presente, tardanza o falta justificada por día."
      >
        <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
          <FormField label="Estudiante" className="form-grid-full sm:col-span-2">
          <select
            className={INPUT_CLASS}
            value={form.studentId}
            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
            required
          >
            <option value="">Estudiante</option>
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
          <FormField label="Presente">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.presente}
              onChange={(e) => setForm((p) => ({ ...p, presente: e.target.checked }))}
            />
            Presente
          </label>
          </FormField>
          <FormField label="Tardanza">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.tardanza}
              onChange={(e) => setForm((p) => ({ ...p, tardanza: e.target.checked }))}
            />
            Tardanza
          </label>
          </FormField>
          <FormField label="Justificado">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.justificado}
              onChange={(e) => setForm((p) => ({ ...p, justificado: e.target.checked }))}
            />
            Justificado
          </label>
          </FormField>
          <FormField label="Observación" className="form-grid-full sm:col-span-2">
          <input
            className={INPUT_CLASS}
            placeholder="Opcional"
            value={form.observacion}
            onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
          />
          </FormField>
          <button type="submit" className="btn-primary form-grid-full">
            Guardar asistencia
          </button>
        </form>
      </PageSection>

      <DataTablePanel
        title="Últimos registros"
        description={loading ? "Cargando…" : `${items.length} registro(s)`}
        isEmpty={!loading && items.length === 0}
        emptyMessage="Sin registros de asistencia."
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estudiante</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.fecha).toLocaleDateString("es-PE")}</td>
                <td>
                  {a.student ? `${a.student.nombres} ${a.student.apellidos}` : a.studentId}
                </td>
                <td className="capitalize">
                  {a.presente ? (a.tardanza ? "Tardanza" : "Presente") : a.justificado ? "Falta justificada" : "Falta"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
