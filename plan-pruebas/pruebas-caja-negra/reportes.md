# Pruebas caja negra — Reportes

**Vista:** `ReportsView` · **Export:** `frontend/src/lib/export-reports.ts`

---

## 4 exportaciones reales (botones en UI)

| Botón UI | Función | Formato | Caso |
|----------|---------|---------|------|
| Excel — estudiantes y riesgo | `exportStudentsToExcel(withPred)` | .xlsx | TC-CN-09 |
| PDF — riesgo por curso (salón) | `exportCourseRiskPdf(courseRiskRows, ...)` | .pdf | reporte-pdf-riesgo-curso.png |
| PDF — desaprobados por curso | `exportFailsByCoursePdf(fails)` | .pdf | reporte-pdf-desaprobados.png |
| Excel — baja actividad LMS | `exportLowLmsExcel(lowLms)` | .xlsx | reporte-excel-lms-bajo.png |

**Datos:** `attachPredictions(students)`, `failCountByCourse(students, courses, 11)`, `lowLmsStudents(students, 45)`.

---

## API backend reportes

| Ruta | Rol | Nota |
|------|-----|------|
| `GET /reports` | auth | listReports |
| `POST /reports` | admin, docente | createReport |
| `DELETE /reports/:id` | admin | deleteReport |

Estudiante: sin acceso crear reporte — TC-REP-04 / RBAC.

---

## Evidencia

`reportes-vista-completa.png` — los 4 botones visibles en grid `ReportsView`.
