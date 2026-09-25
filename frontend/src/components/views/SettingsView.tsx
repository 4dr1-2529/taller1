"use client";
import { useEffect, useState } from "react";
import { KeyRound, Settings2, BellRing } from "lucide-react";
import { api } from "@/services/api";
import { validatePassword } from "@/lib/validation";
import { useAuth } from "@/contexts/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { INPUT_CLASS, SELECT_CLASS } from "@/lib/ui";

export function SettingsView() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState("medio");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user?.role === "admin") void api.call<{ nivelMinimoAlerta: string }>("/admin/settings")
      .then(r => setThreshold(r.nivelMinimoAlerta)).catch(e => setMessage(e.message));
  }, [user?.role]);
  async function save(path: string, body: object, method: string) {
    if (path === "/auth/change-password") {
      const pwdError = validatePassword(newPassword);
      if (!currentPassword) { setMessage("Ingrese su contraseña actual"); return; }
      if (pwdError) { setMessage(pwdError); return; }
    }
    setBusy(true); setMessage("");
    try { await api.call(path, { method, body: JSON.stringify(body) }); setMessage("Cambios guardados"); setCurrentPassword(""); setNewPassword(""); }
    catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <PageHeader
      icon={Settings2}
      eyebrow="Su cuenta"
      title="Preferencias de alertas y seguridad"
      description="Defina desde qué nivel de riesgo se generan las alertas institucionales y actualice el acceso a su cuenta."
    />
    {message ? (
      <p
        role="status"
        className={`rounded-[var(--radius-md)] border px-4 py-2.5 text-sm ${
          /guardados/i.test(message)
            ? "border-[var(--success)]/35 bg-[var(--success)]/10 text-[var(--success)]"
            : "border-[var(--danger)]/35 bg-[var(--danger)]/10 text-[var(--danger)]"
        }`}
      >
        {message}
      </p>
    ) : null}
    {user?.role === "admin" && <form className="premium-card space-y-4 rounded-[var(--radius-lg)] p-5 md:p-6" onSubmit={e => { e.preventDefault(); void save("/admin/settings", { nivelMinimoAlerta: threshold }, "PUT"); }}>
      <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]"><BellRing className="h-4 w-4 text-[var(--accent)]" aria-hidden /> Alertas institucionales · 2026</h3>
      <FormField label="Generar alertas desde el nivel">
        <select id="alert-threshold" value={threshold} onChange={e => setThreshold(e.target.value)} className={SELECT_CLASS}>
          <option value="medio">Medio (medio y alto)</option>
          <option value="alto">Alto (solo alto)</option>
        </select>
      </FormField>
      <button disabled={busy} className="btn-primary" type="submit">{busy ? "Guardando…" : "Guardar configuración"}</button>
    </form>}
    <form className="premium-card space-y-4 rounded-[var(--radius-lg)] p-5 md:p-6" onSubmit={e => { e.preventDefault(); void save("/auth/change-password", { currentPassword, newPassword }, "POST"); }}>
      <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]"><KeyRound className="h-4 w-4 text-[var(--accent)]" aria-hidden /> Cambiar contraseña</h3>
      <FormField label="Contraseña actual">
        <input id="current-password" className={INPUT_CLASS} type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      </FormField>
      <FormField label="Nueva contraseña" hint="Use al menos 8 caracteres, incluyendo mayúscula, minúscula y número.">
        <input id="new-password" className={INPUT_CLASS} type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </FormField>
      <button disabled={busy} className="btn-primary" type="submit">{busy ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  </div>;
}
