"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import { PageSection } from "@/components/ui/PageSection";
import { INPUT_CLASS } from "@/lib/ui";

type Resource = { id: string; titulo: string; descripcion?: string; tipo: string; url: string };
type Activity = { id: string; titulo: string; descripcion?: string; tipo: string; progress: { estado: string }[] };
type Course = { id: string; nombre?: string; codigo: string };

export function LearningView({ mode }: { mode: "materials" | "activities" | "courses" }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [items, setItems] = useState<{ resources: Resource[]; activities: Activity[] }>({ resources: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState(mode === "materials" ? "pdf" : "practica");

  useEffect(() => {
    let active = true;
    api.call<{ items: Course[] }>("/courses").then(r => {
      if (active) { setCourses(r.items); setCourseId(r.items[0]?.id ?? ""); }
    }).catch(e => { if (active) setError(String(e.message)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true); setError("");
    try { setItems(await api.call(`/learning?courseId=${encodeURIComponent(courseId)}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar el curso"); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (courseId && user?.role === "estudiante") {
      void api.call("/lms/course-access", { method: "POST", body: JSON.stringify({ courseId }) }).catch(() => undefined);
    }
  }, [courseId, user?.role]);

  async function publish(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.call(mode === "materials" ? "/materials" : "/activities", { method: "POST", body: JSON.stringify({ courseId, titulo: title, descripcion: description, tipo: type, ...(mode === "materials" ? { url } : {}) }) });
      setTitle(""); setDescription(""); setUrl(""); await load(); toast.success("Publicado");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error al publicar"); }
    finally { setSaving(false); }
  }
  async function openResource(id: string) {
    try {
      const { item } = await api.call<{ item: Resource }>(`/materials/${id}`);
      window.open(item.url, "_blank", "noopener,noreferrer");
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo abrir"); }
  }
  async function progress(id: string, estado: string) {
    setSaving(true);
    try { await api.call(`/activities/${id}/progress`, { method: "PATCH", body: JSON.stringify({ estado }) }); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo actualizar"); }
    finally { setSaving(false); }
  }
  const heading = mode === "materials" ? "Materiales educativos" : mode === "activities" ? "Actividades académicas" : "Mis cursos";
  return <PageSection icon={BookOpen} title={heading} description="Año lectivo 2026">
    <label className="block mb-4">Curso<select className={INPUT_CLASS} value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">Seleccione un curso</option>{courses.map(c => <option key={c.id} value={c.id}>{c.nombre || c.codigo}</option>)}</select></label>
    {error && <p role="alert">{error} <button onClick={() => void load()}>Reintentar</button></p>}
    {loading ? <p role="status">Cargando…</p> : !courses.length ? <p>No hay cursos asignados.</p> : <>
      {user?.role === "docente" && mode !== "courses" && courseId && <form className="grid gap-3 mb-6" onSubmit={publish}>
        <label>Título<input className={INPUT_CLASS} value={title} onChange={e => setTitle(e.target.value)} required minLength={2} maxLength={150} /></label>
        <label>Descripción<textarea className={INPUT_CLASS} value={description} onChange={e => setDescription(e.target.value)} maxLength={4000} /></label>
        <label>Tipo<select className={INPUT_CLASS} value={type} onChange={e => setType(e.target.value)}>{(mode === "materials" ? ["pdf", "documento", "presentacion", "enlace", "guia", "repaso"] : ["practica", "lectura", "repaso", "material_obligatorio", "otra"]).map(t => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}</select></label>
        {mode === "materials" && <label>URL del material<input className={INPUT_CLASS} type="url" value={url} onChange={e => setUrl(e.target.value)} required /></label>}
        <button className="btn-primary" disabled={saving}>{saving ? "Publicando…" : "Publicar"}</button>
      </form>}
      {mode !== "activities" && <div className="grid gap-4 sm:grid-cols-2">{items.resources.length ? items.resources.map(r => <article className="premium-card p-4" key={r.id}><h3>{r.titulo}</h3><p>{r.descripcion}</p><button className="btn-secondary mt-3" onClick={() => void openResource(r.id)}>Consultar {r.tipo}</button></article>) : <p>No hay materiales publicados.</p>}</div>}
      {mode !== "materials" && <div className="grid gap-4 sm:grid-cols-2 mt-4">{items.activities.length ? items.activities.map(a => {
        const status = a.progress[0]?.estado ?? "pendiente";
        return <article className="premium-card p-4" key={a.id}><h3>{a.titulo}</h3><p>{a.descripcion}</p>{user?.role === "estudiante" && <><p>Estado: {status}</p>{status !== "completada" && <button className="btn-secondary mt-3" disabled={saving} onClick={() => void progress(a.id, status === "pendiente" ? "iniciada" : "completada")}>{status === "pendiente" ? "Iniciar actividad" : "Marcar completada"}</button>}</>}</article>;
      }) : <p>No hay actividades publicadas.</p>}</div>}
    </>}
  </PageSection>;
}
