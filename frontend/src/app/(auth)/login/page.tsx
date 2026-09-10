"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Brain,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BlenkirLogo } from "@/components/branding/BlenkirLogo";
import { validateEmail, VALIDATION_MSG } from "@/lib/validation";

export default function LoginPage() {
  const reduced = useReducedMotion();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="login-page">
      <div className="login-theme"><ThemeToggle /></div>
      <motion.aside className="login-brand"
        initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? 0 : 0.3 }}>
        <div className="login-brand__top">
          <BlenkirLogo size="lg" />
          <span className="login-brand__eyebrow">INTELIGENCIA ACADÉMICA</span>
        </div>
        <div className="login-brand__story">
          <p className="login-kicker">Educación que mira hacia adelante</p>
          <h1>Entender el presente.<br /><span>Acompañar el futuro.</span></h1>
          <p>Una visión conectada del aprendizaje para acompañar a nuestra comunidad educativa.</p>
          <div className="login-visual" aria-hidden>
            <div className="login-visual__line" />
            {[GraduationCap, Brain, Shield].map((Icon, i) => (
              <div className="login-visual__node" key={i}><Icon /><span>{["Aprendizaje", "Análisis", "Acompañamiento"][i]}</span></div>
            ))}
          </div>
        </div>
        <div className="login-capabilities">
          {[
            { icon: GraduationCap, label: "Seguimiento académico", desc: "Rendimiento, asistencia y actividad LMS." },
            { icon: Brain, label: "Análisis de riesgo", desc: "Información para orientar el acompañamiento." },
            { icon: Shield, label: "Una comunidad conectada", desc: "Un espacio para directores, docentes y estudiantes." },
          ].map((item) => <div key={item.label} className="login-capability">
            <item.icon aria-hidden />
            <div><h2>{item.label}</h2><p>{item.desc}</p></div>
          </div>)}
        </div>
        <p className="login-brand__footer">COLEGIO BLENKIR <span>Huancayo · Perú</span></p>
      </motion.aside>
      <motion.main className="login-access"
        initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.08 }}>
        <div className="login-mobile-brand"><BlenkirLogo size="md" /></div>
        <div className="login-form-card">
          <span className="login-form-mark"><GraduationCap aria-hidden /></span>
          <p className="login-kicker">TU ESPACIO ACADÉMICO</p>
          <h2>Bienvenido de nuevo</h2>
          <p className="login-form-intro">Inicia sesión con tu cuenta del colegio para continuar.</p>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold">Correo electrónico</label>
              <input id="login-email" type="email" required autoComplete="username"
                value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`input-premium ${errors.email ? "border-rose-500 ring-rose-500/30" : ""}`}
                placeholder="correo@blenkir.edu.pe" />
              {errors.email ? <p id="login-email-error" className="mt-2 text-xs text-[var(--danger)]">{errors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold">Contraseña</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? "text" : "password"} required minLength={6} autoComplete="current-password"
                  value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  aria-invalid={!!errors.password} aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={`input-premium pr-14 ${errors.password ? "border-rose-500 ring-rose-500/30" : ""}`}
                  placeholder="Ingresa tu contraseña" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password ? <p id="login-password-error" className="mt-2 text-xs text-[var(--danger)]">{errors.password}</p> : null}
            </div>
            <button type="submit" disabled={loading} className="btn-primary login-submit">
              {loading ? <Loader2 className="h-4 w-4" /> : null}
              Ingresar al panel
            </button>
          </form>
          <div className="login-form-footer"><Shield className="h-4 w-4" aria-hidden /><span>Acceso institucional · Colegio Blenkir</span></div>
        </div>
        <p className="login-access__footer">Tecnología al servicio del aprendizaje.</p>
      </motion.main>
    </div>
  );
}
