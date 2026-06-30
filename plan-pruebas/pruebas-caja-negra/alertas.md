# Pruebas caja negra — Alertas

**Vistas:** `AlertsView` (admin), `ProfessorAlertsView` (docente), `StudentPredictionView` alertas

---

## API real

| Endpoint | Rol | Controlador |
|----------|-----|-------------|
| `GET /alerts` | admin, docente | `listAlerts` |
| `PATCH /alerts/:id` | admin, docente | `patchAlertStatus` — estados: `nueva`, `en_seguimiento`, `resuelta` |
| `GET /profesor/alertas` | docente | `profesorAlertas` |
| `GET /estudiante/alertas` | estudiante | solo lectura propias |

---

## Casos

| ID | Escenario | Resultado | Evidencia |
|----|-----------|-----------|-----------|
| TC-CN-08 | Director lista alertas | Tabla con `level`, `status`, estudiante | `alertas-listado.png` |
| TC-CB-03 | PATCH status `cerrada` | 400 Zod — solo 3 estados válidos | `alertStatusSchema` test |
| TC-INT-03 | Predicción riesgo alto | `alertCreated: true` en `PredictionView` toast | predicción servidor |

---

## Tipos (`api.ts`)

```typescript
Alert.status: "nueva" | "en_seguimiento" | "resuelta"
Alert.level: "bajo" | "medio" | "alto"
```
