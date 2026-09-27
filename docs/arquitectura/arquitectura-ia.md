# Arquitectura — Capa Inteligencia Artificial

**Stack:** Python 3.11 · FastAPI · scikit-learn · XGBoost · joblib

---

## 1. Rol en el sistema

Microservicio de **inferencia y entrenamiento**. Estima la probabilidad de deserción (etiqueta binaria
`permanece` / `deserta`) con **7 variables** y la traduce a tres niveles de riesgo —bajo, medio, alto—
mediante los umbrales `0.41` y `0.65`.

---

## 2. Pipeline IA

```
MySQL (vía backend) → 7 variables → RF + XGBoost → Stacking → Meta-RF
    → best_model.joblib → /predict → Backend → Dashboard + Alertas
```

---

## 3. Modelos

| Modelo | Función |
|--------|---------|
| Random Forest | Base robusto, interpretable |
| XGBoost / HGB | Boosting, alta precisión tabular |
| Stacking + Meta-RF | Fusión ensemble (tesis) |

**Selección: únicamente por el mejor F1 sobre el conjunto de VALIDACIÓN**
(`selection=validation_f1_desercion`). **`holdout_used_for_selection=false`**: el holdout no participa en
ninguna decisión de selección y se reserva para la evaluación final del modelo elegido.

Modelo desplegado: **Stacking**, `modelVersion=BLENKIR_V6_BIN_20260924`,
`datasetVersion=BLENKIR_V6_SYNTH_20260924`, `dataMode=synthetic_scientific`,
`contractVersion=2026-v3`, `experimental=true`.

> **MODELO EXPERIMENTAL · DATOS CIENTÍFICO-SINTÉTICOS.** No representan todavía evidencia científica
> obtenida con estudiantes reales de la institución; los umbrales son operativos y no validados.

---

## 4. Endpoints ML

| Ruta | Uso |
|------|-----|
| `POST /predict` | Inferencia |
| `GET /metrics` | Accuracy, F1, matrices |
| `GET /health` | Estado del servicio |

---

## 5. Integración

- Backend `ml-client.ts` → `ML_SERVICE_URL`
- Frontend **no** llama ML directamente
- Resultados persistidos en tabla `prediction`

---

## 6. Referencias

- [Modelo predictivo detallado](../python-ia/modelo-predictivo.md)
- [Arquitectura general](arquitectura-general.md)
