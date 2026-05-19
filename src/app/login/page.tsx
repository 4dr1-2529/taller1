"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@iep-huancayo.edu.pe");
  const [password, setPassword] = useState("Tesis2026!");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Sesion iniciada");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              I.E.P. Huancayo - Peru
            </p>
            <h1 className="gradient-text text-xl font-bold">Tesis Dashboard</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Modelo predictivo de riesgo de desercion estudiantil.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-300">Correo</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900/50" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-300">Contrasena</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900/50" />
          </label>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ingresar
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Demo: admin@iep-huancayo.edu.pe / Tesis2026!</p>
      </div>
    </div>
  );
}
