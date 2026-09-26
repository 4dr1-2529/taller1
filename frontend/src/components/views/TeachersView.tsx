"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  KeyRound,
  Pencil,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Teacher } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { localSearchMatch } from "@/lib/search-text";
import { SearchField } from "@/components/ui/SearchField";
import { INPUT_CLASS } from "@/lib/ui";
import { PersonNameInput, PhoneInput } from "@/components/ui/ValidatedInputs";
import {
  PHONE_MAX_DIGITS,
  type FieldErrors,
  firstError,
  validateTeacherForm,
  validateTeacherProfileFields,
  validatePassword,
  clearFieldError,
} from "@/lib/validation";

export type NewTeacherForm = {
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
  crearCuenta: boolean;
  password: string;
};

export const defaultTeacherForm: NewTeacherForm = {
  dni: "",
  nombres: "",
  apellidos: "",
  especialidad: "",
  correo: "",
  telefono: "",
  crearCuenta: true,
  password: "",
};

export type EditTeacherForm = {
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
};


type TeachersViewProps = {
  teachers: Teacher[];
  secciones: SeccionOption[];
  form: NewTeacherForm;
  setForm: (v: NewTeacherForm | ((p: NewTeacherForm) => NewTeacherForm)) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdate: (id: string, data: EditTeacherForm) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onCreateAccount: (id: string, password: string) => Promise<void>;
  canEdit?: boolean;
};

function seccionLabel(secciones: SeccionOption[], seccionId?: string) {
  if (!seccionId) return "Sin sección";
  return secciones.find((s) => s.id === seccionId)?.label ?? "Sección";
}

function startEdit(teacher: Teacher): EditTeacherForm {
  return {
    nombres: teacher.nombres,
    apellidos: teacher.apellidos,
    especialidad: teacher.especialidad,
    correo: teacher.correo,
    telefono: teacher.telefono,
  };
}

export function TeachersView({
  teachers,
  secciones,
  form,
  setForm,
  onSubmit,
  onUpdate,
  onDeactivate,
  onCreateAccount,
  canEdit = true,
}: TeachersViewProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditTeacherForm | null>(null);
  const [accountPassword, setAccountPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [workloadById, setWorkloadById] = useState<
    Record<
      string,
      Awaited<ReturnType<typeof api.getTeacherDetail>>["workload"] | "loading" | "error"
    >
  >({});

  useEffect(() => {
    if (!expandedId || editingId === expandedId) return;
    setWorkloadById((p) => ({ ...p, [expandedId]: "loading" }));
    void api
      .getTeacherDetail(expandedId)
      .then((r) => setWorkloadById((p) => ({ ...p, [expandedId]: r.workload })))
      .catch(() => setWorkloadById((p) => ({ ...p, [expandedId]: "error" })));
  }, [expandedId, editingId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return teachers;
    return teachers.filter((t) =>
      localSearchMatch(
        `${t.nombres} ${t.apellidos} ${t.codigo} ${t.especialidad} ${t.correo}`,
        query,
      ),
    );
  }, [teachers, query]);



  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] ring-1 ring-white/10">
              <Users className="h-4 w-4 text-[var(--chart-secondary)]" />
            </div>
            <SectionHeading title="Gestión de profesores" />
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Perfiles docentes, cursos asignados y acceso al sistema
          </p>
        </div>
        <span className="badge badge-info">
          {filtered.length} {filtered.length === 1 ? "profesor" : "profesores"}
        </span>
      </motion.div>

      {canEdit ? (
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--accent)]">Cuentas de correo para profesores</p>
            <p className="mt-1">
              El <strong className="text-[var(--text-primary)]">correo</strong> del docente será su usuario de
              acceso. Marque «Crear cuenta de acceso» al registrar o use «Activar acceso» en docentes ya guardados.
              Supervise su actividad en <strong className="text-[var(--text-primary)]">Auditoría</strong>.
            </p>
          </div>
          <PageSection
            variant="form"
            icon={UserPlus}
            title="Registrar docente"
            description="Registre el perfil y la cuenta. Luego utilice Asignaciones docentes."
          >
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (submitting) return;
                const nextErrors = validateTeacherForm(form);
                setFormErrors(nextErrors);
                const msg = firstError(nextErrors);
                if (msg) {
                  toast.error(msg);
                  return;
                }
                setSubmitting(true);
                void Promise.resolve(onSubmit(e)).catch(() => undefined).finally(() => setSubmitting(false));
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Código</span>
<input className={INPUT_CLASS} value="PROF-… (automático)" readOnly />
                </label>
<label className="block text-sm">DNI<input className={INPUT_CLASS} value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value.replace(/\D/g, "").slice(0,8) }))} inputMode="numeric" pattern="[0-9]{8}" required /></label>
                <label className="block text-sm">
                  <span>Nombres</span>
                  <PersonNameInput
                    value={form.nombres}
                    onValueChange={(nombres) => {
                      setFormErrors((p) => clearFieldError(p, "nombres"));
                      setForm((p) => ({ ...p, nombres }));
                    }}
                    required
                  />
                  {formErrors.nombres ? <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.nombres}</span> : null}
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Apellidos</span>
                  <PersonNameInput
                    value={form.apellidos}
                    onValueChange={(apellidos) => {
                      setFormErrors((p) => clearFieldError(p, "apellidos"));
                      setForm((p) => ({ ...p, apellidos }));
                    }}
                    required
                  />
                  {formErrors.apellidos ? <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.apellidos}</span> : null}
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Especialidad</span>
                  <PersonNameInput
                    placeholder="Matemática…"
                    value={form.especialidad}
                    onValueChange={(especialidad) => {
                      setFormErrors((p) => clearFieldError(p, "especialidad"));
                      setForm((p) => ({ ...p, especialidad }));
                    }}
                    required
                  />
                  {formErrors.especialidad ? (
                    <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.especialidad}</span>
                  ) : null}
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">
                    Correo institucional (usuario de acceso)
                  </span>
                  <input
                    type="email"
                    className={INPUT_CLASS}
                    placeholder="profesor@iep-huancayo.edu.pe"
                    value={form.correo}
                    onChange={(e) => {
                      setFormErrors((p) => clearFieldError(p, "correo"));
                      setForm((p) => ({ ...p, correo: e.target.value }));
                    }}
                    required
                  />
                  {formErrors.correo ? <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.correo}</span> : null}
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">
                    Teléfono ({PHONE_MAX_DIGITS} dígitos)
                  </span>
                  <PhoneInput
                    placeholder="987654321"
                    value={form.telefono}
                    onValueChange={(telefono) => {
                      setFormErrors((p) => clearFieldError(p, "telefono"));
                      setForm((p) => ({ ...p, telefono }));
                    }}
                  />
                  {formErrors.telefono ? <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.telefono}</span> : null}
                </label>
              </div>
              <label className="form-grid-full flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={form.crearCuenta} onChange={(e) => setForm((p) => ({ ...p, crearCuenta: e.target.checked }))} />
                <span>Crear cuenta de acceso ahora (el docente entrará con este correo y la contraseña)</span>
              </label>
              {form.crearCuenta ? (
                <label className="block max-w-md text-sm">
                  <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Contraseña inicial</span>
                  <input type="password" className={INPUT_CLASS} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={8} required />
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">Mínimo 8 caracteres, con mayúscula, minúscula y número.</span>
                  {formErrors.password ? <span className="mt-1 block text-xs text-[var(--danger)]">{formErrors.password}</span> : null}
                </label>
              ) : null}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Guardando…" : "Guardar docente"}
              </button>
            </form>
          </PageSection>
        </motion.div>
      ) : null}

      {/* Teacher List */}
      <motion.article
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="premium-card rounded-2xl p-5 md:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Plantilla docente ({filtered.length})</h3>
          </div>
          <SearchField
            id="teachers-search"
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre, código, especialidad o correo…"
            className="w-full sm:max-w-xs"
          />
        </div>
        <ul className="mt-6 space-y-3">
          {filtered.map((teacher) => {
            const open = expandedId === teacher.id;
            const editing = editingId === teacher.id && editForm;
            const hasAccount = !!teacher.userId;
            const courses = teacher.courses ?? [];

            return (
              <li key={teacher.id} className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/50 transition hover:border-[var(--accent)]/30">
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <button type="button" className="flex-1 text-left" onClick={() => setExpandedId(open ? null : teacher.id)}>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {teacher.nombres} {teacher.apellidos}
                      <span className="ml-2 text-xs text-[var(--text-muted)]">({teacher.codigo})</span>
                    </p>
                    <p className="text-sm text-[var(--accent)]">{teacher.especialidad}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{teacher.correo}</p>
                    <span className={clsx("mt-2 inline-block", hasAccount ? "badge-success" : "badge-warning")}>
                      {hasAccount ? "Con cuenta de acceso" : "Sin cuenta"}
                    </span>
                  </button>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-ghost text-xs py-1" onClick={() => { setEditingId(teacher.id); setEditForm(startEdit(teacher)); setExpandedId(teacher.id); }}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button type="button" className="btn-ghost text-xs py-1 text-[var(--danger)] border-rose-500/30" onClick={() => void onDeactivate(teacher.id)}>
                        <UserX className="h-3.5 w-3.5" /> Desactivar
                      </button>
                    </div>) : null}
                </div>
                {open && editing && editForm ? (
                  <form
                    className="border-t border-[var(--border-subtle)] bg-[var(--accent-muted)]/20 p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const nextErrors = validateTeacherProfileFields(editForm);
                      setEditErrors(nextErrors);
                      const msg = firstError(nextErrors);
                      if (msg) {
                        toast.error(msg);
                        return;
                      }
                      void onUpdate(teacher.id, editForm).then(() => {
                        setEditingId(null);
                        setEditForm(null);
                        setEditErrors({});
                      });
                    }}
                  >
                    <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Editar datos</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PersonNameInput
                        value={editForm.nombres}
                        onValueChange={(nombres) => {
                          setEditErrors((p) => clearFieldError(p, "nombres"));
                          setEditForm({ ...editForm, nombres });
                        }}
                        required
                      />
                      <PersonNameInput
                        value={editForm.apellidos}
                        onValueChange={(apellidos) => {
                          setEditErrors((p) => clearFieldError(p, "apellidos"));
                          setEditForm({ ...editForm, apellidos });
                        }}
                        required
                      />
                      <PersonNameInput
                        value={editForm.especialidad}
                        onValueChange={(especialidad) => {
                          setEditErrors((p) => clearFieldError(p, "especialidad"));
                          setEditForm({ ...editForm, especialidad });
                        }}
                        required
                      />
                      <input
                        type="email"
                        className={INPUT_CLASS}
                        value={editForm.correo}
                        onChange={(e) => {
                          setEditErrors((p) => clearFieldError(p, "correo"));
                          setEditForm({ ...editForm, correo: e.target.value });
                        }}
                        required
                      />
                      <PhoneInput
                        value={editForm.telefono}
                        onValueChange={(telefono) => {
                          setEditErrors((p) => clearFieldError(p, "telefono"));
                          setEditForm({ ...editForm, telefono });
                        }}
                      />
                    </div>
                    {firstError(editErrors) ? (
                      <p className="mt-2 text-xs text-[var(--danger)]">{firstError(editErrors)}</p>
                    ) : null}
                    <button type="submit" className="btn-primary mt-3">Guardar cambios</button>
                  </form>
                ) : null}

                {open && !hasAccount && canEdit ? (
                  <div className="flex flex-wrap items-end gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
                    <label className="flex-1 text-sm">
                      <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                        Contraseña inicial para {teacher.correo}
                      </span>
                      <input type="password" className={INPUT_CLASS} placeholder="Mínimo 8 caracteres, con mayúscula, minúscula y número" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} minLength={8} />
                    </label>
                    <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500" onClick={() => {
                      const err = validatePassword(accountPassword);
                      if (err) { toast.error(err); return; }
                      void onCreateAccount(teacher.id, accountPassword).then(() => setAccountPassword(""));
                    }}>
                      <KeyRound className="h-3.5 w-3.5" /> Crear acceso con este correo
                    </button>
                  </div>) : null}

                {open && !editing ? (
                  <TeacherWorkloadPanel workload={workloadById[teacher.id]} courses={courses} secciones={secciones} />
                ) : null}
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 ? <p className="mt-6 text-center text-sm text-[var(--text-muted)]">Sin docentes registrados.</p> : null}
      </motion.article>
    </div>
  );
}

function TeacherWorkloadPanel({
  workload,
  courses,
  secciones,
}: {
  workload: Awaited<ReturnType<typeof api.getTeacherDetail>>["workload"] | "loading" | "error" | undefined;
  courses: Teacher["courses"];
  secciones: SeccionOption[];
}) {
  if (workload === "loading" || workload === undefined) {
    return <p className="border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-muted)]">Cargando carga académica…</p>;
  }
  if (workload === "error") {
    return (
      <ul className="grid gap-2 border-t border-[var(--border-subtle)] px-4 py-3 sm:grid-cols-2">
        {(courses ?? []).map((c) => (
          <li key={c.id} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
            <span className="font-medium">{c.nombre}</span>
            <p className="text-xs text-[var(--text-muted)]">{seccionLabel(secciones, c.seccionId)}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="border-t border-[var(--border-subtle)] px-4 py-4 space-y-3 text-sm">
      <p>
        <span className="font-semibold text-[var(--text-primary)]">Tipo: </span>
        {workload.tipoAsignacion}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Cursos que dicta</p>
          <ul className="mt-1 list-disc pl-4">
            {workload.cursos.map((c) => (
              <li key={c.id}>{c.nombre}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Grados</p>
          <p className="mt-1">{workload.grados.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Secciones</p>
          <p className="mt-1">{workload.secciones.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Alumnos / carga</p>
          <p className="mt-1">
            {workload.totalAlumnos} alumnos · {workload.cargaAcademica} asignaciones
          </p>
          {workload.polidocencia ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Polidocencia: {workload.polidocencia.cursosDistintos}/{workload.polidocencia.maxCursos} cursos ·{" "}
              {workload.polidocencia.salonesDistintos}/{workload.polidocencia.maxSalones} salones
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
