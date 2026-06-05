# Arquitectura

## Visión general

Sistema web para **predicción de riesgo de deserción estudiantil** mediante ensemble learning (Random Forest, XGBoost/HGB, Stacking).

```
[Frontend Next.js :3029]
        │ JWT (role: admin | docente | estudiante)
        ▼
[Backend Express :4000] ──► [MySQL / Prisma]
        │
        ├── /profesor/*     → alcance docente (teacher-scope)
        ├── /estudiante/*   → alcance propio (estudiante-scope)
        └── /students, /grades, … → director (+ docente según ruta)
        │
        ▼
[ML FastAPI :5000] ──► models/*.joblib
```

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | Next.js 16, React 19, Tailwind 4 | Dashboards por rol, formularios, gráficos Recharts |
| API | Express, Prisma, Zod | Auth, RBAC, persistencia, orquestación ML |
| ML | FastAPI, scikit-learn | Entrenamiento, inferencia, métricas |
| Datos | MySQL (XAMPP) | Estudiantes, notas, alertas, mensajes, predicciones |

## Servicios frontend por rol

| Rol | Servicio | Endpoints |
|-----|----------|-----------|
| Director | `directorService` + `api` | Globales `/students`, `/grades`, … |
| Profesor | `profesorService` | `/profesor/*` |
| Estudiante | `estudianteService` | `/estudiante/*` (sin listados globales) |

## Flujo de predicción

1. Director o profesor ejecuta predicción con `studentId` en ámbito permitido.
2. Estudiante ejecuta `POST /estudiante/prediccion` (ID inferido del token).
3. Backend agrega métricas académicas + LMS.
4. Servicio ML devuelve score, probabilidad, nivel, factores.
5. Se guarda en `Prediction` y, si riesgo ≥ medio, se crea `Alert`.

## Seguridad

- JWT en cabecera `Authorization: Bearer`.
- Middleware `authenticate` + `authorize(roles)`.
- Alcance de datos:
  - `resolveStudentScope` — director / profesor / estudiante (legacy)
  - `requireStudentIdFromUser` + `rejectClientStudentId` — API estudiante
  - `getTeacherSectionIds` — API profesor

## Estructura monorepo

Ver [README.md](../README.md) y [backend/README.md](../backend/README.md).
