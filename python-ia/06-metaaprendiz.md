# Meta-aprendiz (Meta-estimador)

## Definición en el proyecto

El meta-aprendiz es el **`final_estimator`** del `StackingClassifier` en `train.py` L148–154:

```python
final_estimator=RandomForestClassifier(
    n_estimators=100,
    max_depth=6,
    min_samples_leaf=1,
    max_features="sqrt",
    random_state=42,
)
```

## Función

| Entrada del meta-aprendiz | Origen |
|---------------------------|--------|
| Predicciones OOF de `rf` | CV 3-fold sobre `X_train` |
| Predicciones OOF de `hgb` | CV 3-fold sobre `X_train` |

Con `passthrough=False`, **no** recibe las 10 features originales — solo las salidas de los estimadores base (probabilidades o clases según configuración sklearn 1.6).

## Hiperparámetros del meta-RF

| Parámetro | Valor | vs RF base |
|-----------|-------|------------|
| `n_estimators` | 100 | Base: 150 |
| `max_depth` | 6 | Base: 12 |
| `class_weight` | default | Base: balanced |

El meta-aprendiz es un RF **más shallow** (depth 6) con menos árboles (100), diseñado para combinar señales de RF y HGB.

## Salida

- Clase predicha: `0`, `1` o `2`
- Mapeo: `LEVEL_MAP` → `bajo`, `medio`, `alto`
- Probabilidades: `predict_proba()` → `proba_to_score()` con pesos `[15, 50, 90]`

## Diagrama

![Stacking y meta-aprendiz](./diagramas/03-stacking-metaaprendiz.png)

## Estado con datos actuales

Con dataset sintético 100% clase 0, los estimadores base y el meta-aprendiz convergen a predecir siempre `0`. Las métricas F1=1.0 reflejan clasificación trivial, no poder discriminativo entre niveles de riesgo.

Detalle: [10-metricas.md](./10-metricas.md) y `datos/analysis_report.json`.
