# Random Forest — Modelo Implementado

## Ubicación

- Entrenamiento: `machine-learning/train.py` → `make_rf()` L101–108
- Artefacto: `models/random_forest_model.joblib`
- Selección actual: **best_model** según `metrics.json` (`best_model: "random_forest"`)

## Hiperparámetros (código real)

```python
RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_leaf=1,
    max_features="sqrt",
    random_state=42,
    class_weight="balanced",
)
```

| Parámetro | Valor | Efecto en proyecto |
|-----------|-------|-------------------|
| `n_estimators` | 150 | 150 árboles de decisión |
| `max_depth` | 12 | Profundidad máxima por árbol |
| `min_samples_leaf` | 1 | Hojas sin mínimo forzado |
| `max_features` | `"sqrt"` | √10 ≈ 3 features por split |
| `class_weight` | `"balanced"` | Peso inverso a frecuencia de clase |
| `random_state` | 42 | Reproducibilidad |

## Rol en el sistema

1. **Modelo base evaluado** — métricas propias en `metrics.json` → clave `random_forest`.
2. **Estimador base del stacking** — `("rf", make_rf())` en `StackingClassifier` L147.
3. **Meta-aprendiz del stacking** — `final_estimator=RandomForestClassifier(...)` L148–154.

## Métricas en test (última ejecución)

| Métrica | Valor |
|---------|-------|
| Accuracy | 1.0000 |
| Precision (weighted) | 1.0000 |
| Recall (weighted) | 1.0000 |
| F1-score (weighted) | 1.0000 |
| AUC OvR weighted | 1.0000 |
| AUC OvR macro | 1.0000 |

## Matriz de confusión

Test n=500 — diagonal perfecta (167/166/167). Ver [10-metricas.md](./10-metricas.md).

## Feature importance

Importancias Gini no nulas tras entrenamiento estratificado. Ver `diagramas/07-feature-importance.png`.

## Inferencia

```python
pred = int(model.predict(features)[0])   # main.py L201
proba = model.predict_proba(features)[0]  # L202
```

`LEVEL_MAP = {0: "bajo", 1: "medio", 2: "alto"}` en `features.py` L22.
