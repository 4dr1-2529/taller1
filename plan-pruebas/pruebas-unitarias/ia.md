# Pruebas unitarias — Modelo IA

**Comando:** `npm run ml:test` · **Archivo:** `machine-learning/tests/test_predict.py`

---

## Suite pytest (7 tests reales)

| Test | Función bajo prueba | Entrada código | Assert |
|------|---------------------|----------------|--------|
| `test_heuristic_low_risk` | `heuristic_predict(_normalize_input(...))` | promedio 16, asistencia 95, tareas_ratio 0.95, estado activo | `level == "bajo"`, score 0–100 |
| `test_heuristic_high_risk` | `heuristic_predict` | promedio 8, asistencia 60, cursos_desaprobados 4, estado retirado | `level in ("medio", "alto")` |
| `test_feature_vector_shape` | `build_feature_vector` | dict métricas académicas | `shape == (1, 10)` — `FEATURE_NAMES` en `app/features.py` |
| `test_proba_to_score` | `proba_to_score` | proba [0.1, 0.2, 0.7] | score ≥ 60 |
| `test_validate_with_null_optional_fields` | `validate_predict_payload` | campos None en opcionales | imputa desde `actividad_lms_prom` |
| `test_predict_endpoint_payload` | `predict(PredictInput)` | payload completo activo | `level in (bajo,medio,alto)`, `probabilidad_abandono` not None |

---

## Entrenamiento (`train.py`)

| Artefacto | Ruta | Verificación |
|-----------|------|--------------|
| `best_model.joblib` | `machine-learning/models/` | TC-IA-01 |
| `metrics.json` | mismos modelos RF, XGB, Stacking | `MlMetricsSection` frontend |
| `StackingClassifier` | meta RandomForest | pipeline diagrama arquitectura |

---

## API FastAPI (`app/main.py`)

| Endpoint | Método | Smoke test |
|----------|--------|------------|
| `/health` | GET | TC-IA-07 |
| `/predict` | POST JSON métricas | TC-IA-08 — valida `nivel_riesgo`, `probabilidad_abandono` |

---

## Formato tesis (Node)

`backend/tests/prediction-format.test.mjs` — `npm run test:unit` valida mapeo a español usado por backend al responder `POST /api/v1/predict`.
