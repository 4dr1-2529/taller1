# Pruebas de integración — IA ↔ Dashboard

Verifica que métricas ML y predicciones se reflejan en la UI.

---

## Componentes

| UI | Fuente datos |
|----|--------------|
| `PredictionView` | `POST /predict` + motor local |
| `MlMetricsSection` | `GET /ml/metrics` |
| `RiskGauge` | Score 0–100 |
| Alertas | Tabla `alert` post-predicción |

---

## Casos

| ID | Verificación |
|----|--------------|
| TC-DASH-04 | Gráficos Recharts + ML metrics |
| TC-PRED-04 | Historial predicciones |
| TC-IA-05 | Métricas F1 en panel IA |

---

## Evidencias

[docs/evidencias_finales/capturas/08-dashboard-ia/](../../docs/evidencias_finales/capturas/08-dashboard-ia/) · [docs/evidencias_finales/ia/](../../docs/evidencias_finales/ia/)
