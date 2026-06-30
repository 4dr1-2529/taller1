# Pruebas caja blanca — Servicios

Lógica de negocio en `backend/src/services/`.

---

## Servicios clave

| Servicio | Función |
|----------|---------|
| `dashboard-analytics.service.ts` | KPIs agregados |
| `profesor-dashboard.service.ts` | Ámbito docente |
| `teacher-assignment.service.ts` | Tutoría y polidocencia |
| `prediction.service.ts` | Orquestación ML local/remoto |

---

## Integración Prisma

- Transacciones en operaciones multi-tabla
- Filtros por `teacherId` / `seccionId` en scope profesor
- Validación demo: `validate-demo-data.mjs`

---

## Tests

`teacher-scope.test.ts`, `estudiante-scope.test.ts`
