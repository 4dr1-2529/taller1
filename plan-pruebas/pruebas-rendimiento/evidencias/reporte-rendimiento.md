# Reporte de rendimiento (local)

**Fecha:** 2026-06-30T07:16:35.989Z

| Endpoint | Promedio (ms) | Mín | Máx |
|----------|---------------|-----|-----|
| login-director | 1836 | 1640 | 2165 |
| dashboard-kpis | 617 | 600 | 626 |
| students-list-limit100 | 520 | 457 | 640 |
| predictions-historial | 84 | 52 | 137 |
| predict-ia | 563 | 495 | 684 |
| teachers-list | 285 | 232 | 342 |
| alerts-list | 353 | 331 | 395 |
| health-api | 16 | 14 | 21 |
| ml-health | 40 | 14 | 68 |

## Umbrales

- Login: objetivo < 2000ms
- Dashboard KPIs: objetivo < 2000ms
- Predict IA: objetivo < 5000ms
