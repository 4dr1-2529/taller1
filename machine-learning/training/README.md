# Entrenamiento

El script principal de entrenamiento es `../train.py` (Random Forest, XGBoost/HistGradientBoosting, Stacking).

```bash
cd machine-learning
python train.py
# o desde la raíz del monorepo:
npm run ml:train
```

Artefactos generados en `../models/`:
- `best_model.joblib` — modelo seleccionado por F1-score
- `metrics.json` / `metrics.csv` — comparación de modelos
- `features.joblib` — orden de variables tesis
