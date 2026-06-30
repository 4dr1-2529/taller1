# XGBoost — Modelo Implementado

## Ubicación

- Entrenamiento: `machine-learning/train.py` L120–143
- Artefacto: `models/xgboost_model.joblib`
- Flag: `HAS_XGBOOST` según import de `xgboost` (requirements: xgboost==2.1.3)

## Hiperparámetros XGBoost (cuando disponible)

```python
XGBClassifier(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    eval_metric="mlogloss",
)
```

| Parámetro | Valor |
|-----------|-------|
| `n_estimators` | 150 |
| `max_depth` | 6 |
| `learning_rate` | 0.1 |
| `eval_metric` | `"mlogloss"` (multiclase) |

## Fallback HistGradientBoosting

Si XGBoost falla por incompatibilidad sklearn (`except` L135–137) o no está instalado (`HAS_XGBOOST=False` L29–32):

```python
HistGradientBoostingClassifier(
    max_iter=150,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
)
```

En la última ejecución: `metrics.json` → `"model_used": "XGBoost"` y clave de métricas `"xgboost"`.

## Comparación RF vs XGBoost en el proyecto

| Aspecto | Random Forest | XGBoost |
|---------|---------------|---------|
| Tipo | Bagging | Boosting |
| `max_depth` | 12 | 6 |
| Estimadores | 150 árboles | 150 rounds |
| En stacking | Sí (estimador `rf`) | **No** — stacking usa HGB |
| Artefacto | `random_forest_model.joblib` | `xgboost_model.joblib` |

**Nota de implementación:** El `StackingClassifier` (L146–147) combina **RF + HistGradientBoosting**, no RF + XGBoost. XGBoost se entrena y evalúa en paralelo como tercer candidato independiente.

## Métricas test (`metrics.json`)

| Métrica | xgboost |
|---------|---------|
| Accuracy | 1.0000 |
| Precision | 1.0000 |
| Recall | 1.0000 |
| F1-score | 1.0000 |

Misma matriz de confusión monoclasse que RF (500× clase 0).

## Selección del mejor modelo

Criterio: **F1-score ponderado máximo** entre `random_forest`, `xgboost`, `stacking` (L168). Empate actual en F1=1.0; gana `random_forest` por orden de `max()` sobre dict.
