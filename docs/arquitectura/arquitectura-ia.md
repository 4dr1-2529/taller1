# Arquitectura — Capa Inteligencia Artificial

**Stack:** Python 3.11 · FastAPI · scikit-learn · XGBoost · joblib

---

## 1. Rol en el sistema

Microservicio de **inferencia y entrenamiento** que clasifica el riesgo de deserción en tres niveles (bajo, medio, alto) usando ensemble learning.

---

## 2. Pipeline IA

```
MySQL (vía backend) → 10 features → RF + XGBoost → Stacking → Meta-RF
    → best_model.joblib → /predict → Backend → Dashboard + Alertas
```

---

## 3. Modelos

| Modelo | Función |
|--------|---------|
| Random Forest | Base robusto, interpretable |
| XGBoost / HGB | Boosting, alta precisión tabular |
| Stacking + Meta-RF | Fusión ensemble (tesis) |

Selección: **mayor F1-Score** en test set.

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
