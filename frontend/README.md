# Frontend (Next.js 16)

Aplicación web del **Tesis Dashboard** — dashboards por rol, validaciones en formularios y consumo de API REST.

## Producción

| Entorno | URL |
|---------|-----|
| App | https://taller1-frontend.vercel.app |
| API | https://taller1-production.up.railway.app/api/v1 |

Variable Vercel: `NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1`

## Requisitos

- Node.js 20+
- Backend API en `http://localhost:4000/api/v1` (desarrollo)

## Configuración

```bash
# Desde tesis-dashboard/frontend/
cp .env.example .env.local
```

```env
# Local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Producción
# NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1
```

## Desarrollo

Desde la raíz del monorepo:

```bash
npm run dev:web
# o
npm run dev --workspace=frontend
```

Puerto: **http://localhost:3029**

```bash
npm run type-check
npm run lint
npm run build
```

## Estructura (`src/`)

```
app/                    # App Router (login, dashboard principal)
components/
  student/              # Vistas rol Estudiante (solo datos propios)
  views/                # Vistas Director / Profesor
  professor/            # Filtros y barras del docente
services/
  api.ts                # Cliente HTTP base
  directorService.ts    # Endpoints director
  profesorService.ts    # Endpoints /profesor/*
  estudianteService.ts  # Endpoints /estudiante/*
hooks/
  useAuthReady.ts       # Espera rol confirmado antes de llamar APIs
  useAcademicData.ts    # Datos académicos según rol
  useAcademicStructure.ts
  useProfessorStructure.ts
constants/estudiante.ts # Mensajes UX del estudiante
```

## Auth y carga por rol

El frontend **no llama APIs de un rol hasta confirmar la sesión**:

1. `AuthProvider` restaura token y usuario desde `localStorage` / `GET /auth/me`
2. `useAuthReady()` expone `ready = !loading && user && role`
3. Hooks y dashboards esperan `ready` + rol correcto (`isAdmin`, `isDocente`, `isEstudiante`)

Esto evita 401 al entrar como Director, Profesor o Estudiante (sin necesidad de F5).

| Hook / componente | Comportamiento |
|-------------------|----------------|
| `useAcademicStructure` | Solo admin/docente; estudiante no llama `/secciones` |
| `useAcademicData` | Carga según rol; espera `user.role` |
| `ProfessorDashboard` | Solo si `isDocente` |
| `StudentDashboard` y vistas `/student/*` | Solo si `isEstudiante` |

## Menú por rol

| Rol UI | Secciones visibles |
|--------|-------------------|
| **Director** | Dashboard, Estudiantes, Profesores, Cursos, Matrículas, Notas, Asistencia, LMS, Predicción, Historial, Alertas, Mensajería, Reportes |
| **Profesor** | Dashboard, Estudiantes (sus salones), Cursos, Notas, Asistencia, LMS, Predicción, Historial, Alertas, Mensajería |
| **Estudiante** | Dashboard, Mis notas, Mi asistencia, Mi actividad LMS, Mi riesgo, Mensajería |

El estudiante **no** carga listados globales ni filtros de grado/sección; usa exclusivamente `estudianteService`.

## Credenciales demo

Contraseña: `Tesis2026!`

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor | `profesor1@blenkir.edu.pe` |
| Estudiante | `estudiante0001@blenkir.edu.pe` |

Ver [../README.md](../README.md) y [../docs/DEPLOY.md](../docs/DEPLOY.md) para seed y despliegue.
