# Auditoría funcional Blenkir 2026

Rama auditada: `audit/full-functional-review` sobre `main = bc04e46`. Fecha: 2026-09-21.
Método: lectura directa de código (sin asumir por nombres), respaldada por suites verdes
(integración 30/30, backend 27+32, frontend 10/10, ML 7/7, typecheck, lint, builds).

## 1. Arquitectura verificada

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind 4 + Framer Motion + Recharts + jsPDF + jspdf-autotable + xlsx + sonner | Funcional, build OK |
| Backend | Node 20+ + Express 4 + TypeScript + Prisma 6 + JWT (access+refresh) + bcryptjs + helmet + rate-limit + xss | Funcional, build OK |
| BD | MySQL 8 + Prisma (57 modelos) | Migraciones al día, sin resets |
| ML | Python 3.12 + FastAPI + scikit-learn + XGBoost/HGB + Stacking | Servicio válido, **sin modelo compatible desplegado** → 503 controlado |
| Deploy | Vercel + Railway | CI verificado; configuración revisada; deployments Online; smoke /health y /login OK. PENDIENTE DE EVIDENCIA: navegación por roles, operaciones reales frontend-backend, verificación visual |
| Compartido | `@tesis/shared` (validaciones de texto) | OK |

## 2. Módulos y estado real

### Institución y administración — COMPLETO
Auth login/logout/refresh (`auth.controller`), cambio de contraseña (regla 8+mayúscula+minúscula+número
alineada frontend/backend), sesiones revocables, auditoría (`AuditLog` con entidad/acción/usuario/estudiante/IP),
configuración institucional (`SystemConfig`: nombre, año, umbral de alertas), estructura académica
(niveles/grados/secciones/año 2026/4 periodos) con vistas dinámicas desde API.

### Personas — COMPLETO
Estudiante (código EST-xxx por correlativo transaccional, DNI/email únicos, usuario vinculado),
Profesor (PROF-xxx, cuenta opcional, desactivación lógica con bloqueo si tiene asignaciones),
roles admin/docente/estudiante + permisos. Apoderado existe en schema con relación, sin UI dedicada
(alcance aceptado: fuera del flujo principal).

### Matrícula 2026 — COMPLETO
Unicidad `estudianteId + anioLectivoId` a nivel BD + rechazo en servicio. Flujo transaccional:
validar → DNI/email duplicado → sección activa → capacidad → código EST → usuario → estudiante →
matrícula MAT-2026-xxx → inscripciones automáticas en cursos de la sección → auditoría, con rollback total.
Retiro/traslado: cambio de estado (nunca borrado físico), retira inscripciones, preserva historial.
No se crea segunda matrícula 2026 aunque la anterior esté retirada/trasladada (unique bloquea).

### Académico — COMPLETO
Catálogo → curso-grado → oferta por sección → asignación docente (tutor/curso). Notas 0–20 por
curso/periodo con upsert y `refreshAcademicSummary` (promedio y cursos_desaprobados derivados).
Asistencia presente/ausente/tardanza/justificada por estudiante+fecha; porcentaje derivado excluyendo
justificadas. Materiales (6 tipos) y actividades (5 tipos) por curso con progreso pendiente/iniciada/completada.

### LMS — COMPLETO
Eventos reales: login, curso, recurso, actividad (con duración). Indicadores derivados en ventana 28 días
(`lms.service.ts`): frecuencia, horas, actividades completadas, recursos distintos, días activos.
Cero métricas manuales; vector ML de 7 variables.

### ML y predicción — FUNCIONA CON OBSERVACIONES (bloqueado por modelo)
Contrato request/response correcto y validado; `predict()` exige datos académicos suficientes;
sin modelo → 503 sin fallback ficticio (verificado en tests, incluido error interno → 503).
Predicción persiste con snapshot de features, factores, recomendación y fecha; alerta se genera
según umbral configurable y se deduplica; historial preservado. **No existe artefacto compatible
en `machine-learning/models/`** (solo README; legacy archivado). Métricas UI con estado profesional.

### Comunicación — COMPLETO (VERIFICADO / HEREDADO DE HARDENING PREVIO en Fase 4)
Director↔Profesor y Profesor↔Estudiante (solo con curso activo compartido 2026 + matrícula activa)
permitidos; Director↔Estudiante bloqueado con 403 en backend (incluye rooms forjados).
Avisos separados: global (Director) y curso (Profesor), solo lectura, sin respuestas.
Lecturas registradas. `messages.controller.ts` no fue modificado en `e04887f` (confirmado por git).

### Cursos y asignación — COMPLETO (endurecido Fase 4)
`TeacherCourseAssignment` + `syncCourseOffering()` fuente de verdad; `PUT /courses/:id` rechaza
`profesorId`/`seccionId`; reasignación solo por `POST /courses/:id/reassign` (coherencia
Course↔Assignment, conserva Enrollment y notas, anterior 403 / nuevo 200). `PUT /teachers/:id`
con `activo:false` aplica la misma regla 409 que DELETE ante asignaciones activas.

### Reportes — COMPLETO
Excel/PDF de estudiantes-riesgo, riesgo por curso, desaprobados, baja LMS; exportaciones usan
"Sin predicción" cuando no hay Prediction; dashboard con KPIs reales o "—"/"Sin datos".

## 3. Hallazgos cerrados en hardening previo (verificados, no reabrir sin evidencia)
GET /teachers solo admin; lectura de notas acotada a cursos propios del docente; estudiante
sin POST de predicción; reports/snapshot/recommendations con authorize; roster y rooms solo con
relaciones activas 2026; formularios con anti-doble-submit y preservación en error; contraseña
unificada; agregados sin ficción (null, no 0); dashboard-snapshot POST solo admin.

## 4. Pendientes reales (el Data Seed V2 permanece pospuesto hasta concluir auditoría, UI/UX, QA y docs)
1. Barrido visual interactivo por rol × viewport (sin navegador conectado en este entorno).
2. Despliegue del servicio ML cuando exista dataset autorizado (fuera de alcance: prohibido entrenar).
3. Data Seed v2 (fase posterior autorizada).
4. Limpieza opcional: rama remota `origin/fix/final-hardening-pre-seed` (huérfana, sin efecto).
