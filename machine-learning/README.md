# Machine Learning Service

Servicio **FastAPI** para predicción de riesgo de deserción (ensemble: Random Forest, HistGradientBoosting/XGBoost, Stacking).

## Comandos

```bash
pip install -r requirements.txt
python train.py
python -m uvicorn app.main:app --reload --port 5000
python -m unittest tests.test_predict -v
```

Desde la raíz del monorepo:

```bash
npm run ml:train
npm run dev:ml
npm run ml:test
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado y features cargadas |
| POST | `/predict` | Score, nivel, probabilidad, factores, recomendación (formato tesis) |
| GET | `/metrics` | Accuracy, F1, matrices por modelo |

## Artefactos

Tras `train.py` en `models/`:

- `best_model.joblib` — modelo seleccionado por F1
- `features.joblib` — orden de variables
- `metrics.json` — comparación RF / boosting / stacking

Sin modelos, `/predict` usa heurística de respaldo.

Documentación: [docs/machine-learning.md](../docs/machine-learning.md)
