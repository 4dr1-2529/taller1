"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BlenkirLogo } from "@/components/branding/BlenkirLogo";
import { validateEmail, VALIDATION_MSG } from "@/lib/validation";

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("director@blenkir.edu.pe");
  const [password, setPassword] = useState("Tesis2026!");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      window.location.replace("/");
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-orange)]" aria-label="Cargando" />
      </div>
    );
  }

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    const emailErr = validateEmail(email, true);
    if (emailErr) newErrors.email = emailErr;
    if (!password) newErrors.password = VALIDATION_MSG.required;
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Sesión iniciada correctamente");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, rgba(244,124,32,0.2), transparent 50%)",
            "radial-gradient(circle at 80% 30%, rgba(31,58,95,0.25), transparent 45%)",
            "radial-gradient(circle at 40% 80%, rgba(244,124,32,0.12), transparent 50%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Panel ilustración */}
      <motion.aside
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1f3a5f] via-[#162d4a] to-[#0f172a] p-12 text-white lg:flex"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#f47c20]/25 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-10 bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10">
          <BlenkirLogo size="lg" />
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-orange-200/90">
            Huancayo · Perú
          </p>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-slate-300">
            Plataforma inteligente de predicción de{" "}
            <span className="gradient-text font-semibold">riesgo de deserción</span> estudiantil
            basada en IA y análisis LMS.
          </p>
        </div>

        <motion.div
          className="relative z-10 grid gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {[
            { icon: Brain, label: "Modelo conjunto IA", desc: "Bosque aleatorio · XGBoost · Stacking" },
            { icon: Sparkles, label: "Predicción en tiempo real", desc: "Puntaje de riesgo 0–100" },
            { icon: Shield, label: "Panel institucional", desc: "Director, profesor y estudiante" },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <item.icon className="h-8 w-8 text-[#f47c20]" />
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.aside>

      {/* Formulario */}
      <motion.div
        className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="glass-card w-full max-w-md rounded-3xl p-8 md:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-[#f47c20] p-3 text-white shadow-lg">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Panel institucional
              </p>
              <h2 className="gradient-text text-lg font-bold">Acceso institucional</h2>
            </div>
          </div>

          <h2 className="hidden text-2xl font-bold text-[var(--text-primary)] lg:block">
            Iniciar sesión
          </h2>
          <p className="mt-2 hidden text-sm text-[var(--text-secondary)] lg:block">
            Ingrese sus credenciales del colegio para acceder al panel.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: undefined }));
                }}
                className={`input-premium ${errors.email ? "border-rose-500 ring-rose-500/30" : ""}`}
                placeholder="director@blenkir.edu.pe"
              />
              {errors.email ? <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={`input-premium pr-10 ${errors.password ? "border-rose-500 ring-rose-500/30" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>
              ) : null}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ingresar al panel
            </button>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(
                [
                  { label: "Director", email: "director@blenkir.edu.pe" },
                  { label: "Profesor", email: "profesor1@blenkir.edu.pe" },
                  { label: "Estudiante", email: "estudiante0001@blenkir.edu.pe" },
                ] as const
              ).map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword("Tesis2026!");
                    setErrors({});
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--accent-muted)] px-2 py-2 text-[10px] font-medium text-[var(--text-secondary)] hover:border-[var(--brand-orange)]/40 hover:text-[var(--text-primary)]"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Contraseña demo: <strong>Tesis2026!</strong>
            <br />
            También válido: <code className="font-mono text-[10px]">admin@iep-huancayo.edu.pe</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
