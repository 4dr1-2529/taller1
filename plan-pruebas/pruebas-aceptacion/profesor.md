# Pruebas de aceptación — Profesor

**Credencial:** `pro50000001@blenkir.edu.pe` / `DEMO_PASSWORD` · **Rol:** `docente`

---

## Checklist UAT (`ROLE_SECTIONS.docente` — 10 secciones)

| # | Módulo | Componente | API | Caso | Evidencia |
|---|--------|------------|-----|------|-----------|
| 1 | Dashboard | `ProfessorDashboard` | `GET /profesor/dashboard` | TC-UAT-02 | dashboard-profesor.png |
| 2 | Estudiantes | `ProfessorStudentsView` | `GET /profesor/estudiantes` | TC-ROL-05 | profesor-estudiantes-ambito.png |
| 3 | Notas | `ProfessorGradesView` | `POST /profesor/notas` | TC-NOT-04 | notas-vista-profesor.png |
| 4 | Predicción | `ProfessorPredictionView` | `POST /profesor/predicciones` | TC-PRED-02 | prediccion-vista-profesor.png |
| 5 | Alertas | `ProfessorAlertsView` | `GET /profesor/alertas` | TC-CN-08 | — |
| 6 | Ámbito negativo | Curso ajeno | 403 | TC-ROL-03 | permissions.test |

**No debe ver:** Profesores, Asignaciones, Matrículas, Reportes (TC-FE-04).
