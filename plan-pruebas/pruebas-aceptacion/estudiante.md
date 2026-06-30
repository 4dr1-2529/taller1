# Pruebas de aceptación — Alumno

**Credencial:** `mateo.quispe0001@blenkir.edu.pe` / `mbappe29` · **Rol:** `estudiante`

---

## Checklist UAT (`ROLE_SECTIONS.estudiante` — 6 secciones)

| # | Módulo UI | Label estudiante | API | Caso | Evidencia |
|---|-----------|------------------|-----|------|-----------|
| 1 | Dashboard | Dashboard | `GET /estudiante/dashboard` | TC-UAT-03 | dashboard-alumno.png |
| 2 | Notas | Mis notas | `GET /estudiante/notas` | TC-ROL-04 | alumno-mis-notas.png |
| 3 | Predicción | Mi riesgo | `GET/POST /estudiante/prediccion` | TC-PRED-03 | alumno-mi-riesgo.png |
| 4 | Seguridad | — | `GET /students` → 403 | TC-SEC-04 | roles-estudiante.test |
| 5 | Seguridad | — | `?studentId=otro` → 403 | TC-SEC-05 | estudiante-scope.test |

**Componentes:** `StudentDashboard`, `StudentGradesView`, `StudentPredictionView` — sin CRUD global.
