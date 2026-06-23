# Arquitectura — Capa Frontend

**Stack:** Next.js 16 · React 19 · Tailwind 4 · Vercel

---

## 1. Rol en el sistema

Capa de **presentación** con dashboards diferenciados por rol. Consume exclusivamente la API REST del backend.

---

## 2. Estructura App Router

```
/login          → (auth)/login/page.tsx
/               → (shell)/page.tsx + vistas por sección
```

---

## 3. Patrón por rol

| Rol | Dashboard | Servicio | Secciones |
|-----|-----------|----------|-----------|
| Director | `RoleDashboard` | `directorService` | 14 |
| Profesor | `ProfessorDashboard` | `profesorService` | 10 |
| Estudiante | `StudentDashboard` | `estudianteService` | 6 |

---

## 4. Flujo auth → vista

```
Login → AuthProvider → useAuthReady → ROLE_SECTIONS → AppSidebar → Vista
```

Regla crítica: **no llamar APIs hasta confirmar rol** (evita 401).

---

## 5. Integración API

- Variable: `NEXT_PUBLIC_API_URL`
- Cliente: `api.ts` + servicios por rol
- IA: vía `POST /predict` (backend orquesta ML)

---

## 6. Despliegue Vercel

- Build monorepo: `@tesis/shared` + `next build`
- URL: https://taller1-frontend.vercel.app

---

## 7. Referencias

- [Detalle técnico completo](../frontend/frontend-arquitectura.md)
- [Arquitectura general](arquitectura-general.md)
