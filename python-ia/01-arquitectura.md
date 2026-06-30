# Arquitectura del Módulo IA

## Vista general

![Arquitectura](./diagramas/01-arquitectura.png)

El módulo IA es un **servicio FastAPI independiente** (`machine-learning/`, puerto **5000**) consumido por el backend Express (`ML_SERVICE_URL`, default `http://localhost:5000`).

## Componentes implementados

| Componente | Ruta / archivo | Función |
|------------|----------------|---------|
| API ML | `app/main.py` | `/predict`, `/metrics`, `/health` |
| Entrenamiento | `train.py` | Genera datos, entrena, guarda joblib |
| Features | `app/features.py` | Vector 10D, factores, score |
| Validación | `utils/validators.py` | Rangos de entrada API |
| Cliente backend | `backend/src/services/ml-client.ts` | `predictWithMl()`, `buildMlPayload()` |
| Controlador | `backend/src/controllers/predict.controller.ts` | `POST /predict` con persistencia Prisma |

## Flujo de predicción en producción

1. Frontend → `POST /predict` (Express, JWT).
2. `predict.controller.ts` lee estudiante, notas, LMS desde MySQL vía Prisma.
3. `buildMlPayload()` arma JSON con las 10 variables.
4. `fetch(ML_SERVICE_URL/predict)` → FastAPI.
5. `build_feature_vector()` → `model.predict()` + `predict_proba()`.
6. Respuesta con `score`, `level`, `factors`, `recommendation` (+ campos tesis en español).
7. Si ML falla: `computeLocalRisk()` en backend o `heuristic_predict()` en FastAPI.

## Carga de modelos

```python
# app/main.py — lifespan
load_path = best_model.joblib if exists else stacking_model.joblib
model = joblib.load(load_path)
feature_names = joblib.load("features.joblib")
metrics = json.loads("metrics.json")
```

## Dependencias (`requirements.txt`)

- fastapi 0.115.6, uvicorn 0.34.0
- scikit-learn 1.6.1, xgboost 2.1.3
- joblib 1.4.2, numpy 2.2.1, pydantic 2.10.4

## Respaldo sin modelo

Si no existen archivos `.joblib`, `/predict` ejecuta `heuristic_predict()` (`main.py` L141–181) con reglas ponderadas sobre promedio, asistencia, LMS y estado.
