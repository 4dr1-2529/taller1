"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Course, Student } from "@/types/academic";
import { EmptyState } from "@/components/EmptyState";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";

type GradeRow = {
  id: string;
  studentId: string;
  courseId: string;
  periodo: string;
  bimestre: number;
  nota: number;
  observacion?: string | null;
  student?: { codigo: string; nombres: string; apellidos: string };
  course?: { codigo: string; nombre: string };
};

type GradesViewProps = {
  students: Student[];
  courses: Course[];
};

export function GradesView({ students, courses }: GradesViewProps) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    periodo: "2026-I",
    bimestre: "1",
    nota: "",
    observacion: "",
  });

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getGrades();
      setItems(res.items as GradeRow[]);
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
        title="Registro de notas"
        description="Inicie sesión para registrar calificaciones por bimestre (escala 0–20, Perú)."
        showLogin
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nota = Number.parseFloat(form.nota.replace(",", "."));
    if (!form.studentId || !form.courseId || !Number.isFinite(nota)) {
      toast.error("Complete estudiante, curso y nota válida (0–20)");
      return;
    }
    try {
      await api.createGrade({
        studentId: form.studentId,
        courseId: form.courseId,
        periodo: form.periodo,
        bimestre: Number(form.bimestre),
        nota,
        observacion: form.observacion || undefined,
      });
      toast.success("Nota registrada — promedio del estudiante actualizado");
      setForm((p) => ({ ...p, nota: "", observacion: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar nota");
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
              <GraduationCap className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Grade Registry
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Record and track bimester grades (Peruvian 0–20 scale)
          </p>
        </div>
        <span className="badge bg-white/5 text-[var(--text-secondary)] ring-1 ring-white/10">
          {items.length} records
        </span>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Grade Form */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={ClipboardList}
            title="Registrar nota"
            description="Escala vigente en Perú: 0 a 20 por bimestre. El promedio general se recalcula automáticamente."
          >
            <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
              <FormField label="Estudiante" className="form-grid-full sm:col-span-2">
                <select
                  className={INPUT_CLASS}
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} — {s.nombres} {s.apellidos}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Curso" className="form-grid-full sm:col-span-2">
                <select
                  className={INPUT_CLASS}
                  value={form.courseId}
                  onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Periodo">
                <input
                  className={INPUT_CLASS}
                  value={form.periodo}
                  onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
                />
              </FormField>
              <FormField label="Bimestre">
                <select
                  className={INPUT_CLASS}
                  value={form.bimestre}
                  onChange={(e) => setForm((p) => ({ ...p, bimestre: e.target.value }))}
                >
                  {[1, 2, 3, 4].map((b) => (
                    <option key={b} value={b}>
                      Bimestre {b}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nota (0–20)">
                <input
                  className={INPUT_CLASS}
                  inputMode="decimal"
                  value={form.nota}
                  onChange={(e) => setForm((p) => ({ ...p, nota: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Observación" className="form-grid-full">
                <input
                  className={INPUT_CLASS}
                  value={form.observacion}
                  onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Guardar nota
              </button>
            </form>
          </PageSection>
        </motion.div>

        {/* Grades Table */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title="Historial de notas"
            description={loading ? "Cargando…" : `${items.length} registro(s)`}
            isEmpty={!loading && items.length === 0}
            emptyMessage="Sin notas registradas."
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Periodo</th>
                  <th>Bim.</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.id}>
                    <td>
                      {g.student ? `${g.student.nombres} ${g.student.apellidos}` : g.studentId.slice(0, 8)}
                    </td>
                    <td>{g.course?.nombre ?? "—"}</td>
                    <td>{g.periodo}</td>
                    <td>{g.bimestre}</td>
                    <td className="font-semibold">{g.nota.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.div>
      </div>
    </div>
  );
}
