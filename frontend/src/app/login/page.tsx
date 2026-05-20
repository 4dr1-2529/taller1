"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Brain,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  BarChart3,
} from "lucide-react";
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
    <div className="relative flex min-h-screen overflow-hidden">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.25), transparent 50%)",
            "radial-gradient(circle at 80% 30%, rgba(6,182,212,0.2), transparent 45%)",
            "radial-gradient(circle at 40% 80%, rgba(168,85,247,0.2), transparent 50%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Panel ilustración */}
      <motion.aside
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-12 text-white lg:flex"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-10 bottom-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/40">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
                I.E.P. Huancayo · Perú
              </p>
              <h1 className="text-2xl font-bold">EduRisk AI</h1>
            </div>
          </div>
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
            { icon: Brain, label: "Ensemble ML", desc: "Random Forest · XGBoost · Stacking" },
            { icon: Sparkles, label: "Predicción en tiempo real", desc: "Score de riesgo 0–100" },
            { icon: Shield, label: "Panel institucional", desc: "Roles: admin, docente, tutoría" },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <item.icon className="h-8 w-8 text-cyan-400" />
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
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-3 text-white shadow-lg">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                EduRisk AI
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
                placeholder="correo@iep-huancayo.edu.pe"
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
          </form>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Primera vez: configure el administrador con{" "}
            <code className="rounded-md bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[10px]">
              npm run db:bootstrap
            </code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
