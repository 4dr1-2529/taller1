"use client";

import { type FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  BookOpen,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Teacher } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { INPUT_CLASS } from "@/lib/ui";

export type NewTeacherCourse = {
  codigo: string;
  nombre: string;
  seccionId: string;
};

export type NewTeacherForm = {
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
  crearCuenta: boolean;
  password: string;
  cursos: NewTeacherCourse[];
};

export const defaultTeacherForm: NewTeacherForm = {
  codigo: "",
  nombres: "",
  apellidos: "",
  especialidad: "",
  correo: "",
  telefono: "",
  crearCuenta: true,
  password: "",
  cursos: [],
};

export type EditTeacherForm = {
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
  cursosNuevos: NewTeacherCourse[];
};

const emptyCourse = (): NewTeacherCourse => ({ codigo: "", nombre: "", seccionId: "" });

type TeachersViewProps = {
  teachers: Teacher[];
  secciones: SeccionOption[];
  form: NewTeacherForm;
  setForm: (v: NewTeacherForm | ((p: NewTeacherForm) => NewTeacherForm)) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
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
    cursosNuevos: [],
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      `${t.nombres} ${t.apellidos} ${t.codigo} ${t.especialidad} ${t.correo}`.toLowerCase().includes(q),
    );
  }, [teachers, query]);

  function updateCourse(index: number, patch: Partial<NewTeacherCourse>) {
    setForm((p) => ({
      ...p,
      cursos: p.cursos.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function updateEditCourse(index: number, patch: Partial<NewTeacherCourse>) {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      cursosNuevos: editForm.cursosNuevos.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  }

  return (
    <div className="space-y-8">
      {canEdit ? (
        <PageSection
          variant="form"
          icon={UserPlus}
          title="Registrar docente"
          description="Perfil, cursos que dicta y opcionalmente cuenta para ingresar al sistema."
        >
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Código</span>
                <input className={INPUT_CLASS} placeholder="DOC-001" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Nombres</span>
                <input className={INPUT_CLASS} value={form.nombres} onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Apellidos</span>
                <input className={INPUT_CLASS} value={form.apellidos} onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Especialidad</span>
                <input className={INPUT_CLASS} placeholder="Matemática…" value={form.especialidad} onChange={(e) => setForm((p) => ({ ...p, especialidad: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Correo</span>
                <input type="email" className={INPUT_CLASS} value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Teléfono</span>
                <input className={INPUT_CLASS} value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
              </label>
            </div><label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.crearCuenta} onChange={(e) => setForm((p) => ({ ...p, crearCuenta: e.target.checked }))} />
              Crear cuenta de acceso (rol docente)
            </label>
            {form.crearCuenta ? (
              <label className="block max-w-md text-sm">
                <span className="mb-1.5 block font-medium">Contraseña inicial</span>
                <input type="password" className={INPUT_CLASS} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={8} required />
              </label>
            ) : null}

            <CourseBlock
              cursos={form.cursos}
              secciones={secciones}
              onAdd={() => setForm((p) => ({ ...p, cursos: [...p.cursos, emptyCourse()] }))}
              onRemove={(i) => setForm((p) => ({ ...p, cursos: p.cursos.filter((_, j) => j !== i) }))}
              onChange={updateCourse}
            />

            <button type="submit" className="btn-primary">
              Guardar docente
            </button>
          </form>
        </PageSection>
      ) : null}

      <article className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Plantilla docente ({filtered.length})</h3>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" className={clsx(INPUT_CLASS, "pl-9")} placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div><ul className="mt-6 space-y-3">
          {filtered.map((teacher) => {
            const open = expandedId === teacher.id;
            const editing = editingId === teacher.id && editForm;
            const hasAccount = !!teacher.userId;
            const courses = teacher.courses ?? [];

            return (
              <li key={teacher.id} className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/50 transition hover:border-indigo-500/30">
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <button type="button" className="flex-1 text-left" onClick={() => setExpandedId(open ? null : teacher.id)}>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {teacher.nombres} {teacher.apellidos}
                      <span className="ml-2 text-xs text-slate-500">({teacher.codigo})</span>
                    </p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{teacher.especialidad}</p>
                    <p className="mt-1 text-xs text-slate-500">{teacher.correo}</p>
                    <span className={clsx("mt-2 inline-block", hasAccount ? "badge-success" : "badge-warning")}>
                      {hasAccount ? "Con cuenta de acceso" : "Sin cuenta"}
                    </span>
                  </button>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-ghost text-xs py-1" onClick={() => { setEditingId(teacher.id); setEditForm(startEdit(teacher)); setExpandedId(teacher.id); }}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button type="button" className="btn-ghost text-xs py-1 text-rose-400 border-rose-500/30" onClick={() => void onDeactivate(teacher.id)}>
                        <UserX className="h-3.5 w-3.5" /> Desactivar
                      </button>
                    </div>) : null}
                </div>{open && editing && editForm ? (
                  <form
                    className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void onUpdate(teacher.id, editForm).then(() => {
                        setEditingId(null);
                        setEditForm(null);
                      });
                    }}
                  >
                    <p className="mb-3 text-sm font-semibold">Editar datos</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={INPUT_CLASS} value={editForm.nombres} onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })} required />
                      <input className={INPUT_CLASS} value={editForm.apellidos} onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })} required />
                      <input className={INPUT_CLASS} value={editForm.especialidad} onChange={(e) => setEditForm({ ...editForm, especialidad: e.target.value })} required />
                      <input type="email" className={INPUT_CLASS} value={editForm.correo} onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })} required />
                      <input className={INPUT_CLASS} value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} />
                    </div><CourseBlock
                      title="Añadir curso a este docente"
                      cursos={editForm.cursosNuevos}
                      secciones={secciones}
                      onAdd={() => setEditForm({ ...editForm, cursosNuevos: [...editForm.cursosNuevos, emptyCourse()] })}
                      onRemove={(i) => setEditForm({ ...editForm, cursosNuevos: editForm.cursosNuevos.filter((_, j) => j !== i) })}
                      onChange={updateEditCourse}
                    />
                    <button type="submit" className="btn-primary mt-3">Guardar cambios</button>
                  </form>
                ) : null}

                {open && !hasAccount && canEdit ? (
                  <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-700">
                    <label className="flex-1 text-sm">
                      <span className="mb-1 block text-xs font-medium">Crear cuenta de acceso</span>
                      <input type="password" className={INPUT_CLASS} placeholder="Contraseña (mín. 8)" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} minLength={8} />
                    </label>
                    <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => void onCreateAccount(teacher.id, accountPassword).then(() => setAccountPassword(""))}>
                      <KeyRound className="h-3.5 w-3.5" /> Activar login
                    </button>
                  </div>) : null}

                {open && courses.length > 0 ? (
                  <ul className="grid gap-2 border-t border-slate-100 px-4 py-3 sm:grid-cols-2 dark:border-slate-700">
                    {courses.map((c) => (
                      <li key={c.id} className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-900">
                        <span className="font-medium">{c.nombre}</span> · {c.codigo}
                        <p className="text-xs text-slate-500">{seccionLabel(secciones, c.seccionId)}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 ? <p className="mt-6 text-center text-sm text-slate-500">Sin docentes registrados.</p> : null}
      </article>
    </div>
  );
}

function CourseBlock({
  title = "Cursos que dicta (opcional)",
  cursos,
  secciones,
  onAdd,
  onRemove,
  onChange,
}: {
  title?: string;
  cursos: NewTeacherCourse[];
  secciones: SeccionOption[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, patch: Partial<NewTeacherCourse>) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{title}</p>
        <button type="button" onClick={onAdd} className="btn-primary text-xs py-1.5">
          <Plus className="h-3.5 w-3.5" /> Añadir
        </button>
      </div>{cursos.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Sin cursos en esta sección.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cursos.map((c, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-4">
              <input className={INPUT_CLASS} placeholder="Código" value={c.codigo} onChange={(e) => onChange(i, { codigo: e.target.value })} required />
              <input className={INPUT_CLASS} placeholder="Nombre" value={c.nombre} onChange={(e) => onChange(i, { nombre: e.target.value })} required />
              <select className={INPUT_CLASS} value={c.seccionId} onChange={(e) => onChange(i, { seccionId: e.target.value })}>
                <option value="">Sin sección</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => onRemove(i)} className="text-xs text-rose-600">Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </div>);
}
