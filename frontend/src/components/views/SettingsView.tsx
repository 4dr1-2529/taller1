"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";

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
    setBusy(true); setMessage("");
    try { await api.call(path, { method, body: JSON.stringify(body) }); setMessage("Cambios guardados"); setCurrentPassword(""); setNewPassword(""); }
    catch (e) { setMessage(e instanceof Error ? e.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <p role="status">{message}</p>
    {user?.role === "admin" && <form className="premium-card space-y-4 p-6" onSubmit={e => { e.preventDefault(); void save("/admin/settings", { nivelMinimoAlerta: threshold }, "PUT"); }}>
      <h2 className="text-lg font-semibold">Configuración institucional · 2026</h2>
      <label className="block">Generar alertas desde el nivel <select value={threshold} onChange={e => setThreshold(e.target.value)} className="premium-input"><option value="medio">Medio</option><option value="alto">Alto</option></select></label>
      <button disabled={busy} className="premium-button" type="submit">Guardar configuración</button>
    </form>}
    <form className="premium-card space-y-4 p-6" onSubmit={e => { e.preventDefault(); void save("/auth/change-password", { currentPassword, newPassword }, "POST"); }}>
      <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
      <label className="block">Contraseña actual<input className="premium-input" type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
      <label className="block">Nueva contraseña<input className="premium-input" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
      <p className="text-sm">Use mayúsculas, minúsculas, números y un símbolo.</p>
      <button disabled={busy} className="premium-button" type="submit">Cambiar contraseña</button>
    </form>
  </div>;
}
