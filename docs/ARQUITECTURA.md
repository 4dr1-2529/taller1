# Arquitectura

## Visión general

Sistema web para **predicción de riesgo de deserción estudiantil** mediante ensemble learning (Random Forest, XGBoost/HGB, Stacking).

### Desarrollo local

```
[Frontend Next.js :3029]
        │ JWT (role: admin | docente | estudiante)
        ▼
[Backend Express :4000] ──► [MySQL XAMPP :3306 / Prisma]
        │
        ├── /profesor/*     → alcance docente (teacher-scope)
        ├── /estudiante/*   → alcance propio (estudiante-scope)
        └── /students, /grades, … → director (+ docente según ruta)
        │
        ▼
[ML FastAPI :5000] ──► models/*.joblib
```

### Producción (Vercel + Railway)

```
[Vercel — Next.js]
  NEXT_PUBLIC_API_URL
        │ JWT Bearer + useAuthReady (rol confirmado)
        ▼
[Railway — Express + Prisma]
  railway-start.mjs → migrate deploy → API
  CORS ← taller1-frontend.vercel.app
        │
        ▼
[Railway — MySQL 8]
  seed: db:seed + db:seed:demo
```

URLs: [DEPLOY.md](DEPLOY.md)

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | Next.js 16, React 19, Tailwind 4 | Dashboards por rol, formularios, gráficos Recharts |
| API | Express, Prisma, Zod | Auth, RBAC, persistencia, orquestación ML |
| ML | FastAPI, scikit-learn | Entrenamiento, inferencia, métricas (local; opcional en nube) |
| Datos | MySQL (XAMPP / Railway) | Estudiantes, matrículas, notas, alertas, mensajes, predicciones |

## Servicios frontend por rol

| Rol | Servicio | Endpoints |
|-----|----------|-----------|
| Director | `directorService` + `api` | Globales `/students`, `/grades`, `/matriculas`, … |
| Profesor | `profesorService` | `/profesor/*` |
| Estudiante | `estudianteService` | `/estudiante/*` (sin listados globales) |

### Carga segura (v2.0.1)

Los hooks del frontend esperan `useAuthReady()` antes de invocar APIs:

- Evita llamar `/secciones` (director) con token de profesor o estudiante
- Evita `fetchAllStudents` antes de conocer el rol
- Dashboards de profesor/estudiante montan fetch solo con rol confirmado

## Flujo de predicción

1. Director o profesor ejecuta predicción con `studentId` en ámbito permitido.
2. Estudiante ejecuta `POST /estudiante/prediccion` (ID inferido del token).
3. Backend agrega métricas académicas + LMS.
4. Servicio ML devuelve score, probabilidad, nivel, factores.
5. Se guarda en `Prediction` y, si riesgo ≥ medio, se crea `Alert`.

## Seguridad

- JWT en cabecera `Authorization: Bearer`.
- Refresh token hasheado (SHA-256) en tabla `sesion`.
- Middleware `authenticate` + `authorize(roles)`.
- Alcance de datos:
  - `resolveStudentScope` — director / profesor / estudiante (legacy)
  - `requireStudentIdFromUser` + `rejectClientStudentId` — API estudiante
  - `getTeacherSectionIds` — API profesor
- CORS y `JWT_SECRET` validados en `config/env.ts`.

## Estructura monorepo

Ver [README.md](../README.md) · [backend/README.md](../backend/README.md) · [frontend/README.md](../frontend/README.md)
