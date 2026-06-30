# Pruebas de integración — Backend ↔ IA

**ML:** FastAPI :5000 · **Proxy:** `POST /api/v1/predict`

---

## Flujo

1. Backend recibe `studentId` + JWT
2. Carga métricas desde Prisma
3. Llama FastAPI `/predict` o motor local
4. Persiste en tabla `prediction`
5. Opcional: crea alerta si riesgo medio/alto

---

## Casos

| ID | Verificación |
|----|--------------|
| TC-IA-04 | Health ML 200 |
| TC-IA-06 | POST predict + persistencia |
| TC-PRED-01 | UI muestra resultado servidor |

---

## Evidencias

[docs/evidencias_finales/capturas/07-prediccion/prediccion-resultado-riesgo.png](../../docs/evidencias_finales/capturas/07-prediccion/prediccion-resultado-riesgo.png)
