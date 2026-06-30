# Pruebas de aceptación — Director

**Credencial:** `director@blenkir.edu.pe` / `mbappe29` · **Rol API:** `admin`

---

## Checklist UAT (derivado de `ROLE_SECTIONS.admin` + rutas)

| # | Módulo UI | Componente | API verificada | Caso matriz | Evidencia |
|---|-----------|------------|----------------|-------------|-----------|
| 1 | Dashboard | `RoleDashboard` | `GET /dashboard/kpis` | TC-CN-02 | dashboard-director.png |
| 2 | Estudiantes | `StudentsView` | `GET /students` | TC-CN-03 | estudiantes-listado-director.png |
| 3 | Profesores | `TeachersView` | `GET /teachers` | TC-CN-04 | profesores-listado.png |
| 4 | Asignaciones | `TeacherAssignmentsView` | `GET /teacher-assignments` | TC-CN-10 | asignaciones-docentes.png |
| 5 | Cursos | `CoursesView` | `GET /courses` | TC-CN-05 | cursos-listado.png |
| 6 | Matrículas | `EnrollmentsView` | `GET /matriculas/stats` | TC-DB-06 | manual |
| 7 | Notas | `GradesView` | `GET /grades?periodoNumero=1` | TC-CN-06 | notas-bimestre-I.png |
| 8 | Predicción | `PredictionView` | `POST /predict` | TC-CN-07 | prediccion-resultado-riesgo.png |
| 9 | Historial | `PredictionHistoryView` | `GET /predictions` | TC-INT-02 | historial-predicciones.png |
| 10 | Alertas | `AlertsView` | `GET /alerts` | TC-CN-08 | alertas-listado.png |
| 11 | Reportes | `ReportsView` | export client-side | TC-CN-09 | reportes-vista-completa.png |
| 12 | Admin cuentas | — | `GET /admin/cuentas-acceso` | TC-BE-08 | cuentas-demo/ |

**Criterio aceptación:** 14 secciones visibles (TC-FE-03), 0 errores 401 en consola (TC-DASH-05 / smoke).
