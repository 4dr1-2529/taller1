"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Correo inválido";
    if (!password) newErrors.password = "La contraseña es requerida";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Sesión iniciada correctamente");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              I.E.P. Huancayo - Perú
            </p>
            <h1 className="gradient-text text-xl font-bold">Tesis Dashboard</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Modelo predictivo de riesgo de deserción estudiantil.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm transition bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 ${errors.email ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-500"}`}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm transition bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 ${errors.password ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-500"}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ingresar
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Primera vez: configure el administrador con{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run db:bootstrap</code>
        </p>
      </div>
    </div>
  );
}
