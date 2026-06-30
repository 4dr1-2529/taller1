# Pruebas caja negra — Notas

**Vistas:** `GradesView` (admin), `ProfessorGradesView` (docente), `StudentGradesView` (estudiante)

---

## API

| Rol | Método | Ruta |
|-----|--------|------|
| admin/docente | GET/POST/DELETE | `/grades` |
| docente | GET/POST | `/profesor/notas` |
| estudiante | GET | `/estudiante/notas` (solo propias) |

**Validación:** `gradeSchema` — nota 0–20 (`schemas.test.ts` nota 25 → fail).

---

## Casos

| ID | Acción | Resultado | Evidencia |
|----|--------|-----------|-----------|
| TC-CN-06 | Filtro grado+sección+bimestre I | Notas listadas | notas-bimestre-I.png |
| — | Bimestre II | Cambio select bimestre | notas-bimestre-II.png |
| TC-CB-04 | Promedio estado | 16→Aprobado, 12→En riesgo, 9→Desaprobado | `notaEstadoLabel` test |
| TC-NOT-02 | Filtros incompletos UI | "—" sin NaN | GradesView.tsx |
| TC-NOT-05 | Demo seed | 0 sin notas I–II | validate-demo-data |

---

## Proceso completo

Selección cascada `AcademicFiltersBar`: Grado → Sección → Curso → Bimestre — `notas-proceso-completo.png`
