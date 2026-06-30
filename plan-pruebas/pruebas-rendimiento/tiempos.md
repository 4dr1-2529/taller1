# Pruebas de rendimiento

Basado en optimizaciones documentadas en `docs/pruebas-no-funcionales.md` y código real.

---

## Tiempos de respuesta (`tiempos.md`)

| Operación | Implementación | Objetivo local | Caso |
|-----------|----------------|----------------|------|
| `GET /health` | Sin DB | < 100 ms | TC-PERF-01 |
| `GET /dashboard/kpis` | `dashboard-analytics.service.ts` consulta única | < 2 s | TC-PERF-02 |
| `GET /students?page=1&limit=100` | Paginación `listStudents` | < 3 s | TC-PERF-03 |
| `POST /predict` | ML :5000 + Prisma read | < 3 s | TC-INT-03 |
| Frontend FCP dashboard | Next.js + Recharts | < 4 s | manual DevTools |

---

## Carga (`carga.md`)

| Escenario | Concurrencia | Criterio | Herramienta |
|-----------|--------------|----------|-------------|
| Login simultáneo | 10 usuarios | 0 errores 5xx | Postman Runner / k6 |
| Listado estudiantes | 5 req/s | p95 < 3s | AB / manual |
| Predict paralelo | 3 req | ML 200 todas | smoke extendido |

---

## Stress (límite documentado)

- **Fuera de alcance v2.0:** >100 usuarios concurrentes (riesgo R-01 en `riesgos.md`)
- Límite mensajes LMS: **150 por sala** — `pruebas-no-funcionales.md` (código messages)

---

## Mediciones sugeridas

Registrar en `pruebas-rendimiento/evidencias/` con plantilla:

```
Endpoint: GET /dashboard/kpis
n=20, local, MySQL XAMPP
p50: ___ ms  p95: ___ ms
```
